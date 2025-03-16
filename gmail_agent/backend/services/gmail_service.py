import os
import json
import base64
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from dateutil.parser import parse as parse_date
from dateutil.tz import tzlocal, gettz
from simplegmail import Gmail
from simplegmail.query import construct_query

from config import settings
from models.email import EmailBase, EmailDetail, EmailSummary, EmailAttachment


# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class GmailService:
    """Service for interacting with Gmail API"""

    def __init__(self, gmail_client: Gmail):
        self.gmail = gmail_client

    def get_recent_emails(self, time_frame_hours: int = 24, include_promotions: bool = False, 
                         include_social: bool = False, search_query: Optional[str] = None, 
                         max_results: Optional[int] = None) -> List[Any]:
        """
        Fetches recent emails from the Gmail inbox
        
        Args:
            time_frame_hours: Hours back to fetch emails
            include_promotions: Whether to include promotional emails
            include_social: Whether to include social category emails
            search_query: Additional search query to filter emails
            max_results: Maximum number of results to return
            
        Returns:
            List of email message objects
        """
        try:
            time_threshold = datetime.now(tz=tzlocal()) - timedelta(hours=time_frame_hours)
            date_query = time_threshold.strftime("%Y/%m/%d")
            
            # Build base query
            query_parts = [f"after:{date_query}"]
            
            # Add inbox filter
            query_parts.append("in:inbox")
            
            # Exclude promotions and social if not explicitly included
            if not include_promotions:
                query_parts.append("-category:promotions")
            if not include_social:
                query_parts.append("-category:social")
                
            # Add user-provided search query if present
            if search_query:
                query_parts.append(f"({search_query})")
                
            # Combine all query parts
            query = " ".join(query_parts)
            logger.info(f"Using Gmail query: {query}")
                
            # Fetch messages
            messages = self.gmail.get_messages(query=query)
            
            if max_results and len(messages) > max_results:
                messages = messages[:max_results]
                
            # Filter messages by date (additional check to ensure time threshold is respected)
            recent_messages = []
            for msg in messages:
                try:
                    msg_dt = parse_date(msg.date)
                    if msg_dt >= time_threshold:
                        recent_messages.append(msg)
                except Exception as e:
                    logger.warning(f"Could not parse date for message: {e}")
                    continue
            
            return recent_messages
            
        except Exception as e:
            logger.error(f"Error fetching recent emails: {e}")
            raise

    def convert_to_email_summary(self, email: Any, summary: Optional[str] = None) -> EmailSummary:
        """
        Converts a Gmail message to an EmailSummary model
        
        Args:
            email: The Gmail message object
            summary: Optional pre-generated summary
            
        Returns:
            EmailSummary object
        """
        has_attachments = hasattr(email, 'attachments') and bool(email.attachments)
        
        return EmailSummary(
            email_id=email.id if hasattr(email, 'id') else "",
            subject=email.subject if hasattr(email, 'subject') else "(No subject)",
            sender=email.sender if hasattr(email, 'sender') else "",
            date=email.date if hasattr(email, 'date') else "",
            snippet=email.snippet if hasattr(email, 'snippet') else "",
            summary=summary,
            has_attachments=has_attachments
        )

    def convert_to_email_detail(self, email: Any) -> EmailDetail:
        """
        Converts a Gmail message to an EmailDetail model
        
        Args:
            email: The Gmail message object
            
        Returns:
            EmailDetail object
        """
        attachments = []
        if hasattr(email, 'attachments') and email.attachments:
            for i, att in enumerate(email.attachments):
                attachments.append(EmailAttachment(
                    filename=att.filename,
                    attachment_id=f"{email.id}_{i}",
                    content_type=att.filetype if hasattr(att, 'filetype') else None,
                    size=att.size if hasattr(att, 'size') else None
                ))
                
        return EmailDetail(
            email_id=email.id if hasattr(email, 'id') else "",
            subject=email.subject if hasattr(email, 'subject') else "(No subject)",
            sender=email.sender if hasattr(email, 'sender') else "",
            date=email.date if hasattr(email, 'date') else "",
            snippet=email.snippet if hasattr(email, 'snippet') else "",
            body=email.plain if hasattr(email, 'plain') else None,
            html=email.html if hasattr(email, 'html') else None,
            attachments=attachments
        )
        
    def format_date(self, date_str: str) -> str:
        """
        Format date to a standardized format
        
        Args:
            date_str: The date string from Gmail
            
        Returns:
            Formatted date string
        """
        try:
            dt = parse_date(date_str)
            cet_tz = gettz("Europe/Berlin")
            dt_cet = dt.astimezone(cet_tz)
            return dt_cet.strftime("%Y-%m-%d %I:%M%p")
        except Exception as e:
            logger.error(f"Error formatting date: {e}")
            return date_str

    def get_message_by_id(self, message_id: str) -> Optional[Any]:
        """
        Get a specific Gmail message by its ID
        
        Args:
            message_id: The Gmail message ID
            
        Returns:
            The Gmail message object if found, None otherwise
        """
        try:
            # Fix for 'Gmail' object has no attribute 'get_message'
            # Looking for the correct method in SimpleGmail to get message by ID
            if hasattr(self.gmail, 'get_message'):
                return self.gmail.get_message(message_id)
            elif hasattr(self.gmail, 'get_message_by_id'):
                return self.gmail.get_message_by_id(message_id)
            elif hasattr(self.gmail, 'messages') and hasattr(self.gmail.messages, 'get'):
                return self.gmail.messages.get(message_id)
            else:
                # Try with get_messages using a message ID filter
                messages = self.gmail.get_messages(query=f"id:{message_id}")
                return messages[0] if messages else None
        except Exception as e:
            logger.error(f"Error fetching message by ID {message_id}: {e}")
            return None
            
    def create_draft_reply(self, email: Any, reply_body: str) -> Optional[str]:
        """
        Saves a reply draft using the Gmail API
        
        Args:
            email: The original email object
            reply_body: The text of the reply draft
            
        Returns:
            Draft ID if successful, None otherwise
        """
        try:
            # Prepend "Re:" to the subject if not already present
            reply_subject = email.subject if email.subject.lower().startswith("re:") else f"Re: {email.subject}"
            
            # Determine the sender email address
            sender_email = self.gmail.user_email if hasattr(self.gmail, "user_email") else "me"

            # Create a MIMEText message for the reply
            mime_msg = MIMEText(reply_body)
            mime_msg['to'] = email.sender
            mime_msg['from'] = sender_email
            mime_msg['subject'] = reply_subject

            # Encode the message as base64url
            raw_msg = base64.urlsafe_b64encode(mime_msg.as_bytes()).decode()

            # Build the draft body
            draft_body = {
                'message': {
                    'raw': raw_msg
                }
            }

            # Use the underlying Gmail API to create the draft
            draft = self.gmail.service.users().drafts().create(userId="me", body=draft_body).execute()
            logger.info(f"Draft reply created successfully. Draft ID: {draft.get('id')}")
            
            return draft.get('id')
        except Exception as e:
            logger.error(f"Error creating Gmail draft for email '{email.subject}': {e}")
            return None

    def list_drafts(self) -> List[Dict[str, Any]]:
        """
        Lists all drafts in the Gmail account
        
        Returns:
            List of draft objects
        """
        try:
            drafts = self.gmail.service.users().drafts().list(userId="me").execute()
            return drafts.get("drafts", [])
        except Exception as e:
            logger.error(f"Error listing drafts: {e}")
            return []
