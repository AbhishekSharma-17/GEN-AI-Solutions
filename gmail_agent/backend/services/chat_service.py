import logging
from typing import List, Any
from datetime import datetime
from langchain_groq import ChatGroq
from langchain.prompts.chat import ChatPromptTemplate
from config import settings
from services.gmail_service import GmailService
from models.chat import ChatResponse, ChatMessage


# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class ChatService:
    """Service for chat functionality with the inbox"""
    
    def __init__(self, gmail_service: GmailService):
        """Initialize the chat service with a Gmail service instance"""
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
                    max_tokens=150,
                    timeout=60,
                    max_retries=2,
                    api_key=settings.GROQ_API_KEY
                )
                self.llm_available = True
        except Exception as e:
            logger.error(f"Error initializing LLM: {e}")
            self.llm_available = False
        # Store chat history in memory
        # In a production app, this would be in a database
        self.chat_history: List[ChatMessage] = []
        
    def summarize_email(self, email: Any) -> str:
        """
        Returns a summary string for an email including subject, sender, date,
        a snippet from the body, and any attachment filenames if present.
        
        Args:
            email: The Gmail email object
            
        Returns:
            A formatted summary string
        """
        summary = f"Subject: {email.subject if hasattr(email, 'subject') else '(No subject)'}\n"
        summary += f"Sender: {email.sender if hasattr(email, 'sender') else ''}\n"
        summary += f"Date: {email.date if hasattr(email, 'date') else ''}\n"
        
        if hasattr(email, 'plain') and email.plain:
            body = email.plain
        else:
            body = email.snippet if hasattr(email, 'snippet') else ""
            
        if len(body) > 200:
            body = body[:200] + "..."
            
        summary += f"Snippet: {body}\n"
        
        if hasattr(email, 'attachments') and email.attachments:
            att_names = [att.filename for att in email.attachments]
            summary += f"Attachments: {', '.join(att_names)}\n"
            
        return summary
        
    def build_emails_summary(self, emails: List[Any]) -> str:
        """
        Builds a combined summary text for a list of emails
        
        Args:
            emails: List of Gmail email objects
            
        Returns:
            Combined summary text
        """
        if not emails:
            return "No emails found."
            
        summaries = [self.summarize_email(email) for email in emails]
        return "\n---------------------\n".join(summaries)
        
    def chat(self, query: str, time_frame_hours: int = 24) -> ChatResponse:
        """
        Process a chat query about the user's emails
        
        Args:
            query: The user query text
            time_frame_hours: Hours back to fetch emails
            
        Returns:
            ChatResponse with answer and updated message history
        """
        try:
            # Fetch recent emails
            emails = self.gmail_service.get_recent_emails(time_frame_hours=time_frame_hours)
            
            if not emails:
                answer = f"No emails found in the past {time_frame_hours} hours."
                
                # Add messages to chat history
                self.chat_history.append(ChatMessage(
                    role="user",
                    text=query,
                    timestamp=datetime.now().isoformat()
                ))
                
                self.chat_history.append(ChatMessage(
                    role="assistant",
                    text=answer,
                    timestamp=datetime.now().isoformat()
                ))
                
                return ChatResponse(answer=answer, messages=self.chat_history)
            
            # Build email summaries
            emails_summary = self.build_emails_summary(emails)
            
            # Check if LLM is available
            if not hasattr(self, 'llm_available') or not self.llm_available:
                # Fallback to a simple response when LLM is not available
                answer = f"LLM service is not available. Here are your recent emails:\n\n{emails_summary}"
            else:
                # Create chat prompt
                chat_prompt = ChatPromptTemplate.from_messages([
                    (
                        "system",
                        "You are a helpful assistant that answers queries based on a collection of email summaries. Provide a clear, concise answer."
                    ),
                    (
                        "human",
                        f"User query: {query}\n\nHere are the summaries of my emails from the past {time_frame_hours} hours:\n\n{emails_summary}\n\nBased on the above, please answer the query."
                    )
                ])
                
                # Get response from LLM
                messages_formatted = chat_prompt.format_messages()
                response = self.llm.invoke(messages_formatted)
                answer = response.content.strip()
            
            # Add messages to chat history
            self.chat_history.append(ChatMessage(
                role="user",
                text=query,
                timestamp=datetime.now().isoformat()
            ))
            
            self.chat_history.append(ChatMessage(
                role="assistant",
                text=answer,
                timestamp=datetime.now().isoformat()
            ))
            
            # Keep chat history limited to last 20 messages
            if len(self.chat_history) > 20:
                self.chat_history = self.chat_history[-20:]
                
            return ChatResponse(answer=answer, messages=self.chat_history)
            
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            answer = f"I encountered an error while processing your query: {str(e)}"
            
            self.chat_history.append(ChatMessage(
                role="user",
                text=query,
                timestamp=datetime.now().isoformat()
            ))
            
            self.chat_history.append(ChatMessage(
                role="assistant",
                text=answer,
                timestamp=datetime.now().isoformat()
            ))
            
            return ChatResponse(answer=answer, messages=self.chat_history)

    def clear_chat_history(self) -> None:
        """Clear the chat history"""
        self.chat_history = []
