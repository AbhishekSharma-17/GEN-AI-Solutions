import os
import json
import google_auth_oauthlib.flow
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from google.oauth2.credentials import Credentials

# Allow insecure transport for local development.
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

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

# Define folder for downloaded files and the mapping file.
DOWNLOAD_FOLDER = "downloaded_files"
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

MAPPING_FILE = os.path.join(DOWNLOAD_FOLDER, "download_mapping.json")
if not os.path.exists(MAPPING_FILE):
    with open(MAPPING_FILE, "w") as f:
        json.dump({}, f)

# --- Helper Functions ---
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
        return ("downloaded", f"Downloaded: '{file_name}'")
    except Exception as e:
        return ("failed", f"Failed: '{file_name}' - {str(e)}")

def update_mapping(file_obj, local_file_name):
    drive_link = f"https://drive.google.com/file/d/{file_obj.get('id')}/view"
    with open(MAPPING_FILE, "r") as f:
        mapping = json.load(f)
    mapping[local_file_name] = drive_link
    with open(MAPPING_FILE, "w") as f:
        json.dump(mapping, f)

# --- Endpoints ---

# Upload client_secret.json.
@app.post("/upload-client-secret")
async def upload_client_secret(file: UploadFile = File(...)):
    if file.filename != "client_secret.json":
        raise HTTPException(status_code=400, detail="File must be named 'client_secret.json'")
    file_path = os.path.join(CLIENT_SECRETS_DIR, file.filename)
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    return {"message": "Client secret uploaded successfully", "file_path": file_path}

# Initiate Google OAuth.
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
    return RedirectResponse(url=authorization_url)

# Handle OAuth2 callback.
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
    return JSONResponse(content={"message": "Connected successfully", "credentials": request.session["credentials"]})

# List Drive files along with counts.
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
    return JSONResponse(content={
        "files": all_files,
        "total_items": len(all_files),
        "folders_count": folder_count,
        "files_count": file_count
    })

# Download all files (first-time download).
@app.get("/download_all")
async def download_all(request: Request):
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
    failed = []
    total_attempts = 0

    for file_obj in all_files:
        if file_obj.get("mimeType") == "application/vnd.google-apps.folder":
            continue
        total_attempts += 1
        file_name = file_obj.get("name")
        local_path = os.path.join(DOWNLOAD_FOLDER, file_name)
        if file_obj.get("mimeType").startswith("application/vnd.google-apps"):
            if not local_path.lower().endswith(".pdf"):
                local_path += ".pdf"
        status, message = download_file(service, file_obj, local_path)
        if status == "downloaded":
            downloaded.append(file_name)
            update_mapping(file_obj, os.path.basename(local_path))
        else:
            failed.append(file_name)
    return JSONResponse(content={
        "message": "Download All complete",
        "attempted_count": total_attempts,
        "downloaded_count": len(downloaded),
        "failed_count": len(failed),
        "downloaded_files": downloaded,
        "failed_files": failed
    })

# Sync files (download only new files).
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
    failed = []
    total_attempts = 0

    for file_obj in all_files:
        if file_obj.get("mimeType") == "application/vnd.google-apps.folder":
            continue
        file_name = file_obj.get("name")
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
    return JSONResponse(content={
        "message": "Sync complete",
        "attempted_count": total_attempts,
        "downloaded_count": len(downloaded),
        "skipped_count": len(skipped_existing),
        "failed_count": len(failed),
        "downloaded_files": downloaded,
        "skipped_files": skipped_existing,
        "failed_files": failed
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend:app", host="localhost", port=8000, reload=True)
