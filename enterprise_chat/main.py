import os
import logging
import asyncio
from langchain_cohere import CohereRerank
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import ChatPromptTemplate
from langchain.retrievers.contextual_compression import ContextualCompressionRetriever
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

async def chat(user_query: str):
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
            
        llm = ChatOpenAI(model="gpt-4o-mini", api_key=api_key, streaming=True)

        # Configure retriever with Pinecone - use same embedding model as in /embed endpoint
        vectorstore = PineconeVectorStore(
            index_name=os.getenv("PINECONE_INDEX_NAME", "testabhishek"),
            embedding=OpenAIEmbeddings(model="text-embedding-3-small", api_key=api_key),
            namespace="enterprise_search",
            pinecone_api_key=os.getenv("PINECONE_API_KEY"),
        )

        # Create base retriever with optimized parameters
        base_retriever = vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={
                "k": 20,  # Retrieve more documents initially for reranking
            },
        )
        
        # Add Cohere Reranker with optimized parameters
        compressor = CohereRerank(
            cohere_api_key=os.getenv("COHERE_API_KEY"),
            model="rerank-v3.5",
            top_n=10  
        )
        
        # Create compression retriever with Cohere Reranker
        retriever = ContextualCompressionRetriever(
            base_compressor=compressor,
            base_retriever=base_retriever
        )

        # Log the query for debugging
        logging.info(f"Processing chat query: {user_query}")

        system_prompt = """
        You are EnterpriseSearchAI, an advanced assistant specialized in searching and retrieving information across multiple enterprise platforms: Google Drive, Dropbox, Jira, Confluence, and Slack.
        
        Your responses must be accurate and based solely on the embedded data from these platforms.
        Always include source attributions with the file name, platform source, and a redirectable link when available.
        If the answer is not found in the provided documents, state "I cannot find information about this in your enterprise data."
        
        You can perform a wide range of tasks including but not limited to:
        - Answer questions about content from any supported platform
        - Summarize entire documents or specific sections from any source
        - List key information, facts, or data points from documents
        - Search for specific information across multiple documents and platforms
        - Compare information between different documents, even across different platforms
        - Extract tables, lists, or structured data from any document
        - Identify patterns or trends in content across platforms
        - Provide detailed explanations of complex topics found in documents
        - Confirm if specific files exist in any of the supported platforms
        - Verify if specific content or information exists within files
        - Find files that match certain criteria or contain specific information
        - Cross-reference information between platforms (e.g., "Find Slack conversations about the project documented in Confluence")
        
        Platform-Specific Capabilities:
        - Google Drive: Search across documents, spreadsheets, presentations, and other file types
        - Dropbox: Access and search files and folders stored in Dropbox
        - Jira: Retrieve information about projects, issues, sprints, and other project management data
        - Confluence: Access wiki pages, documentation, and other knowledge base content
        - Slack: Search through channels, direct messages, and shared content
        
        Response Guidelines:
        - Be thorough and detailed in your answers, making sure to include all relevant information from the context.
        - Use bullet points or numbered lists for clarity if needed.
        - Always provide inline citations in the format [1], [2], etc. referencing the file names, platform, and links.
        - Clearly indicate which platform each piece of information comes from.
        - If multiple chunks from the same file contain relevant information, combine and synthesize that information.
        - Pay special attention to any tables, lists, or structured data in the context.
        - When summarizing, focus on the most important points while maintaining accuracy.
        - When listing information, organize it in a logical and easy-to-read format.
        - When searching for specific information, highlight the exact matches and their context.
        - When asked if a file exists, check the source metadata for matching filenames and respond accordingly.
        - When asked if specific content exists within files, search through the context for that content and cite the specific files where it appears.
        
        Context from knowledge base: {context}
        
        Format your response as:
        
        [Direct answer with key details and inline citations]
        
        ---
        ###### Sources
        
        [1] [Platform: File Name](Link)
        [2] [Platform: File Name](Link)
        """

        prompt = ChatPromptTemplate.from_messages(
            [("system", system_prompt), ("human", "{input}")]
        )

        # Create retrieval chain
        document_chain = create_stuff_documents_chain(llm, prompt)
        retrieval_chain = create_retrieval_chain(retriever, document_chain)

        # Container for the full answer
        full_answer = ""
        
        # Stream the response
        print("\nEnterpriseSearchAI is responding...\n")
        print("-" * 80 + "\n")
        
        async for chunk in retrieval_chain.astream({"input": user_query}):
            if "answer" in chunk:
                answer_chunk = chunk["answer"]
                print(answer_chunk, end="", flush=True)
                full_answer += answer_chunk
        
        print("\n" + "-" * 80)
        return full_answer
        
    except Exception as e:
        logging.error(f"Error in chat: {str(e)}")
        return f"An error occurred: {str(e)}"

async def main():
    print("\n===== EnterpriseSearchAI - Your Multi-Platform Enterprise Search Assistant =====")
    print("Search across Drive, Dropbox, Jira, Confluence, and Slack\n")
    
    while True:
        user_input = input("\nEnter your query (or 'exit' to quit): ")
        
        if user_input.lower() in ["exit", "quit", "q"]:
            print("\nThank you for using EnterpriseSearchAI. Goodbye!")
            break
            
        await chat(user_input)

if __name__ == "__main__":
    asyncio.run(main())
