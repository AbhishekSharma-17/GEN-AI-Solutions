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
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
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

# Define folder for API keys
API_KEYS_DIR = os.path.join(BASE_DIR, "api_keys")
os.makedirs(API_KEYS_DIR, exist_ok=True)
OPENAI_API_KEY_FILE = os.path.join(API_KEYS_DIR, "openai_api_key.json")

os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
if not os.path.exists(MAPPING_FILE):
    with open(MAPPING_FILE, "w") as f:
        json.dump({}, f)
if not os.path.exists(EMBEDDING_STATUS_FILE):
    with open(EMBEDDING_STATUS_FILE, "w") as f:
        json.dump({}, f)

# Helper function to get OpenAI API key
def get_openai_api_key():
    """
    Get the OpenAI API key from the local file.
    Returns the API key as a string.
    """
    try:
        if os.path.exists(OPENAI_API_KEY_FILE):
            with open(OPENAI_API_KEY_FILE, "r") as f:
                data = json.load(f)
                if data and "api_key" in data and data["api_key"]:
                    logging.info("Using OpenAI API key from local file")
                    return data["api_key"]
    except Exception as e:
        logging.error(f"Error reading OpenAI API key from file: {str(e)}")
    
    return os.getenv("OPENAI_API_KEY")  # Fallback to environment variable

# ----------------------- OAuth and Basic Endpoints -----------------------

class ChatRequest(BaseModel):
    user_query: str

class ApiKeyRequest(BaseModel):
    api_key: str = Field(..., description="OpenAI API key")

@app.post("/set-openai-key")
async def set_openai_key(request: ApiKeyRequest):
    """
    Endpoint to receive and store the OpenAI API key from the frontend.
    """
    try:
        # Store the API key in a JSON file
        with open(OPENAI_API_KEY_FILE, "w") as f:
            json.dump({"api_key": request.api_key}, f)
        
        logging.info("OpenAI API key stored successfully")
        return JSONResponse(content={
            "message": "OpenAI API key stored successfully",
            "status": "success"
        })
    except Exception as e:
        logging.error(f"Error storing OpenAI API key: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error storing API key: {str(e)}")

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
    Disconnect from Dropbox by clearing credentials from session and deleting all local data.
    This includes downloaded files, embedding status, mapping files, chunks, and Pinecone embeddings.
    """
    try:
        logging.info("Starting disconnect process")
        results = {
            "session_cleared": False,
            "pinecone_embeddings_deleted": False,
            "downloaded_files_deleted": False,
            "chunks_deleted": False,
            "mappings_reset": False,
            "api_key_deleted": False
        }
        
        # 1. Clear the session
        try:
            request.session.pop("dropbox_credentials", None)
            request.session.pop("state", None)
            request.session.clear()
            results["session_cleared"] = True
            logging.info("Session cleared successfully")
        except Exception as e:
            logging.error(f"Error clearing session: {str(e)}")
        
        # 2. Delete the OpenAI API key file
        try:
            if os.path.exists(OPENAI_API_KEY_FILE):
                os.remove(OPENAI_API_KEY_FILE)
                results["api_key_deleted"] = True
                logging.info("OpenAI API key file deleted")
        except Exception as e:
            logging.error(f"Error deleting OpenAI API key file: {str(e)}")
        
        # 3. Delete all downloaded files (recursively)
        try:
            if os.path.exists(DOWNLOAD_FOLDER) and os.path.isdir(DOWNLOAD_FOLDER):
                import shutil
                
                # Count files before deletion for logging
                file_count = sum(1 for _ in os.listdir(DOWNLOAD_FOLDER) if os.path.isfile(os.path.join(DOWNLOAD_FOLDER, _)))
                
                # Delete all files in the download folder
                for filename in os.listdir(DOWNLOAD_FOLDER):
                    file_path = os.path.join(DOWNLOAD_FOLDER, filename)
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                
                results["downloaded_files_deleted"] = True
                logging.info(f"Deleted {file_count} files from download directory")
        except Exception as e:
            logging.error(f"Error deleting downloaded files: {str(e)}")
        
        # 4. Delete all chunk verification files
        try:
            if os.path.exists(CHUNKS_DIR):
                import shutil
                
                # Count chunks before deletion for logging
                chunk_dirs = 0
                chunk_files = 0
                for root, dirs, files in os.walk(CHUNKS_DIR):
                    chunk_dirs += len(dirs)
                    chunk_files += len(files)
                
                # Delete and recreate the chunks directory
                shutil.rmtree(CHUNKS_DIR)
                os.makedirs(CHUNKS_DIR, exist_ok=True)
                
                results["chunks_deleted"] = True
                logging.info(f"Cleared chunks directory: {chunk_dirs} directories and {chunk_files} files deleted")
        except Exception as e:
            logging.error(f"Error clearing chunks directory: {str(e)}")
        
        # 5. Reset mapping and embedding status files
        try:
            with open(MAPPING_FILE, "w") as f:
                json.dump({}, f)
            logging.info("Download mapping file reset")
            
            with open(EMBEDDING_STATUS_FILE, "w") as f:
                json.dump({}, f)
            logging.info("Embedding status file reset")
            
            results["mappings_reset"] = True
        except Exception as e:
            logging.error(f"Error resetting mapping files: {str(e)}")
        
        # 6. Delete embeddings from Pinecone
        try:
            # Get API key from local storage or environment variable
            api_key = get_openai_api_key()
            if api_key:
                from langchain_openai import OpenAIEmbeddings
                from langchain_pinecone import PineconeVectorStore
                
                # Initialize Pinecone vector store
                vectorstore = PineconeVectorStore(
                    index_name=os.getenv("PINECONE_INDEX_NAME", "testabhishek"),
                    embedding=OpenAIEmbeddings(model="text-embedding-3-small", api_key=api_key),
                    namespace="dropbox_search",
                    pinecone_api_key=os.getenv("PINECONE_API_KEY"),
                )
                
                # Delete all vectors in the namespace using vectorstore.delete
                vectorstore.delete(delete_all=True)
                
                results["pinecone_embeddings_deleted"] = True
                logging.info("All embeddings deleted from Pinecone")
            else:
                logging.warning("OpenAI API key not found, skipping Pinecone embeddings deletion")
        except Exception as e:
            logging.error(f"Error deleting embeddings from Pinecone: {str(e)}")
        
        # Return results
        all_successful = all(results.values())
        return JSONResponse(content={
            "message": "Disconnected from Dropbox and all data has been deleted" if all_successful else "Disconnect partially complete with some errors",
            "details": results,
            "success": all_successful
        })
    except Exception as e:
        logging.error(f"Error in /disconnect endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
import hashlib
import re

# Create a directory for storing chunks for verification
CHUNKS_DIR = os.path.join(BASE_DIR, "chunks")
os.makedirs(CHUNKS_DIR, exist_ok=True)

class EnhancedDocumentSplitter:
    """
    Custom document splitter that is more aware of document structure and provides better chunking.
    """
    def __init__(self, chunk_size=1500, chunk_overlap=150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        # Base splitter for fallback
        self.base_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
    def _is_heading(self, line):
        """Check if a line is likely a heading."""
        # Common heading patterns
        heading_patterns = [
            r"^#+\s+.+$",  # Markdown headings
            r"^[A-Z][A-Za-z\s]{0,50}$",  # Short all-caps or title case lines
            r"^\d+\.\s+[A-Z]",  # Numbered headings
            r"^[A-Z][A-Za-z\s]{0,50}:$"  # Title with colon
        ]
        return any(re.match(pattern, line.strip()) for pattern in heading_patterns)
    
    def _is_list_item(self, line):
        """Check if a line is a list item."""
        list_patterns = [
            r"^\s*[\*\-•]\s+",  # Bullet lists
            r"^\s*\d+\.\s+"     # Numbered lists
        ]
        return any(re.match(pattern, line.strip()) for pattern in list_patterns)
    
    def _get_section_boundaries(self, text):
        """Identify logical section boundaries in the text."""
        lines = text.split("\n")
        boundaries = [0]  # Start of document is always a boundary
        
        for i, line in enumerate(lines):
            if i > 0:
                # Check for section breaks
                if self._is_heading(line):
                    boundaries.append(i)
                # Check for paragraph breaks (empty lines)
                elif line.strip() == "" and i > 0 and i < len(lines) - 1:
                    if lines[i-1].strip() != "" and lines[i+1].strip() != "":
                        boundaries.append(i)
        
        boundaries.append(len(lines))  # End of document is always a boundary
        return boundaries, lines
    
    def split_text(self, text):
        """
        Split text into chunks, trying to preserve logical structure.
        Falls back to base_splitter if the custom logic doesn't produce good chunks.
        """
        if not text or len(text) < self.chunk_size:
            return [text] if text else []
            
        boundaries, lines = self._get_section_boundaries(text)
        chunks = []
        
        # First try to split by logical sections
        for i in range(len(boundaries) - 1):
            section_start = boundaries[i]
            section_end = boundaries[i + 1]
            
            section_lines = lines[section_start:section_end]
            section_text = "\n".join(section_lines)
            
            # If section is too large, split it further
            if len(section_text) > self.chunk_size:
                # For large sections, use the base splitter
                sub_chunks = self.base_splitter.split_text(section_text)
                chunks.extend(sub_chunks)
            else:
                chunks.append(section_text)
        
        # Ensure chunks are not too small by combining adjacent small chunks
        optimized_chunks = []
        current_chunk = ""
        
        for chunk in chunks:
            if len(current_chunk) + len(chunk) + 1 <= self.chunk_size:
                if current_chunk:
                    current_chunk += "\n\n" + chunk
                else:
                    current_chunk = chunk
            else:
                if current_chunk:
                    optimized_chunks.append(current_chunk)
                current_chunk = chunk
        
        if current_chunk:
            optimized_chunks.append(current_chunk)
            
        # If our custom logic produced poor results, fall back to the base splitter
        if not optimized_chunks or any(len(chunk) > self.chunk_size * 1.5 for chunk in optimized_chunks):
            logging.info("Falling back to base splitter due to suboptimal custom chunking")
            return self.base_splitter.split_text(text)
            
        return optimized_chunks

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
    
    # Combine documents with proper spacing between elements
    combined_text = ""
    for doc in documents:
        if combined_text and not combined_text.endswith("\n"):
            combined_text += "\n"
        combined_text += doc.page_content
    
    return combined_text

def save_chunks_for_verification(file_name, chunks, metadatas):
    """
    Save chunks to text files for verification and debugging.
    Uses UTF-8 encoding to handle all Unicode characters.
    """
    file_hash = hashlib.md5(file_name.encode()).hexdigest()[:8]
    chunk_dir = os.path.join(CHUNKS_DIR, file_hash)
    os.makedirs(chunk_dir, exist_ok=True)
    
    try:
        # Save a summary file
        with open(os.path.join(chunk_dir, "summary.txt"), "w", encoding="utf-8") as f:
            f.write(f"File: {file_name}\n")
            f.write(f"Total chunks: {len(chunks)}\n")
            f.write(f"Generated at: {datetime.now().isoformat()}\n\n")
            
            for i, (chunk, metadata) in enumerate(zip(chunks, metadatas)):
                f.write(f"Chunk {i+1}:\n")
                f.write(f"  Length: {len(chunk)} characters\n")
                f.write(f"  Metadata: {json.dumps(metadata, indent=2)}\n\n")
        
        # Save individual chunks
        for i, chunk in enumerate(chunks):
            with open(os.path.join(chunk_dir, f"chunk_{i+1}.txt"), "w", encoding="utf-8") as f:
                f.write(chunk)
        
        logging.info(f"Saved {len(chunks)} chunks for verification at {chunk_dir}")
        return chunk_dir
    except Exception as e:
        logging.error(f"Error saving chunks for verification: {str(e)}")
        # Continue with embedding even if chunk verification fails
        return None

@app.get("/embed")
async def embed(request: Request):
    """
    Process downloaded files: extract text using UnstructuredAPIFileLoader,
    chunk it using EnhancedDocumentSplitter, properly store metadata,
    and embed the chunks into Pinecone.
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
    failed_files = []
    total_chunks = 0
    all_chunks = []
    chunk_ids = []
    metadatas = []
    
    # Create enhanced document splitter
    splitter = EnhancedDocumentSplitter(chunk_size=1500, chunk_overlap=150)
    
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
        try:
            logging.info(f"Processing file for embedding: {file}")
            
            # Extract text from file
            try:
                text = document_loader(file_path)
                if not text:
                    logging.warning(f"No text extracted from {file}. Skipping.")
                    continue
            except Exception as e:
                logging.error(f"Error extracting text from {file}: {str(e)}")
                failed_files.append({"file": file, "error": f"Text extraction failed: {str(e)}"})
                continue
                
            # Split text into chunks
            try:
                chunks = splitter.split_text(text)
                logging.info(f"Extracted {len(chunks)} chunks from {file} using EnhancedDocumentSplitter.")
                total_chunks += len(chunks)
            except Exception as e:
                logging.error(f"Error splitting text from {file}: {str(e)}")
                failed_files.append({"file": file, "error": f"Text splitting failed: {str(e)}"})
                continue
            
            # Retrieve temporary link from mapping if available
            temp_link = mapping.get(file, {}).get("temp_link", "")
            
            file_chunks = []
            file_metadatas = []
            
            for i, chunk in enumerate(chunks, start=1):
                chunk_id = f"{file}_{i}"
                chunk_ids.append(chunk_id)
                
                # Add metadata directly to the chunk content
                metadata_str = f"Source: Dropbox\nDocument: {file}\nChunk: {i}/{len(chunks)}"
                if temp_link:
                    metadata_str += f"\nLink: {temp_link}"
                    
                # Combine metadata with chunk content
                combined_chunk = f"{metadata_str}\n\n{chunk}"
                
                # Create simple metadata for Pinecone
                metadata = {
                    "source": file
                }
                
                metadatas.append(metadata)
                all_chunks.append(combined_chunk)
                
                file_chunks.append(combined_chunk)
                file_metadatas.append(metadata)
            
            # Save chunks for verification
            try:
                save_chunks_for_verification(file, file_chunks, file_metadatas)
            except Exception as e:
                logging.error(f"Error saving chunks for verification for {file}: {str(e)}")
                # Continue even if chunk verification fails
            
            processed_files.append(file)
            embedding_status[file] = file_key
            
        except Exception as e:
            logging.error(f"Unexpected error processing {file}: {str(e)}")
            failed_files.append({"file": file, "error": f"Processing failed: {str(e)}"})
            continue
        
    if all_chunks:
        logging.info(f"Embedding {len(all_chunks)} chunks into Pinecone.")
        from langchain_openai import OpenAIEmbeddings
        from langchain_pinecone import PineconeVectorStore
        
        # Get API key from local storage or environment variable
        api_key = get_openai_api_key()
        if not api_key:
            raise HTTPException(status_code=400, detail="OpenAI API key not found. Please set it using the /set-openai-key endpoint.")
            
        # Use text-embedding-3-small consistently for both embedding and retrieval
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=api_key)
        vectorstore = PineconeVectorStore(
            index_name=os.getenv("PINECONE_INDEX_NAME"),
            embedding=embeddings,
            namespace="dropbox_search",
            pinecone_api_key=os.getenv("PINECONE_API_KEY")
        )
        
        # Add texts with proper metadata separation
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
        "processed_count": len(processed_files),
        "skipped_files": skipped_files,
        "skipped_count": len(skipped_files),
        "failed_files": failed_files,
        "failed_count": len(failed_files),
        "total_chunks": total_chunks,
        "chunks_verification_dir": CHUNKS_DIR if total_chunks > 0 else None
    }
    logging.info(f"Embedding process summary: {summary}")
    return JSONResponse(content=summary)


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Enhanced chat endpoint that provides responses based on embedded documents in Pinecone.
    Uses Cohere Reranker for better document retrieval and includes source references.
    Implements improved retrieval parameters and debugging.
    """
    async def generate_response(retrieval_chain, user_query):
        try:
            async for chunk in retrieval_chain.astream({"input": user_query}):
                try:
                    answer = chunk["answer"]
                    yield f"{answer}"
                except Exception as e:
                    logging.error(f"Error in streaming response: {str(e)}")
                    pass
        except Exception as e:
            logging.error(f"Error in generate_response: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    try:
        # Get API key from local storage or environment variable
        api_key = get_openai_api_key()
        if not api_key:
            raise HTTPException(status_code=400, detail="OpenAI API key not found. Please set it using the /set-openai-key endpoint.")
            
        # Initialize OpenAI language model
        llm = ChatOpenAI(model="gpt-4o-mini", api_key=api_key)

        # Configure retriever with Pinecone - use same embedding model as in /embed endpoint
        vectorstore = PineconeVectorStore(
            index_name=os.getenv("PINECONE_INDEX_NAME", "testabhishek"),
            embedding=OpenAIEmbeddings(model="text-embedding-3-small", api_key=api_key),
            namespace="dropbox_search",
            pinecone_api_key=os.getenv("PINECONE_API_KEY"),
        )

        # Create base retriever with optimized parameters
        base_retriever = vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={
                "k": 30,  # Retrieve more documents initially for reranking
            },
        )
        
        # Add Cohere Reranker with optimized parameters
        compressor = CohereRerank(
            cohere_api_key=os.getenv("COHERE_API_KEY"),
            model="rerank-v3.5",
            top_n=6  # Keep top 6 most relevant documents after reranking
        )
        
        # Create compression retriever with Cohere Reranker
        retriever = ContextualCompressionRetriever(
            base_compressor=compressor,
            base_retriever=base_retriever
        )

        # Log the query for debugging
        logging.info(f"Processing chat query: {request.user_query}")

        # Create enhanced prompt template with source citation instructions
        system_prompt = """
        You are DropboxGPT, an assistant specialized in answering questions using information extracted from Dropbox documents.
        Your responses must be accurate and based solely on the embedded Dropbox data.
        Always include source attributions with the file name and a redirectable link when available.
        If the answer is not found in the provided documents, state "I cannot find information about this in your Dropbox data."
        
        Response Guidelines:
        - Be thorough and detailed in your answers, making sure to include all relevant information from the context.
        - Use bullet points or numbered lists for clarity if needed.
        - Provide inline citations in the format [1], [2], etc. referencing the file names and links.
        - If multiple chunks from the same file contain relevant information, combine and synthesize that information.
        - Pay special attention to any tables, lists, or structured data in the context.
        
        Context from knowledge base: {context}
        
        Format your response as:
        
        [Direct answer with key details and inline citations]
        
        ---
        ###### Sources
        
        [1] [File Name](Link)
        [2] [File Name](Link)
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
        logging.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend:app", host="localhost", port=8000, reload=True)
    # uvicorn backend:app --host localhost --port 8000 --reload
