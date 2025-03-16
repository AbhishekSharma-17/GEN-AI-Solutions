"""
Authentication router for Gmail Agent FastAPI backend
"""
from fastapi import APIRouter, HTTPException, Depends, Response, status
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional


from models.auth import ClientSecretRequest, AuthResponse, SessionInfo
from config import settings
from dependencies import (
    get_current_session, 
    create_session, 
    save_client_secret,
    get_gmail_client
)


router = APIRouter()


@router.post("/upload-credentials", response_model=AuthResponse)
async def upload_credentials(
    credentials: ClientSecretRequest,
    response: Response,
    session: Dict[str, Any] = Depends(get_current_session)
):
    """
    Upload Gmail client secret credentials
    
    This endpoint accepts a client secret JSON and stores it securely,
    then sets up authentication for the Gmail API.
    """
    try:
        # Create a new session if one doesn't exist
        if not session:
            session = {}
            
        # Save client secret to file and get the path
        session_id = session.get("session_id", None) or create_session()["session_id"]
        client_secret_path = save_client_secret(credentials.client_secret, session_id)
        
        # Update session with client secret path
        session_data = {
            "client_secret_file": str(client_secret_path),
            "authenticated": True
        }
        
        # Create or update session
        new_session = create_session(session_data)
        
        # Set session cookie
        response.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=new_session["session_id"],
            max_age=settings.SESSION_MAX_AGE,
            httponly=True,
            samesite="lax"
        )
        
        return AuthResponse(
            success=True,
            message="Credentials uploaded and validated successfully.",
            authenticated=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing credentials: {str(e)}"
        )


@router.get("/status", response_model=AuthResponse)
async def auth_status(gmail=Depends(get_gmail_client)):
    """
    Check authentication status
    
    Returns whether the user is authenticated with Gmail
    """
    authenticated = gmail is not None
    
    return AuthResponse(
        success=True,
        message="Authentication status checked successfully." if authenticated else "Not authenticated. Please upload credentials.",
        authenticated=authenticated
    )


@router.get("/session", response_model=SessionInfo)
async def get_session_info(session: Dict[str, Any] = Depends(get_current_session)):
    """
    Get current session information
    
    Returns details about the current session
    """
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No active session found"
        )
    
    # Get user email from Gmail if available
    user_email = None
    client_secret_file = session.get("client_secret_file")
    if client_secret_file and session.get("authenticated"):
        try:
            from simplegmail import Gmail
            gmail = Gmail(client_secret_file=client_secret_file)
            user_email = gmail.user_email if hasattr(gmail, "user_email") else None
        except Exception as e:
            print(f"Error getting user email: {e}")
            pass
    
    return SessionInfo(
        session_id=session["session_id"],
        authenticated=session.get("authenticated", False),
        expires_at=session.get("expires_at", ""),
        user_email=user_email
    )


@router.post("/logout", response_model=AuthResponse)
async def logout(response: Response, session: Dict[str, Any] = Depends(get_current_session)):
    """
    Logout the current user
    
    Clears the session and authentication credentials
    """
    # Clear session cookie
    response.delete_cookie(key=settings.SESSION_COOKIE_NAME)
    
    # Could also delete the session file here if needed
    
    return AuthResponse(
        success=True,
        message="Successfully logged out.",
        authenticated=False
    )
