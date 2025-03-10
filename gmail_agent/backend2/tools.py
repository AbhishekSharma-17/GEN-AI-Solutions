import os
import re
import json
import time
from datetime import datetime, timedelta
from dateutil.parser import parse as parse_date
from dateutil.tz import tzlocal
from dotenv import load_dotenv

from simplegmail import Gmail
from langchain_groq import ChatGroq
from langchain.prompts.chat import ChatPromptTemplate

# Load environment variables (including GROQ_API_KEY) from repository secrets.
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class GmailChat:
    def __init__(self, time_frame_hours: int = 24):
        """
        Initialize with a desired timeframe (in hours) for fetching emails.
        """
        self.time_frame_hours = time_frame_hours

    def fetch_emails(self):
        """
        Fetches emails from the inbox within the past time_frame_hours.
        Returns a list of email objects.
        """
        cwd = os.getcwd()
        print(f"[DEBUG] Current working directory: {cwd}")
        print(f"[DEBUG] client_secret.json exists: {os.path.exists('client_secret.json')}")
        if not os.path.exists("client_secret.json"):
            print("[ERROR] client_secret.json file not found in the root directory! Please add it as instructed: https://developers.google.com/gmail/api/quickstart/python")
            return []
        try:
            gmail = Gmail()
        except FileNotFoundError as e:
            print(f"[ERROR] Failed to initialize Gmail: {e}")
            return []
        time_threshold = datetime.now(tz=tzlocal()) - timedelta(hours=self.time_frame_hours)
        date_query = time_threshold.strftime("%Y/%m/%d")
        query = f"in:inbox -category:promotions after:{date_query}"
        emails = gmail.get_messages(query=query)
        filtered = []
        for email in emails:
            try:
                email_date = parse_date(email.date)
            except Exception:
                continue
            if email_date >= time_threshold:
                filtered.append(email)
        return filtered

    @staticmethod
    def summarize_email(email):
        """
        Returns a summary string for an email including subject, sender, date,
        a snippet from the body, and any attachment filenames if present.
        """
        summary = f"Subject: {email.subject}\nSender: {email.sender}\nDate: {email.date}\n"
        if hasattr(email, 'plain') and email.plain:
            body = email.plain
        else:
            body = email.snippet
        if len(body) > 200:
            body = body[:200] + "..."
        summary += f"Snippet: {body}\n"
        if hasattr(email, 'attachments') and email.attachments:
            att_names = [att.filename for att in email.attachments]
            summary += f"Attachments: {', '.join(att_names)}\n"
        return summary

    def build_emails_summary(self, emails):
        """
        Builds and returns a combined summary text for a list of emails.
        """
        summaries = [self.summarize_email(email) for email in emails]
        return "\n---------------------\n".join(summaries)

    def answer_query(self, query, emails_summary):
        """
        Uses ChatGroq to answer the query based on the provided emails summary.
        Returns the answer as a string.
        """
        llm = ChatGroq(
            model="mixtral-8x7b-32768",
            temperature=0,
            max_tokens=150,
            timeout=60,
            max_retries=2,
            api_key=GROQ_API_KEY  # Using the repository secret
        )
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are a helpful assistant that answers queries based on a collection of email summaries. Provide a clear yes/no answer followed by a brief explanation."
            ),
            (
                "human",
                f"User query: {query}\n\nHere are the summaries of my emails from the past {self.time_frame_hours} hours:\n\n{emails_summary}\n\nBased on the above, answer the query."
            )
        ])
        messages_formatted = prompt.format_messages()
        response = llm.invoke(messages_formatted)
        return response.content.strip()

    def chat(self, query):
        """
        Fetches emails from the past timeframe, builds summaries, and then answers the query.
        Returns the final answer.
        """
        emails = self.fetch_emails()
        if not emails:
            return f"No emails found in the past {self.time_frame_hours} hours."
        emails_summary = self.build_emails_summary(emails)
        answer = self.answer_query(query, emails_summary)
        return answer

def main():
    print("=== Email Chat Mode ===")
    query = input("Enter your query: ")
    chat_instance = GmailChat(time_frame_hours=24)
    print("Fetching and processing your emails...")
    answer = chat_instance.chat(query)
    print("\nAnswer:")
    print(answer)

if __name__ == "__main__":
    main()