import os
import logging
import asyncio
import shutil
import json
import time
import re
from typing import Dict, Any
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain
from langchain.prompts import ChatPromptTemplate
from langchain.retrievers.contextual_compression import ContextualCompressionRetriever
from langchain_cohere import CohereRerank
from openai import AuthenticationError
from google.api_core import exceptions as google_exceptions
from langchain_community.callbacks.manager import get_openai_callback
from token_cost_manager import TokenCostManager
from decimal import Decimal
import uvicorn
from unstructured_processor import process_unstructured
from image_processor import process_image

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust this to match your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to store API keys and provider
api_key = None
unstructured_api_key = None
provider = None
current_model = None
unstructured_api_url = "https://api.unstructuredapp.io/general/v0/general"

# Initialize state management class
class StateManager:
    def __init__(self):
        self.reset()

    def reset(self):
        self.cumulative_tokens = 0
        self.cumulative_cost = Decimal('0')

state = StateManager()

async def generate_document_queries(
    document_content: str, num_queries: int = 4, max_tokens: int = 4000
) -> Dict[str, Any]:
    global api_key, provider, current_model
    
    if not api_key or not provider or not current_model:
        raise ValueError("API key, provider, and model not initialized. Please call /initialize first.")
    
    # Truncate the document content to fit within the max_tokens limit
    truncated_content = document_content[:max_tokens]
    
    system_prompt = f"""
    Generate {num_queries} different questions that could be asked about the following document content:
    Analyze the document content properly before generating questions.
    Generate unique questions about this doc which will lure users to interact with it.
    Based on the context create personalized questions.

    Response Rules:
        1. Each question should be on a new line.
        2. Do not include any comments or instructions in the response.
        3. Do not include any numbers, bullet points, or special characters in the response.
        4. Questions should be relevant to the document content provided and very short and concise to the point.
    
    {truncated_content}
    """
    print("---------------------------------Generating Questions------------------------------------------")
    prompt = system_prompt
    
    if provider == "openai":
        llm = ChatOpenAI(api_key=api_key, model=current_model)
    elif provider == "gemini":
        llm = ChatGoogleGenerativeAI(api_key=api_key, model=current_model)
    else:
        raise ValueError(f"Invalid provider: {provider}")
        
    with get_openai_callback() as cb:
        response = llm.invoke(prompt)
        queries = response.content.split("\n")
        
        input_tokens = cb.prompt_tokens
        output_tokens = cb.completion_tokens
        total_tokens = cb.total_tokens
        
        total_cost, input_cost, output_cost = await TokenCostManager().calculate_cost(
            input_tokens, output_tokens, model_name=current_model
        )
        
        state.cumulative_tokens += total_tokens
        state.cumulative_cost += Decimal(str(total_cost))

    # Filter out any empty strings from the split
    filtered_queries = [query.strip() for query in queries if query.strip()]
    
    return {
        "queries": filtered_queries,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
        "input_cost": float(input_cost),
        "output_cost": float(output_cost),
        "total_cost": float(total_cost),
        "cumulative_tokens": state.cumulative_tokens,
        "cumulative_cost": float(state.cumulative_cost)
    }

@app.get("/")
async def root():
    return JSONResponse(
        content={"message": "Advanced PDF API"}, status_code=200
    )

@app.post("/global_reset")
async def reset_cumulative():
    """
    Endpoint to reset the cumulative tokens and cost.
    """
    state.reset()
    return JSONResponse(
        content={
            "message": "Cumulative tokens and cost have been reset",
            "resetVar": "true"
        },
        status_code=200
    )

@app.post("/initialize")
async def initialize_llm(data: Dict[str, str]):
    """
    Endpoint for initializing the API keys and provider.
    """
    global api_key, unstructured_api_key, provider, current_model
    
    provider = data.get("provider", "openai").lower()
    api_key = data.get("api_key")
    unstructured_api_key = data.get("unstructured_api_key")
    
    if not api_key:
        raise HTTPException(status_code=400, detail="API key is required")
    
    if not unstructured_api_key:
        raise HTTPException(status_code=400, detail="Unstructured API key is required")
    
    try:
        if provider == "openai":
            # Check if the OpenAI API key is valid
            try:
                test_llm = ChatOpenAI(api_key=api_key, model="gpt-3.5-turbo")
                test_llm.invoke("Test")
            except AuthenticationError:
                raise HTTPException(status_code=401, detail="Invalid OpenAI API key")
            
            current_model = "gpt-4o-mini"
        elif provider == "gemini":
            # Check if the Google API key is valid
            try:
                test_llm = ChatGoogleGenerativeAI(api_key=api_key, model="gemini-1.5-flash")
                test_llm.invoke("Test")
            except google_exceptions.PermissionDenied:
                raise HTTPException(status_code=401, detail="Invalid Google API key")
            
            current_model = "gemini-1.5-flash"
        else:
            raise HTTPException(status_code=400, detail="Invalid provider. Choose either 'openai' or 'gemini'")
        
        return JSONResponse(
            content={"message": f"API keys and provider initialized successfully with {provider.capitalize()} using model {current_model}", "provider":f"{provider}"},
            status_code=200
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Error initializing API keys and provider: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error initializing API keys and provider: {str(e)}")

@app.post("/upload")
async def upload_file(user_id: str, file: UploadFile = File(...)):
    """
    Endpoint for uploading a PDF file.
    Returns the file path of the uploaded file.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save the uploaded file
    user_upload_dir = f"uploads/{user_id}"
    os.makedirs(user_upload_dir, exist_ok=True)
    file_path = f"{user_upload_dir}/{file.filename}"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    logging.info(f"File uploaded for user {user_id}: {file_path}")
    
    return JSONResponse(
        content={
            "message": "File uploaded successfully",
            "file_path": file_path
        },
        status_code=200
    )

@app.post("/embed")
async def embed_pdf(data: Dict[str, str]):
    """
    Endpoint for processing and embedding a PDF file.
    """
    global api_key, unstructured_api_key, provider, current_model
    
    if not api_key or not provider or not current_model:
        raise HTTPException(status_code=400, detail="API key, provider, and model not initialized. Please call /initialize first.")
    
    file_path = data.get("file_path")
    user_id = data.get("user_id")
    
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    if not re.match(r'.*\.pdf$', file_path, re.IGNORECASE):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    
    try:
        start_time = time.time()
        
        # Get the mode from the request data, default to "hi_res" if not provided
        mode = data.get("mode", "hi_res")
        if mode not in ["fast", "hi_res"]:
            raise HTTPException(status_code=400, detail="Invalid mode. Must be either 'fast' or 'hi_res'")

        # Process text and images in parallel
        try:
            text_task = asyncio.create_task(process_unstructured(file_path, unstructured_api_key, unstructured_api_url, mode))
            image_task = asyncio.create_task(process_image(file_path, api_key))

            unstructured_result, image_result = await asyncio.gather(text_task, image_task)

            split_docs = unstructured_result["split_docs"]
            table_count = unstructured_result["table_count"]
            image_count = image_result["image_count"]
        except asyncio.CancelledError:
            logging.error("Tasks were cancelled. Cleaning up...")
            for task in [text_task, image_task]:
                if not task.done():
                    task.cancel()
            await asyncio.gather(*[text_task, image_task], return_exceptions=True)
            raise HTTPException(status_code=500, detail="Processing was interrupted")
        except Exception as e:
            logging.error(f"Error during parallel processing: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error during processing: {str(e)}")

        # Combine text and image chunks
        combined_chunks = split_docs + image_result["image_chunks"]
        logging.info(f"Combined chunks: {len(combined_chunks)} (Text: {len(split_docs)}, Image: {len(image_result['image_chunks'])})")
        logging.info(f"Total images in the PDF: {image_count}")
        logging.info(f"Total tables in the PDF: {table_count}")

        # Initialize embeddings
        if provider == "openai":
            embedding_model = "text-embedding-3-small"
            embeddings = OpenAIEmbeddings(api_key=api_key, model=embedding_model)
        elif provider == "gemini":
            embedding_model = "models/text-embedding-004"
            embeddings = GoogleGenerativeAIEmbeddings(api_key=api_key, model=embedding_model)
        else:
            raise ValueError(f"Invalid provider: {provider}")

        logging.info(f"Creating vectorstore with {len(combined_chunks)} chunks")
        vectorstore = FAISS.from_documents(combined_chunks, embeddings)
        logging.info("Vectorstore created successfully")
        # Save the vectorstore for the specific user
        vectorstore_path = f"vectorstore/{user_id}"
        os.makedirs(vectorstore_path, exist_ok=True)
        vectorstore.save_local(vectorstore_path)
        logging.info(f"FAISS vector store created and saved successfully for user {user_id}")

        # Calculate embedding tokens and cost
        embedding_tokens = TokenCostManager().count_string_tokens(prompt="\n".join([chunk.page_content for chunk in combined_chunks]), model=embedding_model)
        embedding_cost = TokenCostManager().calculate_cost_by_tokens(num_tokens=embedding_tokens, model=embedding_model, token_type="input")
        
        # Generate questions
        # Use a subset of the combined chunks for question generation
        query_content = "\n".join([chunk.page_content for chunk in combined_chunks[:20]])  # Adjust the number of chunks as needed
        query_result = await generate_document_queries(query_content, num_queries=4, max_tokens=4000)
        
        # Update cumulative usage
        state.cumulative_tokens += embedding_tokens + query_result["total_tokens"]
        state.cumulative_cost += Decimal(str(embedding_cost)) + Decimal(str(query_result["total_cost"]))

        end_time = time.time()
        response_time = end_time - start_time
        
        return JSONResponse(
            content={
                "message": "Document embedded successfully",
                "queries": query_result["queries"],
                "embedding_tokens": embedding_tokens,
                "embedding_cost": float(embedding_cost),
                "query_input_tokens": query_result["input_tokens"],
                "query_output_tokens": query_result["output_tokens"],
                "query_total_tokens": query_result["total_tokens"],
                "query_input_cost": float(query_result["input_cost"]),
                "query_output_cost": float(query_result["output_cost"]),
                "query_total_cost": float(query_result["total_cost"]),
                "total_tokens": embedding_tokens + query_result["total_tokens"],
                "total_cost": float(embedding_cost + Decimal(str(query_result["total_cost"]))),
                "cumulative_tokens": state.cumulative_tokens,
                "cumulative_cost": float(state.cumulative_cost),
                "response_time": response_time,
                "image_count": image_count,
                "table_count": table_count
            },
            status_code=200,
        )
    except Exception as e:
        logging.error(f"Error processing file for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/chat")
async def chat(user_id: str, data: Dict[str, Any]):
    """
    Endpoint for chatting with the AI about the embedded PowerPoint content.
    Uses a persistent FAISS vector store for retrieval specific to a user.
    """
    global api_key, provider, current_model
    
    if not api_key or not provider or not current_model:
        raise HTTPException(status_code=400, detail="API key, provider, and model not initialized. Please call /initialize first.")
    
    question = data.get("question", "")
    model = data.get("model")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    
    vectorstore_path = f"vectorstore/{user_id}"
    if not os.path.exists(vectorstore_path):
        raise HTTPException(status_code=400, detail=f"No document has been embedded for user {user_id}")

    insights = {}

    async def generate_response():
        try:
            start_time = time.time()
            
            # Initialize embeddings
            if provider == "openai":
                embeddings = OpenAIEmbeddings(api_key=api_key, model="text-embedding-3-small")
            elif provider == "gemini":
                embeddings = GoogleGenerativeAIEmbeddings(api_key=api_key, model="models/text-embedding-004")
            else:
                raise ValueError(f"Invalid provider: {provider}")

            try:
                vectorstore = FAISS.load_local(vectorstore_path, embeddings, allow_dangerous_deserialization=True)
            except Exception as e:
                logging.error(f"Error loading vector store for user {user_id}: {str(e)}")
                yield f"Error: Unable to load the vector store. Please try embedding the document again."
                return

            retriever = vectorstore.as_retriever(search_kwargs={"k": 20})
            
            prompt = ChatPromptTemplate.from_template(
                """
You are an AI assistant specialized in analyzing PDF documents. Your role is to help users understand and extract information from their documents in a conversational way. Given the following document content, please provide a clear and concise response to the user's question. If the information is not directly available in the context, say so instead of making assumptions.

*Context from the document:*
{context}

*User's Question:*
{input}

*Instructions:*

1. *If the user asks for a summary*, provide a concise overview of the main points from the context using bullet points or numbered lists for clarity.
   
2. *If the user asks for an elaboration or detailed explanation*, provide a comprehensive answer with specific examples and details from the context, using subsections or quotes from the document to enhance clarity.

3. *Always refer to the context when answering.* Use phrases like "According to the document," or "The PDF mentions that" to anchor your responses in the given information.

4. *For queries about specific sections or pages*, focus your answer solely on that part of the document and use quotes if applicable to maintain precision.

5. *If the user's question is not directly addressed in the context*, state that the information is not available in the given document content without attempting to infer additional details.

6. *Generate the response in markdown format only.* Utilize headings, bullet points, bold text, italics, and blockquotes to improve readability and structure.

7. *Be consistent in markdown format.* Ensure that the markdown syntax is appropriate and correctly applied to all parts of the response.

8. *Ensure clarity and structure.* The generated response must be clear, well-organized, and directly address the user's request, maintaining a professional tone.

9. *Include references and sources.* At the end of your response, add a "References" section that cites the specific pages or sections of the document you used to formulate your answer.

*Guidelines for Markdown Responses:*

- Use headings for sections, starting with ### for main headings and #### for subheadings.
- Bullet points should begin with a single asterisk `* ` followed by a space.
- Numbered lists use numbers followed by a period and a space (e.g., `1. `).
- Quotes from the document should be enclosed in blockquotes using the > symbol.
- Bold important points using double asterisks ** around the text.
- Italics for emphasis can be applied with single asterisk * around the text.
- For the "References" section, use a numbered list to cite sources.

Your response should be based on the instructions and guidelines provided above, formatted entirely in Markdown, and include a "References" section at the end.
"""
            )

            # Initialize LLM
            if model:
                try:
                    if provider == "openai":
                        llm_to_use = ChatOpenAI(api_key=api_key, model=model, streaming=True, stream_usage=True)
                    elif provider == "gemini":
                        llm_to_use = ChatGoogleGenerativeAI(api_key=api_key, model=model, streaming=True)
                    else:
                        raise ValueError(f"Invalid provider: {provider}")
                    logging.info(f"Using specified model: {model}")
                except Exception as e:
                    logging.error(f"Error initializing LLM with model {model}: {str(e)}")
                    yield f"Error: Unable to use the specified model {model}. Using the default model instead."
                    if provider == "openai":
                        llm_to_use = ChatOpenAI(api_key=api_key, model=current_model, streaming=True, stream_usage=True)
                    elif provider == "gemini":
                        llm_to_use = ChatGoogleGenerativeAI(api_key=api_key, model=current_model, streaming=True)
                    logging.info(f"Using default model: {current_model}")
            else:
                if provider == "openai":
                    llm_to_use = ChatOpenAI(api_key=api_key, model=current_model, streaming=True,stream_usage=True)
                elif provider == "gemini":
                    llm_to_use = ChatGoogleGenerativeAI(api_key=api_key, model=current_model, streaming=True)
                logging.info(f"Using default model: {current_model}")
            
            compressor = CohereRerank(cohere_api_key=os.getenv("COHERE_API_KEY"), top_n=7, model="rerank-v3.5")
            compression_retriever = ContextualCompressionRetriever(base_compressor=compressor, base_retriever=retriever)
            
            document_chain = create_stuff_documents_chain(llm_to_use, prompt)
            retrieval_chain = create_retrieval_chain(compression_retriever, document_chain)
            logging.info(f"Retrieval chain created for user {user_id}")

            with get_openai_callback() as cb:
                response = retrieval_chain.astream({"input": question})
                async for chunk in response:
                    if "answer" in chunk:
                        yield chunk["answer"]
                
                input_tokens = cb.prompt_tokens
                output_tokens = cb.completion_tokens
                total_tokens = cb.total_tokens
                
                total_cost, input_cost, output_cost = await TokenCostManager().calculate_cost(
                    input_tokens, output_tokens, model_name=current_model
                )
                
                state.cumulative_tokens += total_tokens
                state.cumulative_cost += Decimal(str(total_cost))

            end_time = time.time()
            response_time = end_time - start_time

            # Prepare metadata
            metadata = {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
                "input_cost": float(input_cost),
                "output_cost": float(output_cost),
                "total_cost": float(total_cost),
                "cumulative_tokens": state.cumulative_tokens,
                "cumulative_cost": float(state.cumulative_cost),
                "response_time": response_time
            }

            # Yield metadata as JSON in the last chunk
            yield "\n\nMETADATA:" + json.dumps(metadata)

        except Exception as e:
            logging.error(f"Error during chat for user {user_id}: {str(e)}")
            yield f"Error: {str(e)}"

    async def response_and_metadata():
        response_content = ""
        metadata = None
        async for chunk in generate_response():
            if chunk.startswith("\n\nMETADATA:"):
                metadata = json.loads(chunk.replace("\n\nMETADATA:", ""))
            else:
                response_content += chunk
                yield chunk
        if metadata:
            yield json.dumps(metadata)
            
            # # Format metadata as Markdown
            # metadata_md = "\n\n### Metadata\n"
            # for key, value in metadata.items():
            #     if isinstance(value, float):
            #         metadata_md += f"* *{key}*: {value:.6f}\n"
            #     else:
            #         metadata_md += f"* *{key}*: {value}\n"
            # yield metadata_md

    return StreamingResponse(response_and_metadata(), media_type="text/event-stream")

@app.delete("/delete_vectorstore/{user_id}")
async def delete_vectorstore(user_id: str):
    """
    Endpoint to delete the vectorstore for a specific user.
    """
    vectorstore_path = f"vectorstore/{user_id}"
    if not os.path.exists(vectorstore_path):
        raise HTTPException(status_code=404, detail=f"No vectorstore found for user {user_id}")
    
    try:
        shutil.rmtree(vectorstore_path)
        logging.info(f"Vectorstore deleted for user {user_id}")
        return JSONResponse(
            content={"message": f"Vectorstore deleted successfully for user {user_id}"},
            status_code=200
        )
    except Exception as e:
        logging.error(f"Error deleting vectorstore for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting vectorstore: {str(e)}")

if __name__ == "_main_":
    uvicorn.run("backend:app", host="localhost", port=8000, reload=True)
    
    # uvicorn backend:app --host localhost --port 8000 --reload
