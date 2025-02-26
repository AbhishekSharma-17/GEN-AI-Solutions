import os
import json
import logging
import asyncio
import google_auth_oauthlib.flow
import aiohttp
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv

# Define current directory for absolute paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# Configure logging with file output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(CURRENT_DIR, "gdrive_chat.log"))
    ]
)

# Allow insecure transport for local development.
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

load_dotenv()

# Create FastAPI app instance.
app = FastAPI()

# Configure CORS for React frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use Starlette's session middleware; set a secure secret key.
app.add_middleware(SessionMiddleware, secret_key="YOUR_SECRET_KEY_HERE")

# Define folder for client secrets.
CLIENT_SECRETS_DIR = os.path.join(CURRENT_DIR, "client_secrets")
os.makedirs(CLIENT_SECRETS_DIR, exist_ok=True)

# Define folder for downloaded files.
DOWNLOAD_FOLDER = os.path.join(CURRENT_DIR, "downloaded_files")
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

# Define folder for the mapping file.
# Use absolute paths to ensure files are created in the correct location
MAPPING_FOLDER = os.path.join(CURRENT_DIR, "mapping_data")
if not os.path.exists(MAPPING_FOLDER):
    os.makedirs(MAPPING_FOLDER)
MAPPING_FILE = os.path.join(MAPPING_FOLDER, "download_mapping.json")
EMBEDDING_STATUS_FILE = os.path.join(MAPPING_FOLDER, "embedding_status.json")

# Initialize mapping files if they don't exist
if not os.path.exists(MAPPING_FILE):
    with open(MAPPING_FILE, "w") as f:
        json.dump({}, f)
        
# Ensure embedding status file exists and is writable
try:
    if not os.path.exists(EMBEDDING_STATUS_FILE):
        with open(EMBEDDING_STATUS_FILE, "w") as f:
            json.dump({}, f)
        logging.info(f"Created new embedding status file at {EMBEDDING_STATUS_FILE}")
    else:
        # Test if file is readable
        with open(EMBEDDING_STATUS_FILE, "r") as f:
            try:
                embedding_status = json.load(f)
                logging.info(f"Successfully loaded existing embedding status with {len(embedding_status)} entries")
            except json.JSONDecodeError:
                logging.warning(f"Embedding status file exists but is not valid JSON. Creating new file.")
                with open(EMBEDDING_STATUS_FILE, "w") as f:
                    json.dump({}, f)
except Exception as e:
    logging.error(f"Error initializing embedding status file: {str(e)}")
    # Create the file in the current directory as a fallback
    EMBEDDING_STATUS_FILE = "embedding_status.json"
    with open(EMBEDDING_STATUS_FILE, "w") as f:
        json.dump({}, f)
    logging.info(f"Created embedding status file in current directory as fallback")

# Log that we're initializing the application
logging.info(f"Initializing application with mapping folder: {MAPPING_FOLDER}")
logging.info(f"Embedding status file: {EMBEDDING_STATUS_FILE}")
logging.info(f"Download folder: {DOWNLOAD_FOLDER}")

# Import UnstructuredAPIFileLoader.
from langchain_community.document_loaders import UnstructuredAPIFileLoader
### Helper Functions ###

async def download_file_async(service, file_obj, local_path, semaphore):
    """Asynchronously download a file from Google Drive"""
    mime_type = file_obj.get("mimeType")
    file_name = file_obj.get("name")
    file_id = file_obj.get("id")
    
    try:
        async with semaphore:  # Control concurrency with semaphore
            if mime_type.startswith("application/vnd.google-apps"):
                # For Google Docs formats, export as PDF
                download_url = f"https://www.googleapis.com/drive/v3/files/{file_id}/export?mimeType=application/pdf"
                if not local_path.lower().endswith(".pdf"):
                    local_path += ".pdf"
            else:
                download_url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
            
            # Get credentials from service
            headers = {
                "Authorization": f"Bearer {service._http.credentials.token}"
            }
            
            # Use aiohttp for async HTTP requests
            async with aiohttp.ClientSession() as session:
                async with session.get(download_url, headers=headers) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logging.error(f"Error downloading {file_name}: HTTP {response.status} - {error_text}")
                        return ("failed", f"Failed: '{file_name}' - HTTP {response.status}")
                    
                    # Create directory if it doesn't exist
                    os.makedirs(os.path.dirname(local_path), exist_ok=True)
                    
                    # Use async file writing with chunked download
                    with open(local_path, 'wb') as f:
                        # Download in chunks of 1MB for better performance
                        chunk_size = 1024 * 1024
                        total_size = 0
                        
                        async for chunk in response.content.iter_chunked(chunk_size):
                            f.write(chunk)
                            total_size += len(chunk)
                    
                    logging.info(f"Downloaded file: {file_name} ({total_size/1024/1024:.2f} MB)")
                    return ("downloaded", f"Downloaded: '{file_name}'")
    except Exception as e:
        logging.error(f"Error downloading file {file_name}: {str(e)}")
        return ("failed", f"Failed: '{file_name}' - {str(e)}")

def download_file(service, file_obj, local_path):
    mime_type = file_obj.get("mimeType")
    file_name = file_obj.get("name")
    try:
        if mime_type.startswith("application/vnd.google-apps"):
            # For Google Docs formats, export as PDF.
            request = service.files().export_media(fileId=file_obj.get("id"), mimeType='application/pdf')
            if not local_path.lower().endswith(".pdf"):
                local_path += ".pdf"
        else:
            request = service.files().get_media(fileId=file_obj.get("id"))
        from googleapiclient.http import MediaIoBaseDownload
        import io
        with io.FileIO(local_path, 'wb') as fh:
            # Use a larger chunk size (1MB) for better performance
            downloader = MediaIoBaseDownload(fh, request, chunksize=1024*1024)
            done = False
            while not done:
                status, done = downloader.next_chunk()
        logging.info(f"Downloaded file: {file_name}")
        return ("downloaded", f"Downloaded: '{file_name}'")
    except Exception as e:
        logging.error(f"Error downloading file {file_name}: {str(e)}")
        return ("failed", f"Failed: '{file_name}' - {str(e)}")

def update_mapping(file_obj, local_file_name):
    drive_link = f"https://drive.google.com/file/d/{file_obj.get('id')}/view"
    if os.path.exists(MAPPING_FILE):
        with open(MAPPING_FILE, "r") as f:
            try:
                mapping = json.load(f)
            except json.JSONDecodeError:
                mapping = {}
    else:
        mapping = {}
    mapping[local_file_name] = drive_link
    with open(MAPPING_FILE, "w") as f:
        json.dump(mapping, f)
    logging.info(f"Updated mapping for {local_file_name}")

def document_loader(file_path):
    # Use UnstructuredAPIFileLoader to extract file contents.
    loader = UnstructuredAPIFileLoader(
        api_key=os.getenv("UNSTRUCTURED_API_KEY"),
        file_path=file_path,
        mode="elements",
        strategy="fast",
        url=os.getenv("UNSTRUCTURED_API_URL"),
    )
    documents = loader.load()
    # Combine all page contents.
    return "\n".join([doc.page_content for doc in documents])

async def extract_and_chunk(chunk_size: int = 1500, max_workers: int = 5, batch_size: int = 50):
    """
    Optimized function to extract text from files, chunk it, and embed it into Pinecone.
    Only processes files that haven't been embedded before or have been modified.
    
    Args:
        chunk_size: Maximum size of each text chunk
        max_workers: Maximum number of concurrent extraction workers
        batch_size: Number of chunks to embed in each batch (smaller batches are faster but make more API calls)
    
    Returns:
        tuple: (total_chunks, processed_files, skipped_files, failed_files)
    """
    import nltk
    from nltk.tokenize import sent_tokenize
    import concurrent.futures
    import time
    from datetime import datetime
    
    # Start timing the overall process
    process_start_time = time.time()
    
    nltk.download('punkt', quiet=True)
    
    chunks_file_path = os.path.join(os.path.dirname(__file__), "chunks.txt")
    total_chunks = 0
    chunk_texts = []
    chunk_ids = []
    processed_files = []
    skipped_files = []
    failed_files = []
    
    # Load file mappings
    mapping = {}
    if os.path.exists(MAPPING_FILE):
        with open(MAPPING_FILE, "r") as f:
            try:
                mapping = json.load(f)
            except json.JSONDecodeError:
                mapping = {}
    
    # Load embedding status
    embedding_status = {}
    if os.path.exists(EMBEDDING_STATUS_FILE):
        with open(EMBEDDING_STATUS_FILE, "r") as f:
            try:
                embedding_status = json.load(f)
            except json.JSONDecodeError:
                embedding_status = {}
    
    logging.info("Starting optimized extraction and chunking process")
    
    # Get list of files to process
    files_to_process = []
    for file_name in os.listdir(DOWNLOAD_FOLDER):
        # Skip non-files and mapping files
        if file_name == os.path.basename(MAPPING_FILE) or file_name.startswith('.'):
            continue
            
        file_path = os.path.join(DOWNLOAD_FOLDER, file_name)
        if not os.path.isfile(file_path):
            continue
            
        # Check if file has already been embedded
        file_stat = os.stat(file_path)
        file_modified_time = file_stat.st_mtime
        file_size = file_stat.st_size
        
        file_key = f"{file_name}_{file_size}_{file_modified_time}"
        
        if file_name in embedding_status:
            # Skip if file hasn't changed since last embedding
            if embedding_status[file_name]["file_key"] == file_key:
                logging.info(f"Skipping already embedded file: {file_name} (embedded on {embedding_status[file_name]['last_embedded']})")
                skipped_files.append(file_name)
                continue
            else:
                logging.info(f"File changed since last embedding: {file_name} - will re-embed")
        
        files_to_process.append((file_name, file_path, file_key))
    
    logging.info(f"Found {len(files_to_process)} files to process, {len(skipped_files)} files skipped (already embedded)")
    
    # Log the names of files that will be processed
    if files_to_process:
        logging.info(f"Files that will be processed: {', '.join([f[0] for f in files_to_process])}")
    else:
        logging.info("No new or modified files to process - all files are already embedded")
    
    # Define extraction function for parallel processing
    def process_file(file_info):
        file_name, file_path, file_key = file_info
        start_time = time.time()
        
        try:
            logging.info(f"Extracting text from: {file_name}")
            extracted_text = document_loader(file_path)
            extraction_time = time.time() - start_time
            logging.info(f"Successfully extracted text from: {file_name} ({len(extracted_text)} chars) in {extraction_time:.2f} seconds")
            
            drive_link = mapping.get(file_name, "Not available")
            source = f"Drive Link: {drive_link}"
            
            # Improved chunking with better handling of long sentences
            sentences = sent_tokenize(extracted_text)
            chunks = []
            current_chunk = ""
            
            for sentence in sentences:
                # If a single sentence is longer than chunk_size, split it
                if len(sentence) > chunk_size:
                    # If we have content in the current chunk, save it first
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                        current_chunk = ""
                    
                    # Split the long sentence into smaller pieces
                    words = sentence.split()
                    current_piece = ""
                    
                    for word in words:
                        if len(current_piece) + len(word) + 1 <= chunk_size:
                            current_piece += word + " "
                        else:
                            if current_piece:
                                chunks.append(current_piece.strip())
                            current_piece = word + " "
                    
                    if current_piece:
                        current_chunk = current_piece
                else:
                    # Normal sentence handling
                    if len(current_chunk) + len(sentence) + 1 <= chunk_size:
                        current_chunk += sentence + " "
                    else:
                        if current_chunk:
                            chunks.append(current_chunk.strip())
                        current_chunk = sentence + " "
            
            if current_chunk:
                chunks.append(current_chunk.strip())
            
            file_chunks = []
            file_chunk_ids = []
            
            for i, chunk in enumerate(chunks, start=1):
                metadata_str = f"Source: {source}\nDocument: {file_name}\nChunk: {i}/{len(chunks)}"
                combined_chunk = f"{metadata_str}\n\n{chunk}"
                file_chunks.append(combined_chunk)
                file_chunk_ids.append(f"{file_name}_{i}")
            
            processing_time = time.time() - start_time
            logging.info(f"Created {len(chunks)} chunks for {file_name} in {processing_time:.2f} seconds")
            
            return {
                "status": "success",
                "file_name": file_name,
                "file_key": file_key,
                "chunks": file_chunks,
                "chunk_ids": file_chunk_ids,
                "chunk_count": len(chunks)
            }
        except Exception as e:
            logging.error(f"Error processing {file_name}: {str(e)}")
            return {
                "status": "failed",
                "file_name": file_name,
                "error": str(e)
            }
    
    # Process files in parallel
    with open(chunks_file_path, "w", encoding="utf-8") as chunks_file:
        if files_to_process:
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_to_file = {executor.submit(process_file, file_info): file_info for file_info in files_to_process}
                
                for future in concurrent.futures.as_completed(future_to_file):
                    file_info = future_to_file[future]
                    file_name = file_info[0]
                    
                    try:
                        result = future.result()
                        
                        if result["status"] == "success":
                            # Write chunks to file
                            for chunk in result["chunks"]:
                                try:
                                    json.dump({"metadata": "", "content": chunk}, chunks_file, ensure_ascii=False)
                                    chunks_file.write("\n")
                                except Exception as e:
                                    logging.error(f"Error writing chunk for {file_name}: {str(e)}")
                            
                            # Add to embedding lists
                            chunk_texts.extend(result["chunks"])
                            chunk_ids.extend(result["chunk_ids"])
                            total_chunks += result["chunk_count"]
                            processed_files.append(file_name)
                            
                            # Update embedding status
                            embedding_status[file_name] = {
                                "file_key": result["file_key"],
                                "last_embedded": datetime.now().isoformat(),
                                "chunks": result["chunk_count"]
                            }
                        else:
                            failed_files.append(file_name)
                    except Exception as e:
                        logging.error(f"Error handling result for {file_name}: {str(e)}")
                        failed_files.append(file_name)
    
    # Save updated embedding status
    try:
        logging.info(f"Saving embedding status to {EMBEDDING_STATUS_FILE} with {len(embedding_status)} entries")
        with open(EMBEDDING_STATUS_FILE, "w") as f:
            json.dump(embedding_status, f, indent=2)
        logging.info(f"Successfully saved embedding status file")
    except Exception as e:
        logging.error(f"Error saving embedding status file: {str(e)}")
    
    # Embed chunks if any
    if chunk_texts:
        try:
            logging.info(f"Embedding {len(chunk_texts)} chunks into Pinecone")
            from langchain.embeddings.openai import OpenAIEmbeddings
            from langchain_pinecone import PineconeVectorStore
            
            start_time = time.time()
            # Configure OpenAI embeddings with optimized settings
            embeddings = OpenAIEmbeddings(
                model="text-embedding-3-small",  # Fastest model
                api_key=os.getenv("OPENAI_API_KEY"),
                show_progress_bar=False,  # Disable progress bar for faster processing
                request_timeout=60.0,  # Increase timeout for larger batches
                chunk_size=batch_size  # Match chunk size to batch size for optimal performance
            )
            
            # Initialize vectorstore with optimized embeddings
            vectorstore = PineconeVectorStore(
                index_name="testabhishek",
                embedding=embeddings,
                namespace="gdrive_search",
                pinecone_api_key=os.getenv("PINECONE_API_KEY"),
            )
            
            # Process in batches to avoid overwhelming the API
            total_batches = (len(chunk_texts) - 1) // batch_size + 1
            logging.info(f"Processing {len(chunk_texts)} chunks in {total_batches} batches (batch size: {batch_size})")
            
            # Create metadata with source information for better retrieval
            metadatas = []
            for chunk_id in chunk_ids:
                file_name = chunk_id.split('_')[0]
                metadatas.append({"source": file_name})
            
            # Process batches with progress tracking
            for i in range(0, len(chunk_texts), batch_size):
                batch_start_time = time.time()
                batch_texts = chunk_texts[i:i+batch_size]
                batch_ids = chunk_ids[i:i+batch_size]
                batch_metadatas = metadatas[i:i+batch_size]
                
                # Add texts to vectorstore
                vectorstore.add_texts(
                    texts=batch_texts,
                    metadatas=batch_metadatas,
                    ids=batch_ids
                )
                
                batch_time = time.time() - batch_start_time
                batch_num = i//batch_size + 1
                logging.info(f"Embedded batch {batch_num}/{total_batches} in {batch_time:.2f}s ({len(batch_texts)} chunks)")
            
            embedding_time = time.time() - start_time
            logging.info(f"Successfully embedded {len(chunk_texts)} chunks into Pinecone in {embedding_time:.2f} seconds")
        except Exception as e:
            logging.error(f"Error embedding chunks in Pinecone: {str(e)}")
            # Mark files as failed if embedding fails
            for file_name in processed_files:
                if file_name in embedding_status:
                    del embedding_status[file_name]
                failed_files.append(file_name)
            
            # Save updated embedding status after failure
            try:
                logging.info(f"Saving updated embedding status after failure")
                with open(EMBEDDING_STATUS_FILE, "w") as f:
                    json.dump(embedding_status, f, indent=2)
                logging.info(f"Successfully saved embedding status after failure")
            except Exception as e:
                logging.error(f"Error saving embedding status after failure: {str(e)}")
    
    # Calculate and log the total processing time
    process_end_time = time.time()
    total_process_time = process_end_time - process_start_time
    logging.info(f"Extraction and chunking complete. Total chunks: {total_chunks}")
    logging.info(f"Total processing time: {total_process_time:.2f} seconds")
    logging.info(f"Files processed: {len(processed_files)}, Files skipped: {len(skipped_files)}, Files failed: {len(failed_files)}")
    
    return total_chunks, processed_files, skipped_files, failed_files

### Endpoints ###

@app.post("/upload-client-secret")
async def upload_client_secret(file: UploadFile = File(...)):
    if file.filename != "client_secret.json":
        raise HTTPException(status_code=400, detail="File must be named 'client_secret.json'")
    file_path = os.path.join(CLIENT_SECRETS_DIR, file.filename)
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    logging.info(f"Uploaded client secret: {file.filename}")
    return {"message": "Client secret uploaded successfully", "file_path": file_path}

@app.get("/connect")
async def connect(request: Request):
    CLIENT_SECRETS_FILE = os.path.join(CLIENT_SECRETS_DIR, "client_secret.json")
    if not os.path.exists(CLIENT_SECRETS_FILE):
        raise HTTPException(status_code=400, detail="Client secret file not found. Please upload it first.")
    SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
    REDIRECT_URI = "http://localhost:8000/oauth2callback"
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES
    )
    flow.redirect_uri = REDIRECT_URI
    authorization_url, state = flow.authorization_url(
        access_type='offline', include_granted_scopes='true'
    )
    request.session["state"] = state
    logging.info("Redirecting to Google OAuth.")
    return RedirectResponse(url=authorization_url)

@app.get("/oauth2callback")
async def oauth2callback(request: Request):
    state = request.session.get("state")
    if not state:
        raise HTTPException(status_code=400, detail="Missing state in session.")
    CLIENT_SECRETS_FILE = os.path.join(CLIENT_SECRETS_DIR, "client_secret.json")
    SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
    REDIRECT_URI = "http://localhost:8000/oauth2callback"
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES, state=state
    )
    flow.redirect_uri = REDIRECT_URI
    authorization_response = str(request.url)
    flow.fetch_token(authorization_response=authorization_response)
    credentials = flow.credentials
    request.session["credentials"] = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": list(credentials.scopes)
    }
    logging.info("OAuth2 callback processed. User connected.")
    return JSONResponse(content={"message": "Connected successfully", "credentials": request.session["credentials"]})

@app.get("/list_drive")
async def list_drive(request: Request):
    if "credentials" not in request.session:
        raise HTTPException(status_code=400, detail="Not connected. Please connect first.")
    creds_data = request.session["credentials"]
    credentials = Credentials(
        token=creds_data["token"],
        refresh_token=creds_data["refresh_token"],
        token_uri=creds_data["token_uri"],
        client_id=creds_data["client_id"],
        client_secret=creds_data["client_secret"],
        scopes=creds_data["scopes"]
    )
    from googleapiclient.discovery import build
    service = build('drive', 'v3', credentials=credentials)
    all_files = []
    page_token = None
    while True:
        response = service.files().list(
            pageSize=100,
            fields="nextPageToken, files(id, name, mimeType, webViewLink)",
            pageToken=page_token
        ).execute()
        all_files.extend(response.get("files", []))
        page_token = response.get("nextPageToken")
        if not page_token:
            break
    folder_count = sum(1 for f in all_files if f.get("mimeType") == "application/vnd.google-apps.folder")
    file_count = len(all_files) - folder_count
    logging.info("Listed drive files.")
    return JSONResponse(content={
        "files": all_files,
        "total_items": len(all_files),
        "folders_count": folder_count,
        "files_count": file_count
    })

@app.get("/sync")
async def sync(request: Request):
    if "credentials" not in request.session:
        raise HTTPException(status_code=400, detail="Not connected. Please connect first.")
    creds_data = request.session["credentials"]
    credentials = Credentials(
        token=creds_data["token"],
        refresh_token=creds_data["refresh_token"],
        token_uri=creds_data["token_uri"],
        client_id=creds_data["client_id"],
        client_secret=creds_data["client_secret"],
        scopes=creds_data["scopes"]
    )
    from googleapiclient.discovery import build
    service = build('drive', 'v3', credentials=credentials)
    
    # Fetch all files from Google Drive
    all_files = []
    page_token = None
    while True:
        response = service.files().list(
            pageSize=100,
            fields="nextPageToken, files(id, name, mimeType, webViewLink)",
            pageToken=page_token
        ).execute()
        all_files.extend(response.get("files", []))
        page_token = response.get("nextPageToken")
        if not page_token:
            break

    downloaded = []
    skipped_existing = []
    skipped_unsupported = []
    failed = []
    total_attempts = 0

    # Define file extensions to skip: video, image, ipynb, mp3, HEIC.
    skip_extensions = [".mp4", ".mov", ".avi", ".mkv", ".ipynb", ".jpg", ".jpeg", ".png", ".gif", ".mp3", ".heic"]

    # Filter files to download
    files_to_download = []
    for file_obj in all_files:
        if file_obj.get("mimeType") == "application/vnd.google-apps.folder":
            continue
            
        file_name = file_obj.get("name")
        if any(file_name.lower().endswith(ext) for ext in skip_extensions):
            skipped_unsupported.append(file_name)
            continue

        local_path = os.path.join(DOWNLOAD_FOLDER, file_name)
        if file_obj.get("mimeType").startswith("application/vnd.google-apps"):
            if not local_path.lower().endswith(".pdf"):
                local_path += ".pdf"
                
        if os.path.exists(local_path):
            skipped_existing.append(file_name)
            continue
            
        files_to_download.append((file_obj, local_path))
        total_attempts += 1

    # Create a semaphore to limit concurrent downloads (adjust based on system capabilities)
    # Too many concurrent connections can overwhelm the network or API rate limits
    max_concurrent_downloads = 10
    semaphore = asyncio.Semaphore(max_concurrent_downloads)
    
    # Define the download task
    async def download_task(file_obj, local_path):
        status, message = await download_file_async(service, file_obj, local_path, semaphore)
        if status == "downloaded":
            downloaded.append(file_obj.get("name"))
            update_mapping(file_obj, os.path.basename(local_path))
        else:
            failed.append(file_obj.get("name"))
        return status, message
    
    # Create download tasks
    download_tasks = [download_task(file_obj, local_path) for file_obj, local_path in files_to_download]
    
    # Execute all download tasks concurrently
    if download_tasks:
        logging.info(f"Starting concurrent download of {len(download_tasks)} files with max concurrency of {max_concurrent_downloads}")
        results = await asyncio.gather(*download_tasks)
        logging.info(f"Completed concurrent downloads: {len([r for r, _ in results if r == 'downloaded'])} successful, {len([r for r, _ in results if r == 'failed'])} failed")
    else:
        logging.info("No new files to download")
    
    logging.info("Sync complete.")
    return JSONResponse(content={
        "message": "Sync complete",
        "attempted_count": total_attempts,
        "downloaded_count": len(downloaded),
        "skipped_existing_count": len(skipped_existing),
        "skipped_unsupported_count": len(skipped_unsupported),
        "failed_count": len(failed),
        "downloaded_files": downloaded,
        "skipped_existing_files": skipped_existing,
        "skipped_unsupported_files": skipped_unsupported,
        "failed_files": failed
    })

@app.get("/embed")
async def embed(request: Request):
    try:
        # Check if there are any files that need to be embedded
        embedding_status = {}
        if os.path.exists(EMBEDDING_STATUS_FILE):
            with open(EMBEDDING_STATUS_FILE, "r") as f:
                try:
                    embedding_status = json.load(f)
                except json.JSONDecodeError:
                    embedding_status = {}
        
        # Get list of files in download folder
        files_to_check = []
        for file_name in os.listdir(DOWNLOAD_FOLDER):
            if file_name == os.path.basename(MAPPING_FILE) or file_name.startswith('.'):
                continue
                
            file_path = os.path.join(DOWNLOAD_FOLDER, file_name)
            if not os.path.isfile(file_path):
                continue
                
            # Check if file has already been embedded
            file_stat = os.stat(file_path)
            file_modified_time = file_stat.st_mtime
            file_size = file_stat.st_size
            
            file_key = f"{file_name}_{file_size}_{file_modified_time}"
            
            if file_name in embedding_status:
                # Skip if file hasn't changed since last embedding
                if embedding_status[file_name]["file_key"] == file_key:
                    continue
            
            files_to_check.append(file_name)
        
        # If no files need to be embedded, return early
        if not files_to_check:
            logging.info("No new or modified files to embed - skipping embedding process")
            return JSONResponse(content={
                "message": "No new or modified files to embed",
                "processed_files": [],
                "processed_count": 0,
                "skipped_files": list(embedding_status.keys()),
                "skipped_count": len(embedding_status),
                "failed_files": [],
                "failed_count": 0
            })
        
        # Otherwise, proceed with embedding
        logging.info(f"Found {len(files_to_check)} files that need to be embedded")
        logging.info("Starting embed endpoint with optimized processing")
        total_chunks, processed_files, skipped_files, failed_files = await extract_and_chunk()
        
        logging.info(f"Embed endpoint completed: {len(processed_files)} files processed, {len(skipped_files)} files skipped, {len(failed_files)} files failed")
        
        return JSONResponse(content={
            "message": f"Extraction, chunking, and embedding complete. Total chunks: {total_chunks}",
            "processed_files": processed_files,
            "processed_count": len(processed_files),
            "skipped_files": skipped_files,
            "skipped_count": len(skipped_files),
            "failed_files": failed_files,
            "failed_count": len(failed_files)
        })
    except Exception as e:
        logging.error(f"Error in /embed endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug-files")
async def debug_files(request: Request):
    """Debug endpoint to check file paths and existence"""
    try:
        file_info = {
            "current_dir": CURRENT_DIR,
            "mapping_folder": {
                "path": MAPPING_FOLDER,
                "exists": os.path.exists(MAPPING_FOLDER),
                "is_dir": os.path.isdir(MAPPING_FOLDER) if os.path.exists(MAPPING_FOLDER) else False
            },
            "mapping_file": {
                "path": MAPPING_FILE,
                "exists": os.path.exists(MAPPING_FILE),
                "size": os.path.getsize(MAPPING_FILE) if os.path.exists(MAPPING_FILE) else 0
            },
            "embedding_status_file": {
                "path": EMBEDDING_STATUS_FILE,
                "exists": os.path.exists(EMBEDDING_STATUS_FILE),
                "size": os.path.getsize(EMBEDDING_STATUS_FILE) if os.path.exists(EMBEDDING_STATUS_FILE) else 0
            },
            "download_folder": {
                "path": DOWNLOAD_FOLDER,
                "exists": os.path.exists(DOWNLOAD_FOLDER),
                "is_dir": os.path.isdir(DOWNLOAD_FOLDER) if os.path.exists(DOWNLOAD_FOLDER) else False,
                "file_count": len(os.listdir(DOWNLOAD_FOLDER)) if os.path.exists(DOWNLOAD_FOLDER) and os.path.isdir(DOWNLOAD_FOLDER) else 0
            }
        }
        
        # Try to read embedding status file
        if os.path.exists(EMBEDDING_STATUS_FILE):
            try:
                with open(EMBEDDING_STATUS_FILE, "r") as f:
                    embedding_status = json.load(f)
                file_info["embedding_status_content"] = {
                    "entry_count": len(embedding_status),
                    "entries": list(embedding_status.keys())
                }
            except Exception as e:
                file_info["embedding_status_content"] = {
                    "error": str(e)
                }
        
        return JSONResponse(content=file_info)
    except Exception as e:
        logging.error(f"Error in debug endpoint: {str(e)}")
        return JSONResponse(content={"error": str(e)})

@app.get("/embedding-status")
async def embedding_status(request: Request):
    """
    Get the status of all embedded files, including when they were last embedded
    and how many chunks were created for each file.
    """
    try:
        if not os.path.exists(EMBEDDING_STATUS_FILE):
            return JSONResponse(content={
                "message": "No embedding status found",
                "status": {}
            })
            
        with open(EMBEDDING_STATUS_FILE, "r") as f:
            try:
                embedding_status = json.load(f)
            except json.JSONDecodeError:
                embedding_status = {}
        
        # Get total number of chunks
        total_chunks = sum(file_data.get("chunks", 0) for file_data in embedding_status.values())
        
        # Get list of files in download folder that haven't been embedded
        downloaded_files = set(os.listdir(DOWNLOAD_FOLDER))
        embedded_files = set(embedding_status.keys())
        not_embedded = list(downloaded_files - embedded_files)
        
        # Filter out non-files and special files
        not_embedded = [f for f in not_embedded if os.path.isfile(os.path.join(DOWNLOAD_FOLDER, f))
                        and not f.startswith('.') and f != os.path.basename(MAPPING_FILE)]
        
        return JSONResponse(content={
            "message": f"Found {len(embedding_status)} embedded files with {total_chunks} total chunks",
            "status": embedding_status,
            "total_embedded_files": len(embedding_status),
            "total_chunks": total_chunks,
            "not_embedded_files": not_embedded,
            "not_embedded_count": len(not_embedded)
        })
    except Exception as e:
        logging.error(f"Error in /embedding-status endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/disconnect")
async def disconnect(request: Request):
    """
    Disconnect endpoint that will:
    1. End the session
    2. Delete all embeddings in Pinecone
    3. Delete all downloaded files
    4. Delete all mappings
    5. Delete the client secret file
    """
    try:
        logging.info("Starting disconnect process")
        results = {
            "session_cleared": False,
            "pinecone_embeddings_deleted": False,
            "downloaded_files_deleted": False,
            "mappings_deleted": False,
            "client_secret_deleted": False
        }
        
        # 1. End the session
        try:
            if "credentials" in request.session:
                request.session.pop("credentials")
            if "state" in request.session:
                request.session.pop("state")
            request.session.clear()
            results["session_cleared"] = True
            logging.info("Session cleared successfully")
        except Exception as e:
            logging.error(f"Error clearing session: {str(e)}")
        
        # 2. Delete all embeddings in Pinecone
        try:
            from langchain.embeddings.openai import OpenAIEmbeddings
            from langchain_pinecone import PineconeVectorStore
            
            # Initialize vectorstore with the same settings as in extract_and_chunk
            embeddings = OpenAIEmbeddings(
                model="text-embedding-3-small",
                api_key=os.getenv("OPENAI_API_KEY")
            )
            
            vectorstore = PineconeVectorStore(
                index_name="testabhishek",
                embedding=embeddings,
                namespace="gdrive_search",
                pinecone_api_key=os.getenv("PINECONE_API_KEY"),
            )
            
            # Delete all vectors in the namespace
            vectorstore.delete(delete_all=True)
            results["pinecone_embeddings_deleted"] = True
            logging.info("All embeddings deleted from Pinecone")
        except Exception as e:
            logging.error(f"Error deleting Pinecone embeddings: {str(e)}")
        
        # 3. Delete all downloaded files (recursively)
        try:
            if os.path.exists(DOWNLOAD_FOLDER) and os.path.isdir(DOWNLOAD_FOLDER):
                import shutil
                
                # Count files and folders before deletion for logging
                file_count = 0
                folder_count = 0
                for root, dirs, files in os.walk(DOWNLOAD_FOLDER):
                    file_count += len(files)
                    folder_count += len(dirs)
                
                # Delete all contents of the download folder
                for item in os.listdir(DOWNLOAD_FOLDER):
                    item_path = os.path.join(DOWNLOAD_FOLDER, item)
                    if os.path.isfile(item_path):
                        os.remove(item_path)
                    elif os.path.isdir(item_path):
                        shutil.rmtree(item_path)
                
                results["downloaded_files_deleted"] = True
                logging.info(f"Deleted {file_count} files and {folder_count} folders from download directory")
        except Exception as e:
            logging.error(f"Error deleting downloaded files: {str(e)}")
        
        # 4. Delete all mappings
        try:
            # Clear mapping file
            if os.path.exists(MAPPING_FILE):
                with open(MAPPING_FILE, "w") as f:
                    json.dump({}, f)
            
            # Clear embedding status file
            if os.path.exists(EMBEDDING_STATUS_FILE):
                with open(EMBEDDING_STATUS_FILE, "w") as f:
                    json.dump({}, f)
            
            results["mappings_deleted"] = True
            logging.info("All mappings and embedding status cleared")
        except Exception as e:
            logging.error(f"Error clearing mappings: {str(e)}")
        
        # 5. Delete the client secret file
        try:
            client_secret_path = os.path.join(CLIENT_SECRETS_DIR, "client_secret.json")
            if os.path.exists(client_secret_path):
                os.remove(client_secret_path)
                results["client_secret_deleted"] = True
                logging.info("Client secret file deleted")
        except Exception as e:
            logging.error(f"Error deleting client secret file: {str(e)}")
        
        # Return results
        all_successful = all(results.values())
        return JSONResponse(content={
            "message": "Disconnect complete" if all_successful else "Disconnect partially complete with some errors",
            "details": results,
            "success": all_successful
        })
    except Exception as e:
        logging.error(f"Error in /disconnect endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend:app", host="localhost", port=8000, reload=True)
