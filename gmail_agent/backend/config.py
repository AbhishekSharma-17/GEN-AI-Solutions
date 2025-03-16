"""
Configuration settings for the application
"""
import os
from pathlib import Path
from pydantic_settings  import BaseSettings

# Get base directory
BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    """Application settings"""
    
    # Application name
    APP_NAME: str = "Gmail Agent API"
    
    # Session configuration
    SESSION_COOKIE_NAME: str = "gmail_agent_session"
    SESSION_MAX_AGE: int = 7 * 24 * 60 * 60  # 7 days in seconds
    SESSION_DIR: Path = BASE_DIR / "sessions"
    
    # Credentials directory
    CREDENTIALS_DIR: Path = BASE_DIR / "credentials"
    
    # Gmail API configuration
    GMAIL_API_SCOPES: list = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify",
    ]
    
    # LLM configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # Email templates configuration
    EMAIL_TEMPLATES: dict = {
        "reply_max_tokens": 500,
    }
    
    # Testing mode (for development)
    TESTING: bool = os.getenv("TESTING", "false").lower() in ("true", "1", "t")
    
    class Config:
        """Pydantic Config"""
        env_file = ".env"
        case_sensitive = True


# Create a global settings object
settings = Settings()

# Ensure necessary directories exist
settings.SESSION_DIR.mkdir(exist_ok=True, parents=True)
settings.CREDENTIALS_DIR.mkdir(exist_ok=True, parents=True)
