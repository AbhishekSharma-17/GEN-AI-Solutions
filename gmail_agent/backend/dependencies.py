"""
Dependencies for FastAPI applications
"""
from fastapi import Depends, Request, HTTPException, status
from typing import Dict, Any
import os
import uuid
import json
import datetime
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Local imports
from config import settings

def get_current_session(request: Request) -> Dict[str, Any]:
    """
    Get the current session from cookies
    """
    try:
        # Get session ID from cookies
        session_id = request.cookies.get(settings.SESSION_COOKIE_NAME)
        if not session_id:
            return {}
            
        # Get session file path
        session_file = Path(settings.SESSION_DIR) / f"{session_id}.json"
        if not session_file.exists():
            return {}
            
        # Read session data
        with open(session_file, "r") as f:
            session = json.load(f)
            
        # Check if session is expired
        if "expires_at" in session:
            expires_at = datetime.datetime.fromisoformat(session["expires_at"])
            if expires_at < datetime.datetime.now():
                return {}
                
        # Add session ID to session data
        session["session_id"] = session_id
        return session
    except Exception as e:
        logger.error(f"Error getting session: {e}")
        return {}

def create_session(data: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Create a new session or update existing one
    """
    try:
        # Ensure session directory exists
        session_dir = Path(settings.SESSION_DIR)
        session_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate a new session ID if not provided
        session_id = data.get("session_id") if data else None
        if not session_id:
            session_id = str(uuid.uuid4())
            
        # Create session data
        session = {
            "session_id": session_id,
            "created_at": datetime.datetime.now().isoformat(),
            "expires_at": (datetime.datetime.now() + datetime.timedelta(seconds=settings.SESSION_MAX_AGE)).isoformat(),
        }
        
        # Add additional data if provided
        if data:
            for key, value in data.items():
                if key != "session_id":
                    session[key] = value
                    
        # Save session to file
        session_file = session_dir / f"{session_id}.json"
        with open(session_file, "w") as f:
            json.dump(session, f)
            
        return session
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        return {"session_id": "error", "error": str(e)}

def save_client_secret(client_secret: Any, session_id: str) -> Path:
    """
    Save client secret to a file
    
    Args:
        client_secret: The client secret, could be a string (JSON) or dict
        session_id: The session ID to associate with this client secret
    
    Returns:
        Path to the saved client secret file
    """
    try:
        # Ensure credentials directory exists
        creds_dir = Path(settings.CREDENTIALS_DIR)
        creds_dir.mkdir(parents=True, exist_ok=True)
        
        # Convert client_secret to string if it's a dict
        if isinstance(client_secret, dict):
            client_secret_str = json.dumps(client_secret, indent=2)
        else:
            client_secret_str = str(client_secret)
            
        # Save client secret to file
        client_secret_file = creds_dir / f"client_secret_{session_id}.json"
        with open(client_secret_file, "w") as f:
            f.write(client_secret_str)
            
        return client_secret_file
    except Exception as e:
        logger.error(f"Error saving client secret: {e}")
        raise

def get_gmail_client(session: Dict[str, Any] = Depends(get_current_session)):
    """
    Get Gmail client from session
    
    This implementation creates a mock Gmail client for testing
    In a production app, you would initialize a real Gmail API client
    """
    # For testing only - allow mock client
    if settings.TESTING:
        # Create a mock Gmail client
        class MockGmail:
            def __init__(self):
                self.user_email = "test@example.com"
                
            def get_messages(self, query=None):
                return []
                
            def get_message(self, message_id):
                return None
                
            @property
            def service(self):
                return MockGmailService()
        
        class MockGmailService:
            def users(self):
                return MockGmailUsers()
        
        class MockGmailUsers:
            def drafts(self):
                return MockGmailDrafts()
                
            def messages(self):
                return MockGmailMessages()
        
        class MockGmailDrafts:
            def list(self, userId=None):
                return lambda: {"drafts": []}
                
            def create(self, userId=None, body=None):
                return lambda: {"id": "mock-draft-id"}
                
        class MockGmailMessages:
            def list(self, userId=None, q=None):
                return lambda: {"messages": []}
        
        from services.gmail_service import GmailService
        return GmailService(MockGmail())
        
    # Check if we have a client secret file
    client_secret_file = session.get("client_secret_file")
    if not client_secret_file or not Path(client_secret_file).exists():
        logger.warning("No client_secret_file found in session or file doesn't exist")
        return None
        
    try:
        # Initialize Gmail client
        from simplegmail import Gmail
        gmail_client = Gmail(client_secret_file=client_secret_file)
        
        from services.gmail_service import GmailService
        return GmailService(gmail_client)
    except Exception as e:
        logger.error(f"Error initializing Gmail client: {e}")
        return None

def validate_gmail_client(gmail = Depends(get_gmail_client)):
    """
    Validate that we have a Gmail client
    
    We'll use this dependency when we need to guarantee that the user is authenticated
    """
    if not gmail:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return gmail
