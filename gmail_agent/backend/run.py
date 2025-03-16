"""
Entry point script for running the FastAPI application
"""
import os
import sys
import uvicorn
from pathlib import Path

# Add the parent directory to sys.path to allow proper imports
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))

if __name__ == "__main__":
    # Run FastAPI app with uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
    print("Server running at http://127.0.0.1:8000")
