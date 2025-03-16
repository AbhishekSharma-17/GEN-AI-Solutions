"""
Troubleshooting script to diagnose backend errors
"""
import os
import sys
import traceback
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("Troubleshooter")

# Add the current directory to the path
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))

def check_import_path():
    """Check if import path is correctly set up"""
    logger.info(f"Current sys.path: {sys.path}")
    
def test_imports():
    """Test importing all necessary modules"""
    try:
        # Test router imports
        logger.info("Importing routers...")
        from routers.auth import router as auth_router
        logger.info("✅ Auth router imported successfully")
        
        from routers.emails import router as emails_router
        logger.info("✅ Emails router imported successfully")
        
        from routers.drafts import router as drafts_router
        logger.info("✅ Drafts router imported successfully")
        
        from routers.chat import router as chat_router
        logger.info("✅ Chat router imported successfully")
        
        from routers.attachments import router as attachments_router
        logger.info("✅ Attachments router imported successfully")
        
        # Test service imports
        logger.info("Importing services...")
        from services.gmail_service import GmailService
        logger.info("✅ GmailService imported successfully")
        
        from services.prioritizer_service import EmailPrioritizerService
        logger.info("✅ EmailPrioritizerService imported successfully")
        
        from services.draft_service import DraftService
        logger.info("✅ DraftService imported successfully")
        
        from services.chat_service import ChatService
        logger.info("✅ ChatService imported successfully")
        
        from services.attachment_service import AttachmentService
        logger.info("✅ AttachmentService imported successfully")
        
        # Test model imports
        logger.info("Importing models...")
        try:
            from models.email import EmailFilter, EmailDetail, EmailSummary, EmailListResponse
            logger.info("✅ Email models imported successfully")
        except Exception as e:
            logger.error(f"❌ Error importing email models: {e}")
            traceback.print_exc()
            
        try:
            from models.auth import ClientSecretRequest, AuthResponse, SessionInfo
            logger.info("✅ Auth models imported successfully")
        except Exception as e:
            logger.error(f"❌ Error importing auth models: {e}")
            traceback.print_exc()
            
        try:
            from models.chat import ChatQuery, ChatResponse
            logger.info("✅ Chat models imported successfully") 
        except Exception as e:
            logger.error(f"❌ Error importing chat models: {e}")
            traceback.print_exc()
            
        try:
            from models.draft import DraftRequest, DraftResponse, DraftListResponse
            logger.info("✅ Draft models imported successfully")
        except Exception as e:
            logger.error(f"❌ Error importing draft models: {e}")
            traceback.print_exc()
    
    except Exception as e:
        logger.error(f"❌ Error testing imports: {e}")
        traceback.print_exc()

def simulate_email_request():
    """Test initializing EmailPrioritizerService"""
    try:
        logger.info("Testing email prioritizer...")
        from services.prioritizer_service import EmailPrioritizerService
        from services.gmail_service import GmailService
        
        # Don't actually initialize the services, just check the code
        logger.info("Checking EmailPrioritizerService code...")
        with open(os.path.join(current_dir, "services", "prioritizer_service.py"), "r") as f:
            content = f.read()
            logger.info(f"prioritizer_service.py length: {len(content)} bytes")
            
        logger.info("Checking GmailService code...")
        with open(os.path.join(current_dir, "services", "gmail_service.py"), "r") as f:
            content = f.read()
            logger.info(f"gmail_service.py length: {len(content)} bytes")
            
    except Exception as e:
        logger.error(f"❌ Error in simulate_email_request: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    logger.info("Starting troubleshooting...")
    check_import_path()
    test_imports()
    simulate_email_request()
    logger.info("Troubleshooting complete")
