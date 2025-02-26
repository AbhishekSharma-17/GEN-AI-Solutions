import os
import google_auth_oauthlib.flow
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app instance
app = FastAPI()

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Use Starlette's session middleware; make sure to set a secure secret key.
app.add_middleware(SessionMiddleware, secret_key="YOUR_SECRET_KEY_HERE")

# Define the folder to store the client_secret.json file
CLIENT_SECRETS_DIR = "./client_secrets"
os.makedirs(CLIENT_SECRETS_DIR, exist_ok=True)

# Endpoint to upload client_secret.json from the frontend
@app.post("/upload-client-secret")
async def upload_client_secret(file: UploadFile = File(...)):
    if file.filename != "client_secret.json":
        raise HTTPException(status_code=400, detail="File must be named 'client_secret.json'")
    file_path = os.path.join(CLIENT_SECRETS_DIR, file.filename)
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    return {"message": "Client secret uploaded successfully", "file_path": file_path}

# Endpoint to initiate the connection (similar to the Flask /connect endpoint)
@app.get("/connect")
async def connect(request: Request):
    CLIENT_SECRETS_FILE = os.path.join(CLIENT_SECRETS_DIR, "client_secret.json")
    if not os.path.exists(CLIENT_SECRETS_FILE):
        raise HTTPException(status_code=400, detail="Client secret file not found. Please upload it first.")
    
    # Define required scopes and redirect URI
    SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
    REDIRECT_URI = "http://localhost:8000/oauth2callback"
    
    # Create the OAuth2 flow
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES
    )
    flow.redirect_uri = REDIRECT_URI

    # Generate the authorization URL and state
    authorization_url, state = flow.authorization_url(
        access_type='offline', include_granted_scopes='true'
    )
    
    # Save the state in the session to verify later in the callback
    request.session["state"] = state
    return RedirectResponse(url=authorization_url)

# Endpoint to handle the OAuth2 callback from Google
@app.get("/oauth2callback")
async def oauth2callback(request: Request):
    state = request.session.get("state")
    if not state:
        raise HTTPException(status_code=400, detail="Missing state in session.")
    
    CLIENT_SECRETS_FILE = os.path.join(CLIENT_SECRETS_DIR, "client_secret.json")
    SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
    REDIRECT_URI = "http://localhost:8000/oauth2callback"
    
    # Recreate the OAuth2 flow with the state
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES, state=state
    )
    flow.redirect_uri = REDIRECT_URI
    
    # Use the full request URL as the authorization response
    authorization_response = str(request.url)
    flow.fetch_token(authorization_response=authorization_response)
    credentials = flow.credentials

    # Save credentials in the session (or optionally, persist elsewhere)
    request.session["credentials"] = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": list(credentials.scopes)
    }
    
    return JSONResponse(content={"message": "Connected successfully", "credentials": request.session["credentials"]})

# To run the app, execute: uvicorn backend:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend:app", host="localhost", port=8000, reload=True)
# uvicorn backend:app --host localhost --port 8000 --reload
    
