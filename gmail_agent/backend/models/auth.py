from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, validator


class ClientSecretRequest(BaseModel):
    """Model for uploading a client secret file content"""
    client_secret: Dict[str, Any] = Field(..., description="The client secret JSON content")

    @validator('client_secret')
    def validate_client_secret(cls, v):
        """Validate that the client secret has a valid structure"""
        if not v or not isinstance(v, dict):
            raise ValueError("Client secret must be a valid JSON object")
        
        # Check for "installed" or "web" keys in the client secret
        if "installed" not in v and "web" not in v:
            raise ValueError("Invalid client secret format. Must contain 'installed' or 'web' key")
        
        return v


class AuthResponse(BaseModel):
    """Response model for authentication operations"""
    success: bool
    message: str
    authenticated: bool


class SessionInfo(BaseModel):
    """Model for session information"""
    session_id: str
    authenticated: bool
    expires_at: str
    user_email: Optional[str] = None
