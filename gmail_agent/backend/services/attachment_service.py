import os
import tempfile
import logging
import warnings
from typing import List, Dict, Any, Optional
from pathlib import Path
from markitdown import MarkItDown
from langchain_groq import ChatGroq
from langchain.prompts.chat import ChatPromptTemplate

from config import settings
from services.gmail_service import GmailService
from models.email import AttachmentSummary


# Suppress resource and deprecation warnings
warnings.filterwarnings("ignore", category=ResourceWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class AttachmentService:
    """Service for handling email attachments and generating summaries"""
    
    def __init__(self, gmail_service: GmailService):
        """Initialize the attachment service with a Gmail service instance"""
        self.gmail_service = gmail_service
        self.markdown_converter = MarkItDown()
        self.llm = ChatGroq(
            model="mixtral-8x7b-32768",
            temperature=0,
            max_tokens=300,
            timeout=60,
            max_retries=2,
            api_key=settings.GROQ_API_KEY
        )
        
    def get_attachment(self, email_id: str, attachment_id: str) -> Optional[Any]:
        """
        Get a specific attachment from an email
        
        Args:
            email_id: The email ID
            attachment_id: The attachment ID (format: email_id_index)
            
        Returns:
            The attachment object if found, None otherwise
        """
        try:
            # Parse attachment index from ID (format: email_id_index)
            parts = attachment_id.split('_')
            if len(parts) < 2:
                logger.error(f"Invalid attachment ID format: {attachment_id}")
                return None
                
            # Last part should be the index
            index = int(parts[-1])
            
            # Get email
            email = self.gmail_service.get_message_by_id(email_id)
            if not email or not hasattr(email, 'attachments') or not email.attachments:
                return None
                
            # Check if index is valid
            if index < 0 or index >= len(email.attachments):
                return None
                
            return email.attachments[index]
        except Exception as e:
            logger.error(f"Error getting attachment: {e}")
            return None
    
    def list_attachments(self, email_id: str) -> List[Dict[str, Any]]:
        """
        List all attachments for a specific email
        
        Args:
            email_id: The email ID
            
        Returns:
            List of attachment data
        """
        try:
            email = self.gmail_service.get_message_by_id(email_id)
            if not email or not hasattr(email, 'attachments') or not email.attachments:
                return []
                
            attachments = []
            for i, att in enumerate(email.attachments):
                attachments.append({
                    "filename": att.filename,
                    "attachment_id": f"{email_id}_{i}",
                    "content_type": att.filetype if hasattr(att, 'filetype') else None,
                    "size": att.size if hasattr(att, 'size') else None
                })
                
            return attachments
        except Exception as e:
            logger.error(f"Error listing attachments: {e}")
            return []

    def summarize_attachment(self, email_id: str, attachment_id: str) -> Optional[AttachmentSummary]:
        """
        Generate a summary for a specific attachment
        
        Args:
            email_id: The email ID
            attachment_id: The attachment ID
            
        Returns:
            AttachmentSummary if successful, None otherwise
        """
        attachment = self.get_attachment(email_id, attachment_id)
        if not attachment:
            return None
            
        temp_path = None
        try:
            # Determine file extension from attachment filename
            suffix = os.path.splitext(attachment.filename)[1]
            
            # First, try to get the content directly
            content = attachment.download()
            
            # If direct download returns nothing, try saving the file
            if not content:
                attachment.save()
                if os.path.exists(attachment.filename):
                    with open(attachment.filename, 'rb') as f:
                        content = f.read()
                    os.remove(attachment.filename)
                else:
                    return AttachmentSummary(
                        email_id=email_id,
                        attachment_id=attachment_id,
                        filename=attachment.filename,
                        summary="Attachment content could not be retrieved."
                    )
            
            # Write the content to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(content)
                temp_path = tmp.name

            # Convert the temporary file using MarkItDown
            conversion_result = self.markdown_converter.convert(temp_path)
            text_content = conversion_result.text_content
            
            if not text_content:
                return AttachmentSummary(
                    email_id=email_id,
                    attachment_id=attachment_id,
                    filename=attachment.filename,
                    summary="No text could be extracted from the attachment."
                )

            # Escape curly braces in the text to prevent formatting issues
            safe_text_content = text_content.replace("{", "{{").replace("}", "}}")
            
            # Build the prompt text with instructions
            prompt_text = (
                "Please provide a concise summary of the following attachment content as a single paragraph. "
                "Make it as concise as possible and avoid detailed breakdowns yet give an overview of the attachment. "
                "Do not include any bullet points, lists, or detailed breakdowns. "
                "Only summarize the overall content.\n\n"
                f"{safe_text_content}"
            )
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are a highly accurate and detail-oriented summarization assistant."),
                ("human", prompt_text)
            ])
            
            messages_formatted = prompt.format_messages()
            response = self.llm.invoke(messages_formatted)
            summary = response.content.strip()
            
            return AttachmentSummary(
                email_id=email_id,
                attachment_id=attachment_id,
                filename=attachment.filename,
                summary=summary
            )
            
        except Exception as e:
            logger.error(f"Error summarizing attachment: {e}")
            return AttachmentSummary(
                email_id=email_id,
                attachment_id=attachment_id,
                filename=attachment.filename if attachment else "unknown",
                summary=f"Failed to summarize attachment: {str(e)}"
            )
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
