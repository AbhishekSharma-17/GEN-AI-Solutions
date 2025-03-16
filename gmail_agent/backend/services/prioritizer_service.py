import os
import re
import json
import time
import logging
import html
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
from langchain_groq import ChatGroq
from langchain.prompts.chat import ChatPromptTemplate

from config import settings
from services.gmail_service import GmailService
from models.email import EmailSummary, PriorityEmailResponse


# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class EmailPrioritizerService:
    """Service to prioritize emails and identify those needing replies"""
    
    def __init__(self, gmail_service: GmailService):
        """Initialize the prioritizer with a Gmail service instance"""
        self.gmail_service = gmail_service
        try:
            # Check if Groq API key is available
            if not settings.GROQ_API_KEY:
                logger.warning("GROQ_API_KEY not found in settings. Using mock LLM mode.")
                self.llm_available = False
            else:
                self.llm = ChatGroq(
                    model="mixtral-8x7b-32768",
                    temperature=0,
                    max_tokens=50,
                    timeout=60,
                    max_retries=2,
                    api_key=settings.GROQ_API_KEY
                )
                self.summarize_llm = ChatGroq(
                    model="mixtral-8x7b-32768",
                    temperature=0.7,
                    max_tokens=75,
                    timeout=30,
                    max_retries=2,
                    api_key=settings.GROQ_API_KEY
                )
                self.llm_available = True
        except Exception as e:
            logger.error(f"Error initializing LLM: {e}")
            self.llm_available = False

    def summarize_email(self, email: Any) -> str:
        """
        Generates a concise summary of the email content
        """
        email_body = getattr(email, 'plain', None) or getattr(email, 'snippet', "")
        
        if not email_body:
            return ""
            
        if len(email_body) > 2000:
            email_body = email_body[:2000] + "..."
            
        summary_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                (
                    "You are a professional email assistant. Summarize the following email content concisely in 2-3 lines in English only. "
                    "Return only the summary."
                )
            ),
            (
                "human",
                "Email Content:\n{body}"
            )
        ])
        
        prompt_inputs = {"body": email_body}
        
        try:
            messages_formatted = summary_prompt.format_messages(**prompt_inputs)
            response_obj = self.summarize_llm.invoke(messages_formatted)
            text_summary = response_obj.content.strip()
            return text_summary
        except Exception as e:
            logger.error(f"Error summarizing email: {e}")
            return "Error generating summary"
            
    def calculate_importance_score(self, email: Any) -> float:
        """
        Calculate importance score for an email on a scale of 1-10
        """
        if hasattr(email, 'plain') and email.plain:
            email_body = email.plain
        else:
            email_body = email.snippet if hasattr(email, 'snippet') else ""
            
        if len(email_body) > 500:
            email_body = email_body[:500] + "..."
            
        ranking_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                (
                    "You are an intelligent email assistant specialized in evaluating email urgency and importance. "
                    "Score the following email on a scale from 1 to 10, where 10 means extremely important and urgent, and 1 means not important at all. "
                    "Return only a single numerical score with no additional text."
                )
            ),
            (
                "human",
                "Email subject: {subject}\nEmail received on: {date}\nEmail body: {body}"
            )
        ])
        
        rank_inputs = {
            "subject": email.subject if hasattr(email, 'subject') else "",
            "date": email.date if hasattr(email, 'date') else "",
            "body": email_body
        }
        
        try:
            messages_formatted = ranking_prompt.format_messages(**rank_inputs)
            response_obj = self.llm.invoke(messages_formatted)
            response_text = response_obj.content.strip()
            score_match = re.search(r'\d+(\.\d+)?', response_text)
            score = float(score_match.group()) if score_match else 0.0
            return score
        except Exception as e:
            logger.error(f"Error calculating importance score: {e}")
            return 0.0
            
    def needs_reply(self, email: Any) -> bool:
        """
        Determine if an email needs a reply
        """
        if hasattr(email, 'sender') and ("noreply" in email.sender.lower() or "no-reply" in email.sender.lower()):
            return False
            
        if hasattr(email, 'plain') and email.plain:
            email_body = email.plain
        else:
            email_body = email.snippet if hasattr(email, 'snippet') else ""
            
        if len(email_body) > 500:
            email_body = email_body[:500] + "..."
            
        reply_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                (
                    "You are an intelligent email assistant that determines whether an email requires a reply. "
                    "Make sure you consider the email's content, tone, and sender details. Answer 'Yes' only when it is truly necessary. "
                    "Return only 'Yes' or 'No'."
                )
            ),
            (
                "human",
                "Email subject: {subject}\nEmail sender: {sender}\nEmail received on: {date}\nEmail body: {body}"
            )
        ])
        
        reply_inputs = {
            "subject": email.subject if hasattr(email, 'subject') else "",
            "sender": email.sender if hasattr(email, 'sender') else "",
            "date": email.date if hasattr(email, 'date') else "",
            "body": email_body
        }
        
        try:
            messages_reply = reply_prompt.format_messages(**reply_inputs)
            reply_response_obj = self.llm.invoke(messages_reply)
            reply_response_text = reply_response_obj.content.strip().lower()
            return reply_response_text == "yes"
        except Exception as e:
            logger.error(f"Error checking if email needs reply: {e}")
            return False
    
    def prioritize_emails(self, time_frame_hours: int = 24) -> PriorityEmailResponse:
        """
        Prioritizes emails from the inbox and returns those that are important or need replies
        
        Args:
            time_frame_hours: Hours back to fetch emails
            
        Returns:
            PriorityEmailResponse with top important emails and emails needing replies
        """
        emails = self.gmail_service.get_recent_emails(time_frame_hours=time_frame_hours)
        
        if not emails:
            return PriorityEmailResponse(top_important_emails=[], reply_needed_emails=[])
            
        reply_emails_list = []
        top_emails_list = []
        
        # Check if LLM is available
        if not hasattr(self, 'llm_available') or not self.llm_available:
            logger.warning("LLM not available, using simple prioritization rules")
            # Simple rule-based prioritization when LLM is not available
            for email in emails:
                # Simple rule: check for urgent keywords in subject
                subject = email.subject.lower() if hasattr(email, 'subject') else ""
                urgent_words = ['urgent', 'important', 'asap', 'deadline', 'critical']
                is_urgent = any(word in subject for word in urgent_words)
                
                # Check for reply indicators
                is_reply_needed = False
                sender = email.sender.lower() if hasattr(email, 'sender') else ""
                if not ("noreply" in sender or "no-reply" in sender):
                    # Simple heuristic: emails from real people might need replies
                    is_reply_needed = True
                
                # Create email summary
                email_obj = self.gmail_service.convert_to_email_summary(email, "Summary not available (LLM offline)")
                
                if is_reply_needed:
                    email_obj.needs_reply = True
                    reply_emails_list.append(email_obj)
                
                if is_urgent:
                    email_obj.importance_score = 8.0  # High importance for urgent emails
                else:
                    email_obj.importance_score = 5.0  # Medium importance for others
                top_emails_list.append(email_obj)
        else:
            # LLM-based prioritization when available
            for email in emails:
                try:
                    # Check if email needs reply
                    reply_needed = self.needs_reply(email)
                    
                    # Generate summary
                    email_summary = self.summarize_email(email)
                    
                    if reply_needed:
                        email_obj = self.gmail_service.convert_to_email_summary(email, email_summary)
                        email_obj.needs_reply = True
                        reply_emails_list.append(email_obj)
                    else:
                        # Calculate importance score for non-reply emails
                        score = self.calculate_importance_score(email)
                        
                        email_obj = self.gmail_service.convert_to_email_summary(email, email_summary)
                        email_obj.importance_score = score
                        top_emails_list.append(email_obj)
                    
                    # Add a small delay to avoid rate limits
                    time.sleep(0.5)
                    
                except Exception as e:
                    logger.error(f"Error processing email for prioritization: {e}")
                    # Add email with default values in case of error
                    email_obj = self.gmail_service.convert_to_email_summary(email, "Error processing email")
                    email_obj.importance_score = 5.0  # Default medium importance
                    top_emails_list.append(email_obj)
        
        # Sort by importance score
        sorted_emails = sorted(top_emails_list, key=lambda x: x.importance_score or 0, reverse=True)
        top_emails = sorted_emails[:5]  # Get top 5 emails
        
        return PriorityEmailResponse(top_important_emails=top_emails, reply_needed_emails=reply_emails_list)
