import os
import secrets
import aiohttp
import json
import asyncio
import logging
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
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

# Redirect URI (must match what’s set in your Dropbox App settings)
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
    Disconnect by clearing Dropbox credentials from session.
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
    Returns a summary of sync activity.
    """
    credentials = request.session.get("dropbox_credentials")
    if not credentials:
        raise HTTPException(status_code=400, detail="Dropbox credentials not found. Please connect first.")
    access_token = credentials.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Access token not available.")

    # List files from Dropbox
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

    # Define unsupported file extensions
    unsupported_extensions = [".mp4", ".mov", ".avi", ".mkv", ".ipynb", ".jpg", ".jpeg", ".png", ".gif", ".mp3", ".heic", ".m4v", ".3gp"]

    # Load mapping file for downloaded files
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
        file_id = file_obj.get("id")
        file_rev = file_obj.get("rev")
        local_path = os.path.join(DOWNLOAD_FOLDER, file_name)
        if any(lower_name.endswith(ext) for ext in unsupported_extensions):
            unsupported_files.append(file_name)
            continue
        if file_id in mapping and mapping[file_id].get("rev") == file_rev and os.path.exists(local_path):
            skipped_files.append(file_name)
            continue
        task = download_file_async(access_token, file_obj, local_path, semaphore)
        tasks.append((file_obj, task))

    for file_obj, task in tasks:
        status_str, file_name, error = await task
        if status_str == "downloaded":
            file_id = file_obj.get("id")
            file_rev = file_obj.get("rev")
            mapping[file_id] = {
                "rev": file_rev,
                "local_path": os.path.join(DOWNLOAD_FOLDER, file_name),
                "downloaded_at": datetime.now().isoformat()
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

import time
import logging
import os

def document_loader(file_path):
    """
    Use UnstructuredAPIFileLoader to quickly extract file contents.
    Ensure you have UNSTRUCTURED_API_KEY and UNSTRUCTURED_API_URL set.
    """
    from langchain_community.document_loaders import UnstructuredAPIFileLoader
    start_time = time.time()
    try:
        loader = UnstructuredAPIFileLoader(
            api_key=os.getenv("UNSTRUCTURED_API_KEY"),
            file_path=file_path,
            mode="elements",
            strategy="fast",
            url=os.getenv("UNSTRUCTURED_API_URL"),
        )
        documents = loader.load()
    except Exception as e:
        logging.error(f"Error during extraction for file {file_path}: {e}")
        raise e  # Optionally, you could return an empty string or handle it differently.
    end_time = time.time()
    extraction_time = end_time - start_time
    logging.info(f"Extracted {len(documents)} documents from {file_path} in {extraction_time:.2f} seconds.")
    return "\n".join([doc.page_content for doc in documents])

@app.get("/embed")
async def embed(request: Request):
    """
    Process downloaded files: extract text using UnstructuredAPIFileLoader,
    chunk it using RecursiveCharacterTextSplitter, add metadata, and embed the chunks into Pinecone.
    Skips files that haven't changed.
    Returns a summary.
    """
    logging.info("Starting embedding process.")
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
            logging.info(f"Skipping {file} (unchanged).")
            continue
        logging.info(f"Processing file for embedding: {file}")
        text = document_loader(file_path)
        if not text:
            logging.warning(f"No text extracted from {file}. Skipping.")
            continue
        # Use RecursiveCharacterTextSplitter for chunking
        splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=100)
        chunks = splitter.split_text(text)
        logging.info(f"Extracted {len(chunks)} chunks from {file} using RecursiveCharacterTextSplitter.")
        total_chunks += len(chunks)
        for i, chunk in enumerate(chunks):
            chunk_ids.append(f"{file}_{i}")
            metadatas.append({"file": file, "chunk": i+1, "source": "dropbox"})
        all_chunks.extend(chunks)
        processed_files.append(file)
        embedding_status[file] = file_key

    if all_chunks:
        logging.info(f"Embedding {len(all_chunks)} chunks into Pinecone.")
        from langchain_openai import OpenAIEmbeddings
        from langchain_pinecone import PineconeVectorStore
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=os.getenv("OPENAI_API_KEY"))
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend:app", host="localhost", port=8000, reload=True)
    # uvicorn backend:app --host localhost --port 8000 --reload