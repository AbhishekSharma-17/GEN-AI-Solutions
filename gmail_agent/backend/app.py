"""
FastAPI Gmail Agent Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path

# Setup import paths
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.append(str(current_dir))

# Import app routers directly (avoiding package import)
# This bypasses potentially problematic __init__.py files
from routers.auth import router as auth_router
from routers.emails import router as emails_router
from routers.drafts import router as drafts_router
from routers.chat import router as chat_router
from routers.attachments import router as attachments_router

# Create the FastAPI application
app = FastAPI(
    title="Gmail Agent API",
    description="API for interacting with Gmail, including email prioritization, drafting, and chat functionality",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint that returns a welcome message"""
    return {"message": "Welcome to the Gmail Agent API"}

# Include all routers under /api prefix to match frontend expectations
api_prefix = "/api"
app.include_router(auth_router, prefix=f"{api_prefix}/auth", tags=["Authentication"])
app.include_router(emails_router, prefix=f"{api_prefix}/emails", tags=["Emails"])
app.include_router(drafts_router, prefix=f"{api_prefix}/drafts", tags=["Drafts"])
app.include_router(chat_router, prefix=f"{api_prefix}/chat", tags=["Chat"])
app.include_router(attachments_router, prefix=f"{api_prefix}/attachments", tags=["Attachments"])
