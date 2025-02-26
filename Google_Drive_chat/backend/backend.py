import os
import json
import logging
import google_auth_oauthlib.flow
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv
# Configure logging.
logging.basicConfig(level=logging.INFO)

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
CLIENT_SECRETS_DIR = "./client_secrets"
os.makedirs(CLIENT_SECRETS_DIR, exist_ok=True)

# Define folder for downloaded files.
DOWNLOAD_FOLDER = "downloaded_files"
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

# Define folder for the mapping file.
MAPPING_FOLDER = "mapping_data"
if not os.path.exists(MAPPING_FOLDER):
    os.makedirs(MAPPING_FOLDER)
MAPPING_FILE = os.path.join(MAPPING_FOLDER, "download_mapping.json")
if not os.path.exists(MAPPING_FILE):
    with open(MAPPING_FILE, "w") as f:
        json.dump({}, f)

# Import UnstructuredAPIFileLoader.
from langchain_community.document_loaders import UnstructuredAPIFileLoader

### Helper Functions ###

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
            downloader = MediaIoBaseDownload(fh, request)
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

def extract_and_chunk(chunk_size: int = 1500):
    import nltk
    from nltk.tokenize import sent_tokenize
    nltk.download('punkt', quiet=True)
    
    chunks_file_path = os.path.join(os.path.dirname(__file__), "chunks.txt")
    total_chunks = 0
    chunk_texts = []
    chunk_ids = []
    failed_files = []  # Files that fail during extraction/chunking.
    
    # Load mapping.
    mapping = {}
    if os.path.exists(MAPPING_FILE):
        with open(MAPPING_FILE, "r") as f:
            try:
                mapping = json.load(f)
            except json.JSONDecodeError:
                mapping = {}
    
    logging.info("Starting extraction and chunking process.")
    try:
        with open(chunks_file_path, "w", encoding="utf-8") as chunks_file:
            for file_name in os.listdir(DOWNLOAD_FOLDER):
                # Skip the mapping file if it appears in the download folder.
                if file_name == os.path.basename(MAPPING_FILE):
                    continue
                logging.info(f"Processing file: {file_name}")
                file_path = os.path.join(DOWNLOAD_FOLDER, file_name)
                try:
                    # Use unstructured extraction.
                    extracted_text = document_loader(file_path)
                    logging.info(f"Successfully extracted file: {file_name}")
                except Exception as e:
                    logging.error(f"Error extracting file {file_name} with unstructured: {str(e)}. Skipping file.")
                    failed_files.append(file_name)
                    continue

                drive_link = mapping.get(file_name, "Not available")
                source = f"Drive Link: {drive_link}"
                sentences = sent_tokenize(extracted_text)
                chunks = []
                current_chunk = ""
                for sentence in sentences:
                    if len(current_chunk) + len(sentence) <= chunk_size:
                        current_chunk += sentence + " "
                    else:
                        if current_chunk:
                            chunks.append(current_chunk.strip())
                        current_chunk = sentence + " "
                if current_chunk:
                    chunks.append(current_chunk.strip())
                
                logging.info(f"Created {len(chunks)} chunks for file: {file_name}")
                for i, chunk in enumerate(chunks, start=1):
                    metadata_str = f"Source: {source}\nDocument: {file_name}\nChunk: {i}/{len(chunks)}"
                    combined_chunk = f"{metadata_str}\n\n{chunk}"
                    try:
                        json.dump({"metadata": metadata_str, "content": combined_chunk}, chunks_file, ensure_ascii=False)
                        chunks_file.write("\n")
                    except Exception as e:
                        logging.error(f"Error writing chunk for {file_name}: {str(e)}")
                        failed_files.append(file_name)
                        continue
                    chunk_texts.append(combined_chunk)
                    chunk_ids.append(f"{file_name}_{i}")
                    total_chunks += 1
    except Exception as e:
        logging.error(f"Error in extract_and_chunk: {str(e)}")
        raise

    try:
        from langchain.embeddings.openai import OpenAIEmbeddings
        from langchain_pinecone import PineconeVectorStore
        vectorstore = PineconeVectorStore(
            index_name="testabhishek",
            embedding=OpenAIEmbeddings(model="text-embedding-3-small", api_key=os.getenv("OPENAI_API_KEY")),
            namespace="gdrive_search",
            pinecone_api_key=os.getenv("PINECONE_API_KEY"),
        )
        if chunk_texts:
            vectorstore.add_texts(texts=chunk_texts, metadatas=[{}] * len(chunk_texts), ids=chunk_ids)
            logging.info("Successfully embedded chunks into Pinecone.")
    except Exception as e:
        logging.error(f"Error embedding chunks in Pinecone: {str(e)}")
    
    logging.info(f"Extraction and chunking complete. Total chunks: {total_chunks}")
    return total_chunks, failed_files

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
        total_attempts += 1
        status, message = download_file(service, file_obj, local_path)
        if status == "downloaded":
            downloaded.append(file_name)
            update_mapping(file_obj, os.path.basename(local_path))
        else:
            failed.append(file_name)
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
        logging.info("Starting embed endpoint. Extracting and chunking files.")
        total_chunks, failed_files = extract_and_chunk()
        logging.info("Embed endpoint completed.")
        return JSONResponse(content={
            "message": f"Extraction, chunking, and embedding complete. Total chunks: {total_chunks}",
            "failed_files": failed_files,
            "failed_count": len(failed_files)
        })
    except Exception as e:
        logging.error(f"Error in /embed endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend:app", host="localhost", port=8000, reload=True)
