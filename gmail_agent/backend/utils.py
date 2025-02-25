import os
import time
import logging
import base64
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from dateutil.parser import parse as parse_date

from simplegmail import Gmail
from simplegmail.query import construct_query
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.prompts.chat import ChatPromptTemplate

# Configure logging for better debugging and traceability.
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
load_dotenv()  # Load environment variables from a .env file if present.
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class EmailDraftUtil:
    def __init__(self, gmail=None):
        """
        Initialize the utility. If no Gmail object is provided,
        authenticate using the default client_secret.json.
        """
        if gmail is None:
            self.gmail = self.authenticate_gmail()
        else:
            self.gmail = gmail

    def authenticate_gmail(self):
        """
        Authenticates the Gmail API using the client_secret.json file.
        On the first run, a browser window will open for you to grant permissions.
        
        Returns:
            An authenticated Gmail object.
        """
        try:
            gmail = Gmail()  # Uses client_secret.json by default.
            logging.info("Successfully authenticated with Gmail.")
            return gmail
        except Exception as e:
            logging.error("Failed to authenticate with Gmail: %s", e)
            raise

    def generate_reply_draft_for_email(self, email):
        """
        Uses ChatGroq (via LangChain) to generate a professional reply draft for the provided email.
        The prompt instructs the model that it is Zamal Ali Babar’s assistant and must draft a reply
        on his behalf based on the email received. The reply must be original, address the sender’s message,
        and not simply echo the email content.
        
        Args:
            email: The email object (from SimpleGmail).
        
        Returns:
            A string with the generated reply draft, or None on error.
        """
        try:
            # Use plain text if available; otherwise, use a snippet.
            email_body = getattr(email, 'plain', None) or getattr(email, 'snippet', "")
            if len(email_body) > 1000:
                email_body = email_body[:1000] + "..."
            
            # Initialize the ChatGroq LLM with the repository secret.
            llm = ChatGroq(
                model="mixtral-8x7b-32768",  # Adjust model as needed.
                temperature=0.7,
                max_tokens=300,
                timeout=60,
                max_retries=2,
                api_key=GROQ_API_KEY  # Using the repository secret.
            )

            # Revised prompt: instruct the model that it is acting as Zamal Ali Babar's assistant.
            draft_prompt = ChatPromptTemplate.from_messages([
                (
                    "system",
                    (
                        "You are Zamal Ali Babar's professional email assistant. Your task is to draft a reply email on his behalf "
                        "based on the email details provided. Do not simply repeat the original email. Instead, craft a personalized, "
                        "clear, and courteous reply that acknowledges the sender's message, addresses key points, and ends with an appropriate sign-off. "
                        "Return only the text of the reply email draft."
                    )
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
                "subject": email.subject,
                "sender": email.sender,
                "date": email.date,
                "body": email_body,
            }

            messages_formatted = draft_prompt.format_messages(**prompt_inputs)
            response_obj = llm.invoke(messages_formatted)
            reply_draft = response_obj.content.strip()
            logging.info("Reply draft generated successfully.")
            return reply_draft

        except Exception as e:
            logging.error("Error generating reply draft for email '%s': %s", email.subject, e)
            return None

    def create_draft_reply(self, email, reply_body):
        """
        Saves the reply draft as a Gmail draft using the Gmail API.
        Builds a MIME message from the reply draft and calls the Gmail API's drafts.create() method.
        
        Args:
            email: The original email object to reply to.
            reply_body: The text of the reply draft.
        """
        try:
            # Prepend "Re:" to the subject if not already present.
            reply_subject = email.subject if email.subject.lower().startswith("re:") else f"Re: {email.subject}"
            # Determine the sender email address.
            sender_email = self.gmail.user_email if hasattr(self.gmail, "user_email") else "me"

            # Create a MIMEText message for the reply.
            mime_msg = MIMEText(reply_body)
            mime_msg['to'] = email.sender
            mime_msg['from'] = sender_email
            mime_msg['subject'] = reply_subject

            # Encode the message as base64url.
            raw_msg = base64.urlsafe_b64encode(mime_msg.as_bytes()).decode()

            # Build the draft body.
            draft_body = {
                'message': {
                    'raw': raw_msg
                }
            }

            # Use the underlying Gmail API to create the draft.
            draft = self.gmail.service.users().drafts().create(userId="me", body=draft_body).execute()
            logging.info("Draft reply created successfully. Draft ID: %s", draft.get('id'))
        except Exception as e:
            logging.error("Error creating Gmail draft for email '%s': %s", email.subject, e)
            return None

    def generate_and_save_draft(self, email):
        """
        Generates a reply draft for the provided email and saves it as a Gmail draft.
        
        Args:
            email: The email object to process.
        
        Returns:
            The generated reply draft text if successful, otherwise None.
        """
        reply_draft = self.generate_reply_draft_for_email(email)
        if not reply_draft:
            logging.error("Failed to generate a reply draft for email: %s", email.subject)
            return None

        self.create_draft_reply(email, reply_draft)
        return reply_draft

# --- Module-level convenience functions ---

def authenticate_gmail():
    """
    Module-level helper to authenticate and return a Gmail object.
    """
    ed_util = EmailDraftUtil()
    return ed_util.gmail

def generate_and_save_draft(email):
    """
    Module-level helper that accepts an email object, generates a reply draft,
    and creates a Gmail draft.
    
    Args:
        email: The email object to process.
    
    Returns:
        The generated reply draft text if successful, otherwise None.
    """
    ed_util = EmailDraftUtil()
    return ed_util.generate_and_save_draft(email)