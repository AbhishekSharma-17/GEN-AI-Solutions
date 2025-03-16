import logging
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from langchain_groq import ChatGroq
from langchain.prompts.chat import ChatPromptTemplate

from config import settings
from services.gmail_service import GmailService
from models.draft import DraftContent, DraftResponse


# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class DraftService:
    """Service for generating and managing email drafts"""
    
    def __init__(self, gmail_service: GmailService):
        """Initialize the draft service with a Gmail service instance"""
        self.gmail_service = gmail_service
        try:
            # Check if Groq API key is available
            if not settings.GROQ_API_KEY:
                logger.warning("GROQ_API_KEY not found in settings. Using mock LLM mode.")
                self.llm_available = False
            else:
                self.llm = ChatGroq(
                    model="mixtral-8x7b-32768",
                    temperature=0.7,
                    max_tokens=settings.EMAIL_TEMPLATES.get("reply_max_tokens", 500),
                    timeout=60,
                    max_retries=2,
                    api_key=settings.GROQ_API_KEY
                )
                self.llm_available = True
        except Exception as e:
            logger.error(f"Error initializing LLM: {e}")
            self.llm_available = False
        # Store generated drafts in memory
        # In a production app, this would be in a database
        self.draft_store: Dict[str, Any] = {}
        
    def generate_reply_draft(self, email_id: str, custom_instructions: Optional[str] = None) -> Optional[DraftResponse]:
        """
        Generate a draft reply for a specific email
        
        Args:
            email_id: ID of the email to generate a draft for
            custom_instructions: Optional custom instructions for the draft
            
        Returns:
            DraftResponse if successful, None otherwise
        """
        # Get the email by ID
        email = self.gmail_service.get_message_by_id(email_id)
        if not email:
            logger.error(f"Email with ID {email_id} not found")
            return None
            
        # Generate the draft content
        draft_content = self.generate_reply_content(email, custom_instructions)
        if not draft_content:
            return None
            
        # Save the draft in Gmail
        draft_id = self.gmail_service.create_draft_reply(email, draft_content)
        if not draft_id:
            logger.error("Failed to save draft in Gmail")
            return None
            
        draft_obj = DraftResponse(
            draft_id=draft_id,
            email_id=email_id,
            content=DraftContent(
                subject=f"Re: {email.subject}" if hasattr(email, 'subject') else "Re: (No subject)",
                body=draft_content,
                recipient=email.sender if hasattr(email, 'sender') else "",
                sender=self.gmail_service.gmail.user_email if hasattr(self.gmail_service.gmail, "user_email") else "me"
            ),
            created_at=datetime.now().isoformat()
        )
        
        # Store the draft in our local store
        self.draft_store[draft_id] = draft_obj
        
        return draft_obj
        
    def generate_reply_content(self, email: Any, custom_instructions: Optional[str] = None) -> Optional[str]:
        """
        Generate reply content for an email using LLM
        
        Args:
            email: The email object to generate a reply for
            custom_instructions: Optional custom instructions for the draft
            
        Returns:
            Generated reply text if successful, None otherwise
        """
        try:
            # Use plain text if available; otherwise, use a snippet
            email_body = getattr(email, 'plain', None) or getattr(email, 'snippet', "")
            if len(email_body) > 1000:
                email_body = email_body[:1000] + "..."
            
            # Check if LLM is available
            if not hasattr(self, 'llm_available') or not self.llm_available:
                logger.warning("LLM not available, using template draft")
                # Generate a simple template response when LLM is not available
                sender_name = email.sender.split('@')[0] if hasattr(email, 'sender') and '@' in email.sender else "there"
                subject = email.subject if hasattr(email, 'subject') else "(No subject)"
                
                template_draft = f"""Hello {sender_name},

Thank you for your email regarding "{subject}". I've received your message and will respond properly as soon as possible.

Best regards,
{self.gmail_service.gmail.user_email if hasattr(self.gmail_service.gmail, "user_email") else "Me"}

Note: This is an automatically generated template as the AI drafting service is currently unavailable.
"""
                if custom_instructions:
                    template_draft += f"\nAdditional note: {custom_instructions}\n"
                    
                return template_draft
            
            # LLM is available, use it to generate the draft
            system_prompt = (
                "You are a professional email assistant. Your task is to draft a reply email "
                "based on the email details provided. Craft a personalized, "
                "clear, and courteous reply that acknowledges the sender's message, addresses key points, "
                "and ends with an appropriate sign-off. "
                "Return only the text of the reply email draft."
            )
            
            if custom_instructions:
                system_prompt += f"\n\nAdditional instructions: {custom_instructions}"
                
            draft_prompt = ChatPromptTemplate.from_messages([
                (
                    "system",
                    system_prompt
                ),
                (
                    "human",
                    (
                        "Email Details:\n"
                        "Subject: {subject}\n"
                        "From: {sender}\n"
                        "Date: {date}\n"
                        "Email Body:\n{body}"
                    )
                )
            ])

            prompt_inputs = {
                "subject": email.subject if hasattr(email, 'subject') else "(No subject)",
                "sender": email.sender if hasattr(email, 'sender') else "",
                "date": email.date if hasattr(email, 'date') else "",
                "body": email_body,
            }

            messages_formatted = draft_prompt.format_messages(**prompt_inputs)
            response_obj = self.llm.invoke(messages_formatted)
            reply_draft = response_obj.content.strip()
            logger.info("Reply draft generated successfully.")
            return reply_draft
            
        except Exception as e:
            logger.error(f"Error generating reply draft: {e}")
            return None
            
    def get_draft(self, draft_id: str) -> Optional[DraftResponse]:
        """
        Get a specific draft by ID
        
        Args:
            draft_id: ID of the draft
            
        Returns:
            DraftResponse if found, None otherwise
        """
        return self.draft_store.get(draft_id)
        
    def list_drafts(self) -> List[DraftResponse]:
        """
        List all drafts in the store
        
        Returns:
            List of DraftResponse objects
        """
        return list(self.draft_store.values())
