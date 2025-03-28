from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from google_auth_oauthlib.flow import Flow
from pathlib import Path
import json
import os
import secrets
import uvicorn

app = FastAPI()

# Base directory for user data
BASE_DIR = Path("users")
BASE_DIR.mkdir(exist_ok=True)

# Gmail OAuth scopes
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

# Simulated authentication (replace with real authentication in production)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    # Placeholder: assumes user ID "user1". Replace with real token validation.
    return "user1"

# Helper to get or create user directory
def get_user_dir(user_id: str) -> Path:
    user_dir = BASE_DIR / user_id
    user_dir.mkdir(exist_ok=True)
    return user_dir

# Upload credentials endpoint
@app.post("/upload-credentials")
async def upload_credentials(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if file.filename != "credentials.json":
        raise HTTPException(status_code=400, detail="File must be named 'credentials.json'")
    
    user_dir = get_user_dir(current_user)
    file_path = user_dir / "credentials.json"
    
    # Validate file contents
    contents = await file.read()
    try:
        credentials_data = json.loads(contents)
        if "web" not in credentials_data or not all(
            key in credentials_data["web"] for key in ["client_id", "client_secret", "redirect_uris"]
        ):
            raise HTTPException(status_code=400, detail="Invalid credentials.json structure")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    
    # Save the file
    with file_path.open("wb") as buffer:
        buffer.write(contents)
    
    return {"message": "Credentials uploaded successfully"}

# Start Gmail OAuth flow
@app.get("/gmail/auth")
async def gmail_auth(current_user: str = Depends(get_current_user)):
    user_dir = get_user_dir(current_user)
    credentials_path = user_dir / "credentials.json"
    
    if not credentials_path.exists():
        raise HTTPException(status_code=400, detail="Credentials not found")
    
    # Load credentials
    with credentials_path.open("r") as f:
        credentials_data = json.load(f)
    
    # Configure OAuth flow
    flow = Flow.from_client_config(
        credentials_data,
        scopes=SCOPES,
        redirect_uri="http://localhost:8000/gmail/callback"
    )
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true"
    )
    
    # Store state
    state_path = user_dir / "state.json"
    with state_path.open("w") as f:
        json.dump({"state": state}, f)
    
    return {"authorization_url": authorization_url}

# Handle OAuth callback
@app.get("/gmail/callback")
async def gmail_callback(
    code: str = Query(...),
    state: str = Query(...),
    current_user: str = Depends(get_current_user)
):
    user_dir = get_user_dir(current_user)
    credentials_path = user_dir / "credentials.json"
    state_path = user_dir / "state.json"
    
    # Verify state
    if not state_path.exists():
        raise HTTPException(status_code=400, detail="State not found")
    
    with state_path.open("r") as f:
        stored_state = json.load(f)["state"]
    
    if stored_state != state:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    # Load credentials
    with credentials_path.open("r") as f:
        credentials_data = json.load(f)
    
    # Exchange code for tokens
    flow = Flow.from_client_config(
        credentials_data,
        scopes=SCOPES,
        redirect_uri="http://localhost:8000/gmail/callback"
    )
    flow.fetch_token(code=code)
    creds = flow.credentials
    
    # Save tokens
    tokens_path = user_dir / "tokens.json"
    with tokens_path.open("w") as f:
        json.dump({
            "access_token": creds.token,
            "refresh_token": creds.refresh_token,
            "expiry": creds.expiry.isoformat() if creds.expiry else None
        }, f)
    
    # Clean up state file
    state_path.unlink()
    
    return {"message": "Gmail account connected successfully"}

# Run the app
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)