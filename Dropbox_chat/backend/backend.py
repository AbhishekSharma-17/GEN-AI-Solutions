import os
import secrets
import aiohttp
import json
import asyncio
import logging
import time
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import langchain_openai
from starlette.middleware.sessions import SessionMiddleware
from langchain_cohere import CohereRerank
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

app = FastAPI()

# CORS configuration to allow requests from your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust for production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session middleware with a consistent secret key and same_site policy
app.add_middleware(SessionMiddleware, secret_key="YOUR_SECRET_KEY_HERE", same_site="lax")

# Load Dropbox credentials from environment variables
DROPBOX_APP_KEY = os.getenv("DROPBOX_APP_KEY")
DROPBOX_APP_SECRET = os.getenv("DROPBOX_APP_SECRET")
if not DROPBOX_APP_KEY or not DROPBOX_APP_SECRET:
    raise Exception("Dropbox credentials must be set in environment variables.")

# Redirect URI (must match your Dropbox App settings)
REDIRECT_URI = "http://localhost:8000/oauth2callback"

# Define local folders and mapping files for downloaded files and embedding status
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOWNLOAD_FOLDER = os.path.join(BASE_DIR, "downloaded_files")
MAPPING_FILE = os.path.join(BASE_DIR, "download_mapping.json")
EMBEDDING_STATUS_FILE = os.path.join(BASE_DIR, "embedding_status.json")
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
if not os.path.exists(MAPPING_FILE):
    with open(MAPPING_FILE, "w") as f:
        json.dump({}, f)
if not os.path.exists(EMBEDDING_STATUS_FILE):
    with open(EMBEDDING_STATUS_FILE, "w") as f:
        json.dump({}, f)

# ----------------------- OAuth and Basic Endpoints -----------------------

@app.get("/connect")
async def connect(request: Request):
    """
    Redirect the user to Dropbox's OAuth2 authorization URL.
    """
    state = secrets.token_urlsafe(16)
    request.session["state"] = state
    auth_url = (
        f"https://www.dropbox.com/oauth2/authorize?"
        f"client_id={DROPBOX_APP_KEY}&redirect_uri={REDIRECT_URI}"
        f"&response_type=code&state={state}&token_access_type=offline"
    )
    logging.info(f"Redirecting to Dropbox OAuth URL: {auth_url}")
    return RedirectResponse(url=auth_url)

@app.get("/oauth2callback")
async def oauth2callback(request: Request, code: str = None, state: str = None):
    """
    Handle Dropbox OAuth2 callback, exchanging code for tokens.
    """
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not found.")
    if state != request.session.get("state"):
        raise HTTPException(status_code=400, detail="State mismatch. Potential CSRF detected.")
    token_url = "https://api.dropboxapi.com/oauth2/token"
    data = {
        "code": code,
        "grant_type": "authorization_code",
        "client_id": DROPBOX_APP_KEY,
        "client_secret": DROPBOX_APP_SECRET,
        "redirect_uri": REDIRECT_URI,
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(token_url, data=data) as resp:
            if resp.status != 200:
                error_text = await resp.text()
                logging.error(f"Error fetching token: {error_text}")
                raise HTTPException(status_code=400, detail=f"Error fetching token: {error_text}")
            token_response = await resp.json()
            logging.info(f"Token response: {token_response}")
    if "access_token" not in token_response:
        raise HTTPException(status_code=400, detail="Access token missing in token response.")
    request.session["dropbox_credentials"] = token_response
    return RedirectResponse(url="http://localhost:3000")

@app.get("/list_files")
async def list_files(request: Request):
    """
    List all files in the user's Dropbox using /2/files/list_folder.
    """
    credentials = request.session.get("dropbox_credentials")
    if not credentials:
        raise HTTPException(status_code=400, detail="Dropbox credentials not found. Please connect first.")
    access_token = credentials.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Access token not available.")
    list_folder_url = "https://api.dropboxapi.com/2/files/list_folder"
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    payload = {"path": "", "recursive": True}
    async with aiohttp.ClientSession() as session:
        async with session.post(list_folder_url, headers=headers, json=payload) as resp:
            if resp.status != 200:
                error_text = await resp.text()
                raise HTTPException(status_code=400, detail=f"Error listing files: {error_text}")
            result = await resp.json()
    return JSONResponse(content=result)

@app.get("/disconnect")
async def disconnect(request: Request):
    """
    Disconnect from Dropbox by clearing credentials from session.
    """
    request.session.pop("dropbox_credentials", None)
    request.session.pop("state", None)
    logging.info("Dropbox credentials cleared from session.")
    return JSONResponse(content={"message": "Disconnected from Dropbox."})

@app.get("/status")
async def status(request: Request):
    """
    Return connection status based on session.
    """
    credentials = request.session.get("dropbox_credentials")
    return JSONResponse(content={"connected": bool(credentials)})

# ----------------------- Sync Endpoint -----------------------

async def get_temporary_link(access_token, file_obj):
    """
    Obtain a temporary (redirectable) link for a file from Dropbox.
    """
    url = "https://api.dropboxapi.com/2/files/get_temporary_link"
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    payload = {"path": file_obj["path_lower"]}
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=payload) as resp:
            if resp.status != 200:
                error_text = await resp.text()
                logging.error(f"Error getting temporary link for {file_obj['name']}: {error_text}")
                return ""
            result = await resp.json()
            return result.get("link", "")

async def download_file_async(access_token, file_obj, local_path, semaphore):
    """
    Download a file from Dropbox using the /2/files/download endpoint.
    """
    file_path = file_obj["path_lower"]
    file_name = file_obj["name"]
    try:
        async with semaphore:
            download_url = "https://content.dropboxapi.com/2/files/download"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Dropbox-API-Arg": f'{{"path": "{file_path}"}}'
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(download_url, headers=headers) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        return ("failed", file_name, error_text)
                    content = await response.read()
                    os.makedirs(os.path.dirname(local_path), exist_ok=True)
                    with open(local_path, 'wb') as f:
                        f.write(content)
            return ("downloaded", file_name, "")
    except Exception as e:
        return ("failed", file_name, str(e))

@app.get("/sync")
async def sync(request: Request):
    """
    Sync Dropbox files: download new or updated files.
    For each downloaded file, also obtain a temporary link.
    Returns a summary of sync activity.
    """
    credentials = request.session.get("dropbox_credentials")
    if not credentials:
        raise HTTPException(status_code=400, detail="Dropbox credentials not found. Please connect first.")
    access_token = credentials.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Access token not available.")
    list_folder_url = "https://api.dropboxapi.com/2/files/list_folder"
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    payload = {"path": "", "recursive": True}
    async with aiohttp.ClientSession() as session:
        async with session.post(list_folder_url, headers=headers, json=payload) as resp:
            if resp.status != 200:
                error_text = await resp.text()
                raise HTTPException(status_code=400, detail=f"Error listing files: {error_text}")
            list_result = await resp.json()
    entries = list_result.get("entries", [])
    total_items = len(entries)
    folder_count = sum(1 for entry in entries if entry.get(".tag") == "folder")
    files_count = total_items - folder_count
    unsupported_extensions = [".mp4", ".mov", ".avi", ".mkv", ".ipynb", ".jpg", ".jpeg", ".png", ".gif", ".mp3", ".heic", ".m4v", ".3gp"]
    mapping = {}
    if os.path.exists(MAPPING_FILE):
        try:
            with open(MAPPING_FILE, "r") as f:
                mapping = json.load(f)
        except Exception as e:
            logging.error(f"Error loading mapping file: {e}")
            mapping = {}
    downloaded_files = []
    skipped_files = []
    unsupported_files = []
    failed_files = []
    semaphore = asyncio.Semaphore(5)
    tasks = []
    for file_obj in entries:
        if file_obj.get(".tag") == "folder":
            continue
        file_name = file_obj.get("name")
        lower_name = file_name.lower()
        file_rev = file_obj.get("rev")
        local_path = os.path.join(DOWNLOAD_FOLDER, file_name)
        if any(lower_name.endswith(ext) for ext in unsupported_extensions):
            unsupported_files.append(file_name)
            continue
        if file_name in mapping and mapping[file_name].get("rev") == file_rev and os.path.exists(local_path):
            skipped_files.append(file_name)
            continue
        task = download_file_async(access_token, file_obj, local_path, semaphore)
        tasks.append((file_obj, task))
    for file_obj, task in tasks:
        status_str, file_name, error = await task
        if status_str == "downloaded":
            file_rev = file_obj.get("rev")
            temp_link = await get_temporary_link(access_token, file_obj)
            mapping[file_name] = {
                "rev": file_rev,
                "local_path": os.path.join(DOWNLOAD_FOLDER, file_name),
                "downloaded_at": datetime.now().isoformat(),
                "temp_link": temp_link
            }
            downloaded_files.append(file_name)
        else:
            failed_files.append({"file": file_name, "error": error})
    with open(MAPPING_FILE, "w") as f:
        json.dump(mapping, f, indent=2)
    summary = {
        "message": "Sync complete",
        "total_items": total_items,
        "folders_count": folder_count,
        "files_count": files_count,
        "new_downloads_count": len(downloaded_files),
        "skipped_files_count": len(skipped_files),
        "unsupported_files_count": len(unsupported_files),
        "failed_files_count": len(failed_files),
        "downloaded_files": downloaded_files,
        "skipped_files": skipped_files,
        "unsupported_files": unsupported_files,
        "failed_files": failed_files
    }
    return JSONResponse(content=summary)

# ----------------------- Embed Endpoint -----------------------
from langchain.text_splitter import RecursiveCharacterTextSplitter

def document_loader(file_path):
    """
    Use UnstructuredAPIFileLoader to quickly extract file contents.
    Ensure UNSTRUCTURED_API_KEY and UNSTRUCTURED_API_URL are set.
    """
    from langchain_community.document_loaders import UnstructuredAPIFileLoader
    start_time = time.time()
    loader = UnstructuredAPIFileLoader(
        api_key=os.getenv("UNSTRUCTURED_API_KEY"),
        file_path=file_path,
        mode="elements",
        strategy="fast",
        url=os.getenv("UNSTRUCTURED_API_URL"),
    )
    documents = loader.load()
    end_time = time.time()
    extraction_time = end_time - start_time
    logging.info(f"Extracted {len(documents)} documents from {file_path} in {extraction_time:.2f} seconds.")
    return "\n".join([doc.page_content for doc in documents])

@app.get("/embed")
async def embed(request: Request):
    """
    Process downloaded files: extract text using UnstructuredAPIFileLoader,
    chunk it using RecursiveCharacterTextSplitter, prepend each chunk with metadata
    (file name, source, and redirectable link), and embed the chunks into Pinecone.
    Skips files that haven't changed.
    Returns a summary.
    """
    logging.info("Starting embedding process.")
    # Load download mapping (to get temporary links)
    try:
        with open(MAPPING_FILE, "r") as f:
            mapping = json.load(f)
        logging.info("Loaded download mapping.")
    except Exception as e:
        logging.error(f"Error loading download mapping: {e}")
        mapping = {}
    # Load embedding status mapping
    embedding_status = {}
    if os.path.exists(EMBEDDING_STATUS_FILE):
        try:
            with open(EMBEDDING_STATUS_FILE, "r") as f:
                embedding_status = json.load(f)
            logging.info("Loaded embedding status mapping.")
        except Exception as e:
            logging.error(f"Error loading embedding status: {e}")
            embedding_status = {}
    processed_files = []
    skipped_files = []
    total_chunks = 0
    all_chunks = []
    chunk_ids = []
    metadatas = []
    for file in os.listdir(DOWNLOAD_FOLDER):
        file_path = os.path.join(DOWNLOAD_FOLDER, file)
        if not os.path.isfile(file_path):
            continue
        stat = os.stat(file_path)
        file_key = f"{file}_{stat.st_size}_{stat.st_mtime}"
        if file in embedding_status and embedding_status[file] == file_key:
            skipped_files.append(file)
            logging.info(f"Skipping {file} for embedding (unchanged).")
            continue
        logging.info(f"Processing file for embedding: {file}")
        text = document_loader(file_path)
        if not text:
            logging.warning(f"No text extracted from {file}. Skipping.")
            continue
        # Use RecursiveCharacterTextSplitter to split text into chunks
        splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=100)
        chunks = splitter.split_text(text)
        logging.info(f"Extracted {len(chunks)} chunks from {file} using RecursiveCharacterTextSplitter.")
        total_chunks += len(chunks)
        # Retrieve temporary link from mapping if available
        temp_link = mapping.get(file, {}).get("temp_link", "")
        # Create metadata header to prepend to each chunk
        metadata_header = f"File: {file}\nSource: Dropbox\nLink: {temp_link}\n\n"
        for i, chunk in enumerate(chunks):
            # Prepend metadata header to chunk text
            chunk_with_metadata = metadata_header + chunk
            chunk_ids.append(f"{file}_{i}")
            metadatas.append({"file": file, "chunk": i+1, "source": "dropbox", "redirect_link": temp_link})
            all_chunks.append(chunk_with_metadata)
        processed_files.append(file)
        embedding_status[file] = file_key
    if all_chunks:
        logging.info(f"Embedding {len(all_chunks)} chunks into Pinecone.")
        from langchain_openai import OpenAIEmbeddings
        from langchain_pinecone import PineconeVectorStore
        embeddings = OpenAIEmbeddings(model="text-embedding-ada-002", api_key=os.getenv("OPENAI_API_KEY"))
        vectorstore = PineconeVectorStore(
            index_name=os.getenv("PINECONE_INDEX_NAME"),
            embedding=embeddings,
            namespace="dropbox_search",
            pinecone_api_key=os.getenv("PINECONE_API_KEY")
        )
        vectorstore.add_texts(texts=all_chunks, metadatas=metadatas, ids=chunk_ids)
        logging.info("Embedding complete: Chunks upserted into Pinecone.")
    else:
        logging.info("No new chunks to embed.")
    try:
        with open(EMBEDDING_STATUS_FILE, "w") as f:
            json.dump(embedding_status, f, indent=2)
        logging.info("Updated embedding status mapping saved.")
    except Exception as e:
        logging.error(f"Error saving embedding status mapping: {e}")
    summary = {
        "message": "Embedding complete",
        "processed_files": processed_files,
        "skipped_files": skipped_files,
        "total_chunks": total_chunks
    }
    logging.info(f"Embedding process summary: {summary}")
    return JSONResponse(content=summary)



@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Chat endpoint that provides responses based on embedded documents in Pinecone.
    Uses Cohere Reranker for better document retrieval and includes source references.
    """
    async def generate_response(retrieval_chain, user_query):
        try:
            async for chunk in retrieval_chain.astream({"input": user_query}):
                try:
                    answer = chunk["answer"]
                    yield f"{answer}"
                except Exception as e:
                    pass
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    try:
        # Initialize OpenAI language model
        llm = ChatOpenAI(model="gpt-4o-mini", api_key = os.getenv("OPENAI_API_KEY")        )

        # Configure retriever with Pinecone
        vectorstore = PineconeVectorStore(
            index_name="testabhishek",
            embedding=OpenAIEmbeddings(model="text-embedding-3-small",api_key = os.getenv("OPENAI_API_KEY")),
            namespace="gdrive_search",
            pinecone_api_key=os.getenv("PINECONE_API_KEY"),
        )

        # Create base retriever
        base_retriever = vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={
                "k": 20,  # Retrieve more documents initially for reranking
            },
        )
        
        # Add Cohere Reranker for better document retrieval
        compressor = CohereRerank(
            cohere_api_key=os.getenv("COHERE_API_KEY"),
            model="rerank-v3.5",
            top_n=4 # Keep top 4 most relevant documents after reranking
        )
        
        # Create compression retriever with Cohere Reranker
        retriever = ContextualCompressionRetriever(
            base_compressor=compressor,
            base_retriever=base_retriever
        )

        # Create enhanced prompt template with source citation instructions
        system_prompt = """
        You are DriveGPT, a universal search assistant that provides CONCISE, accurate responses based on information from across the entire knowledge base and connected applications (Google Drive, Sheets, and other integrated systems). Your primary goal is to deliver precise answers with clear source attribution.

        RESPONSE LENGTH:
        - Keep responses under 300 words unless the question requires detailed explanation
        - Prioritize the most relevant information that directly answers the query
        - Avoid unnecessary background information or elaboration

        QUERY HANDLING:
        - For location queries (e.g., "Where is my test.pdf?"): Specify exactly which system contains the file and provide its path/location
        - For status queries (e.g., "What's the status of my sheet?"): Report the current status, last update, and location
        - For content queries: Extract and summarize the most relevant information
        - For questions without clear answers in the context: State "I cannot find information about this in your knowledge base"

        RESPONSE STRUCTURE:
        - Start with a direct answer identifying the location/system where the information was found
        - Example: "Your test.pdf is stored in Google Drive" or "The project status is tracked in Jira ticket #1234"
        - Use bullet points for lists, steps, or multiple pieces of information
        - Include only essential details that directly answer the query

        CITATION REQUIREMENTS:
        - Use inline citation markers [1], [2], etc. after each claim or piece of information
        - Every factual statement must have a citation
        - Clearly identify the source system (Google Drive, Sheets, Jira, etc.) in each citation
        - Link each citation to the specific document, file, or record where the information appears
        - DO NOT mention chunk numbers or metadata in citations
        - Include only the document name and system in citations

        SOURCE HANDLING:
        - If information appears across multiple systems, cite all relevant sources
        - If sources conflict, acknowledge the discrepancy and cite both sources
        - Prioritize the most recent or authoritative source when appropriate
        - If information is incomplete, clearly state what is known and what is missing

        Context from knowledge base: {context}

        FORMAT YOUR RESPONSE AS:

        [Direct answer identifying where the information was found]

        [Additional essential details with inline citations [1], [2], etc.]

        ---
        ###### Sources

        [1] [Document Name](Link) - [System/App]
        [2] [Document Name](Link) - [System/App]
        """

        prompt = ChatPromptTemplate.from_messages(
            [("system", system_prompt), ("human", "{input}")]
        )

        # Create retrieval chain
        document_chain = create_stuff_documents_chain(llm, prompt)
        retrieval_chain = create_retrieval_chain(retriever, document_chain)

        # Return streaming response
        return StreamingResponse(
            generate_response(retrieval_chain, request.user_query),
            media_type="text/event-stream",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend:app", host="localhost", port=8000, reload=True)
