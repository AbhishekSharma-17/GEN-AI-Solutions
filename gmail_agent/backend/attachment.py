# gmail_attachment_summarizer.py

import os
import tempfile
import warnings
from datetime import datetime, timedelta
from dateutil.parser import parse as parse_date
from dateutil.tz import tzlocal
from dotenv import load_dotenv

from simplegmail import Gmail
from markitdown import MarkItDown
from langchain_groq import ChatGroq
from langchain.prompts.chat import ChatPromptTemplate

# Suppress resource and deprecation warnings.
warnings.filterwarnings("ignore", category=ResourceWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

# Load environment variables (e.g., GROQ_API_KEY) from GitHub repository secrets.
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class GmailAttachmentSummarizer:
    """
    A class to fetch Gmail emails with attachments and generate concise summaries
    of both the email content and each attachment using MarkItDown and ChatGroq.
    """

    def __init__(self, time_frame_hours: int = 4):
        """
        Initialize the summarizer with a specified time frame (in hours) and instantiate the clients.
        :param time_frame_hours: The number of past hours to search for emails.
        """
        self.time_frame_hours = time_frame_hours
        self.gmail = Gmail()  # Uses your preconfigured Gmail secret file.
        self.markdown_converter = MarkItDown()
        self.llm = ChatGroq(
            model="mixtral-8x7b-32768",
            temperature=0,
            max_tokens=300,
            timeout=60,
            max_retries=2,
            api_key=GROQ_API_KEY  # Now using the repository secret.
        )

    def fetch_emails_with_attachments(self):
        """
        Fetch emails from the inbox within the past time frame that contain attachments.
        :return: List of email objects with attachments.
        """
        time_threshold = datetime.now(tz=tzlocal()) - timedelta(hours=self.time_frame_hours)
        date_query = time_threshold.strftime("%Y/%m/%d")
        query = f"in:inbox -category:promotions after:{date_query}"
        emails = self.gmail.get_messages(query=query)
        filtered = []
        for email in emails:
            try:
                email_date = parse_date(email.date)
            except Exception:
                continue
            if email_date >= time_threshold and hasattr(email, 'attachments') and email.attachments:
                filtered.append(email)
        return filtered

    def summarize_attachment(self, attachment) -> str:
        """
        Downloads an attachment into a temporary file, converts it with MarkItDown,
        then uses ChatGroq to produce a concise summary.
        :param attachment: An attachment object from an email.
        :return: A concise summary string of the attachment's content.
        """
        temp_path = None
        try:
            # Determine file extension from the attachment's filename.
            suffix = os.path.splitext(attachment.filename)[1]
            
            # First, try to get the content directly.
            content = attachment.download()
            
            # If direct download returns nothing, try saving the file.
            if not content:
                attachment.save()
                if os.path.exists(attachment.filename):
                    with open(attachment.filename, 'rb') as f:
                        content = f.read()
                    os.remove(attachment.filename)
                else:
                    return "Attachment content could not be retrieved."
            
            # Write the content to a temporary file.
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(content)
                temp_path = tmp.name

            # Convert the temporary file using MarkItDown.
            conversion_result = self.markdown_converter.convert(temp_path)
            text_content = conversion_result.text_content
            if not text_content:
                text_content = "No text could be extracted from the attachment."

        except Exception as e:
            text_content = f"Error converting attachment: {str(e)}"
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
        
        # Escape curly braces in the text to prevent formatting issues.
        safe_text_content = text_content.replace("{", "{{").replace("}", "}}")
        
        # Build the prompt text with instructions for a single, concise paragraph summary.
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
        try:
            messages_formatted = prompt.format_messages()
            response = self.llm.invoke(messages_formatted)
            summary = response.content.strip()
        except Exception as e:
            summary = f"Failed to summarize attachment: {str(e)}"
        return summary

    def summarize_email(self, email) -> str:
        """
        Returns a summary string for an email including its subject, sender, date,
        a snippet from the body, and for each attachment a summarized version.
        :param email: An email object.
        :return: A string summary of the email.
        """
        summary = (
            f"Email Summary:\n"
            f"Subject: {email.subject}\n"
            f"Sender: {email.sender}\n"
            f"Date: {email.date}\n"
        )
        body = email.plain if (hasattr(email, 'plain') and email.plain) else email.snippet
        snippet = body if len(body) <= 200 else body[:200] + "..."
        summary += f"Snippet: {snippet}\n"
        
        if hasattr(email, 'attachments') and email.attachments:
            summary += "Attachments Summaries:\n"
            for att in email.attachments:
                att_summary = self.summarize_attachment(att)
                summary += f"  Attachment: {att.filename}\n  Summary: {att_summary}\n"
        return summary

    def summarize_emails(self) -> str:
        """
        Fetches emails with attachments in the past time frame and builds a combined summary.
        :return: A combined summary string of all relevant emails.
        """
        emails = self.fetch_emails_with_attachments()
        if not emails:
            return f"No emails with attachments found in the past {self.time_frame_hours} hours."
        
        summaries = [self.summarize_email(email) for email in emails]
        return "\n\n---------------------\n\n".join(summaries)


def main():
    # Example usage when running this module directly.
    print("=== Email Attachment Summarizer ===")
    summarizer = GmailAttachmentSummarizer(time_frame_hours=48)
    print("Fetching emails with attachments from the past 48 hours...\n")
    final_summary = summarizer.summarize_emails()
    print("Final Summary:\n")
    print(final_summary)


if __name__ == "__main__":
    main()