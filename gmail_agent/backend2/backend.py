import os
import time
import re
import json
import html  # For escaping HTML special characters
import uuid
from datetime import datetime, timedelta
from dateutil.parser import parse as parse_date
from dateutil.tz import tzlocal, gettz
import streamlit as st
import pandas as pd
import streamlit.components.v1 as components

from simplegmail import Gmail
from langchain_groq import ChatGroq
from langchain.prompts.chat import ChatPromptTemplate

# Import our utility functions and GmailChat class (from your other modules)
from utils import generate_and_save_draft
from tools import GmailChat
from dotenv import load_dotenv
# **Import the attachments summarizer module**
from attachment import GmailAttachmentSummarizer
load_dotenv()
# Load any existing environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# (Any other secrets can be loaded similarly)

# --------------------------------------------------
# Create a session-specific ID (if not already set)
# --------------------------------------------------
if "session_id" not in st.session_state:
    st.session_state.session_id = uuid.uuid4().hex
# Session-specific filename for client secret
client_file = f"client_secret_{st.session_state.session_id}.json"

# --------------------------------------------------
# Credentials Upload & Validation (Gmail client secret only)
# --------------------------------------------------
if "client_secret" not in st.session_state:
    with st.form(key="credentials_form"):
        st.markdown(
            """
            <style>
            .upload-container {
                background-color: #121212;
                color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 20px auto;
                width: 60%;
            }
            .upload-container h3 {
                color: #FFD700;
                font-size: 2.0em;
                margin-bottom: 10px;
            }
            .upload-container p {
                font-size: 1em;
                margin-bottom: 20px;
            }
            .stFileUploader { 
                background-color: #333333;
                border: 1px solid #ffffff;
                color: #ffffff;
                border-radius: 5px;
                padding: 8px;
                margin-bottom: 15px;
            }
            </style>
            <div class="upload-container">
                <h3>Welcome to InboxHero ✉️</h3>
                <p>Please upload your Gmail client secret JSON file below.</p>
                <p>If you don't have one, refer to this <a href="https://stackoverflow.com/questions/52200589/where-to-download-your-client-secret-file-json-file#:~:text=Go%20to%20your%20Google%20API%20Console%20where%20you%27ll,arrow%20on%20the%20farthest%20right%20of%20the%20page%3A" target="_blank" style="color:#FFD700;">guide</a>.</p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        uploaded_file = st.file_uploader("Upload Gmail Client Secret JSON", type=["json"])
        submitted = st.form_submit_button("Submit Credentials")
        
        if submitted:
            if not uploaded_file:
                st.error("Please upload your Gmail client secret JSON file.")
            else:
                try:
                    client_secret_data = json.load(uploaded_file)
                    # Validate structure: check for "installed" or "web" keys
                    if "installed" in client_secret_data or "web" in client_secret_data:
                        st.session_state.client_secret = client_secret_data
                        # Write the uploaded client secret to a session-specific file
                        with open(client_file, "w") as f:
                            json.dump(client_secret_data, f)
                        st.success("Client secret file uploaded and validated successfully.")
                        st.rerun()
                    else:
                        st.error("Invalid client secret file format. Please upload a valid Gmail client secret JSON file.")
                except Exception as e:
                    st.error(f"Error processing credentials: {e}")
    st.stop()  # Halt further execution until valid credentials are provided

# -------------------------------
# Session State Initialization
# -------------------------------
if "result" not in st.session_state:
    st.session_state.result = None
if "reply_email_objects" not in st.session_state:
    st.session_state.reply_email_objects = None
if "generated_drafts" not in st.session_state:
    st.session_state.generated_drafts = {}
if "email_summaries" not in st.session_state:
    st.session_state.email_summaries = {}
if "mode" not in st.session_state:
    st.session_state.mode = "home"  # "home" or "chat"
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []  # List of dicts: {"role": "user"/"assistant", "text": ...}

# ------------------------------------
# Helper: Format date to CET with AM/PM (no seconds)
# ------------------------------------
def format_date(date_str):
    try:
        dt = parse_date(date_str)
        cet_tz = gettz("Europe/Berlin")
        dt_cet = dt.astimezone(cet_tz)
        return dt_cet.strftime("%Y-%m-%d %I:%M%p")
    except Exception as e:
        st.error(f"Error formatting date: {e}")
        return date_str

# ------------------------------------
# Helper: Summarize Email Content + Attachments
# ------------------------------------
def summarize_email(email):
    """
    Summarizes the email body using ChatGroq. If the email has attachments,
    it calls the GmailAttachmentSummarizer to generate attachment summaries.
    The final summary is a combination of the text summary and the attachment summary.
    """
    email_body = getattr(email, 'plain', None) or getattr(email, 'snippet', "")
    if email_body:
        if len(email_body) > 2000:
            email_body = email_body[:2000] + "..."
        llm = ChatGroq(
            model="mixtral-8x7b-32768",
            temperature=0.7,
            max_tokens=75,
            timeout=30,
            max_retries=2,
        )
        summary_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                (
                    "You are Zamal Babar’s professional email assistant. Summarize the following email content concisely in 2-3 lines in English only. "
                    "Do not use any German language. Return only the summary."
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
            response_obj = llm.invoke(messages_formatted)
            text_summary = response_obj.content.strip()
        except Exception as e:
            text_summary = f"Error summarizing text: {e}"
    else:
        text_summary = ""

    if hasattr(email, 'attachments') and email.attachments:
        att_summarizer = GmailAttachmentSummarizer(time_frame_hours=4)
        att_summaries = []
        for att in email.attachments:
            try:
                att_summary = att_summarizer.summarize_attachment(att)
                att_summaries.append(att_summary)
            except Exception as e:
                att_summaries.append(f"Error summarizing attachment: {e}")
        attachments_summary = " ".join(att_summaries)
        combined_summary = f"{text_summary} \n\n Attachments Summary: {attachments_summary}"
        full_summary = f"This email contains attachments. {combined_summary}"
    else:
        full_summary = text_summary

    return full_summary

# ------------------------------------
# Email Prioritizer Function
# ------------------------------------
def email_prioritizer(time_frame_hours: int = 24):
    try:
        gmail = Gmail(client_secret_file=client_file)
    except Exception as e:
        st.error(f"Error initializing Gmail: {e}")
        return json.dumps({"top_important_emails": [], "reply_needed_emails": []}, indent=4), []
    
    time_threshold = datetime.now(tz=tzlocal()) - timedelta(hours=time_frame_hours)
    date_query = time_threshold.strftime("%Y/%m/%d")
    query = f"in:inbox -category:promotions after:{date_query}"
    
    try:
        messages = gmail.get_messages(query=query)
    except Exception as e:
        st.error(f"Error fetching messages: {e}")
        return json.dumps({"top_important_emails": [], "reply_needed_emails": []}, indent=4), []
    
    if not messages:
        result = {"top_important_emails": [], "reply_needed_emails": []}
        return json.dumps(result, indent=4), []
    
    recent_messages = []
    for msg in messages:
        try:
            msg_dt = parse_date(msg.date)
        except Exception as e:
            st.error(f"Could not parse date for message with subject '{msg.subject}': {e}")
            continue
        if msg_dt >= time_threshold:
            recent_messages.append(msg)
    st.write(f"**Found {len(recent_messages)} messages** from the past {time_frame_hours} hours.")
    
    if not recent_messages:
        result = {"top_important_emails": [], "reply_needed_emails": []}
        return json.dumps(result, indent=4), []
    
    filtered_messages = []
    marketing_keywords = ["marketing", "discount", "sale", "offer", "deal"]
    for msg in recent_messages:
        lower_subject = msg.subject.lower() if hasattr(msg, 'subject') else ""
        lower_sender = msg.sender.lower() if hasattr(msg, 'sender') else ""
        if any(keyword in lower_subject for keyword in marketing_keywords) or any(keyword in lower_sender for keyword in marketing_keywords):
            continue
        filtered_messages.append(msg)
    
    if not filtered_messages:
        result = {"top_important_emails": [], "reply_needed_emails": []}
        return json.dumps(result, indent=4), []
    
    llm = ChatGroq(
        model="mixtral-8x7b-32768",
        temperature=0,
        max_tokens=50,
        timeout=60,
        max_retries=2,
    )
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
    
    top_emails_list = []
    reply_emails_list = []
    max_body_length = 500
    for email in filtered_messages:
        if hasattr(email, 'plain') and email.plain:
            email_body = email.plain
        else:
            email_body = email.snippet if hasattr(email, 'snippet') else ""
        if len(email_body) > max_body_length:
            email_body = email_body[:max_body_length] + "..."
    
        if "noreply" in email.sender.lower() or "no-reply" in email.sender.lower():
            reply_needed = False
        else:
            reply_inputs = {"subject": email.subject, "sender": email.sender, "date": email.date, "body": email_body}
            try:
                messages_reply = reply_prompt.format_messages(**reply_inputs)
                reply_response_obj = llm.invoke(messages_reply)
                reply_response_text = reply_response_obj.content.strip().lower()
                reply_needed = (reply_response_text == "yes")
            except Exception as e:
                st.error(f"Error checking reply need for email '{email.subject}': {e}")
                reply_needed = False
    
        if reply_needed:
            reply_emails_list.append(email)
        else:
            rank_inputs = {"subject": email.subject, "date": email.date, "body": email_body}
            try:
                messages_formatted = ranking_prompt.format_messages(**rank_inputs)
                response_obj = llm.invoke(messages_formatted)
                response_text = response_obj.content.strip()
                score_match = re.search(r'\d+(\.\d+)?', response_text)
                score = float(score_match.group()) if score_match else 0.0
            except Exception as e:
                st.error(f"Error processing email with subject '{email.subject}' for ranking: {e}")
                score = 0.0
            top_emails_list.append((email, score))
    
        time.sleep(1)
    
    sorted_emails = sorted(top_emails_list, key=lambda x: x[1], reverse=True)
    top_emails = sorted_emails[:5]
    
    top_emails_output = []
    for email, score in top_emails:
        email_summary = summarize_email(email)
        clean_summary = html.escape(email_summary.replace("\n", " ").strip())
        email_info = {
            "Sender": email.sender,
            "Summary": clean_summary,
            "Date": format_date(email.date),
            "Importance Score": score
        }
        top_emails_output.append(email_info)
    
    reply_needed_output = []
    for idx, email in enumerate(reply_emails_list, start=1):
        summary_key = f"summary_{idx}"
        if summary_key not in st.session_state.email_summaries:
            st.session_state.email_summaries[summary_key] = summarize_email(email)
        email_info = {
            "Sender": email.sender,
            "Summary": st.session_state.email_summaries[summary_key],
            "Date": format_date(email.date),
        }
        reply_needed_output.append(email_info)
    
    result = {"top_important_emails": top_emails_output, "reply_needed_emails": reply_needed_output}
    return json.dumps(result, indent=4), reply_emails_list

# ------------------------------------
# Helper: Render HTML table with custom styling for Top Emails
# ------------------------------------
def render_table(df: pd.DataFrame) -> str:
    html_table = df.to_html(index=False, classes="custom-table", border=0)
    style = """
    <style>
    .custom-table {
        width: 100%;
        border-collapse: collapse;
        font-family: sans-serif;
    }
    .custom-table th, .custom-table td {
        border: 1px solid #ffffff;
        padding: 8px;
        text-align: left;
    }
    .custom-table th {
        background-color: #1e1e1e;
        color: #ffffff;
    }
    .custom-table td {
        color: #ffffff;
    }
    </style>
    """
    return style + html_table

# ------------------------------------
# Main App Interface: InboxHero
# ------------------------------------
st.set_page_config(
    page_title="InboxHero",
    page_icon="✉️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    /* Main content area: dark background, white text */
    .main .block-container {
        background-color: #121212;
        color: #ffffff;
    }
    /* Sidebar: white background, black text */
    [data-testid="stSidebar"] {
        background-color: #ffffff;
        color: #000000;
    }
    [data-testid="stSidebar"] * {
        color: #000000 !important;
    }
    /* Button styling: white background, black text */
    div.stButton button {
        background-color: #ffffff;
        color: #000000;
    }
    /* Chat input styling */
    input[type="text"] {
        color: #ffffff !important;
        background-color: #333333 !important;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# Sidebar Mode Toggle: Chat Inbox vs Home.
if "mode" not in st.session_state:
    st.session_state.mode = "home"
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

if st.session_state.mode == "home":
    st.sidebar.caption("Click below to chat with your inbox")
    if st.sidebar.button("Chat Inbox"):
        st.session_state.mode = "chat"
else:
    if st.sidebar.button("Back to Home"):
        st.session_state.mode = "home"

# Main UI: Chat Mode or Home Mode.
if st.session_state.mode == "chat":
    st.markdown("<h2 style='color: #ffffff;'>Chat Inbox</h2>", unsafe_allow_html=True)
    chat_query = st.text_input("Enter your query:", key="chat_query", help="Type your query here.", placeholder="Enter your query here...", label_visibility="visible")
    if st.button("Send Query"):
        chat_instance = GmailChat(time_frame_hours=24)
        answer = chat_instance.chat(chat_query)
        st.session_state.chat_history.append({"role": "user", "text": chat_query})
        st.session_state.chat_history.append({"role": "assistant", "text": answer})
    st.markdown("<h3 style='color: #ffffff;'>Chat History</h3>", unsafe_allow_html=True)
    chat_container = st.container()
    for msg in st.session_state.chat_history:
        if msg["role"] == "user":
            st.markdown(f"<p style='color: #ffffff;'><strong>You:</strong> {msg['text']}</p>", unsafe_allow_html=True)
        else:
            st.markdown(f"<p style='color: #ffffff;'><strong>InboxHero:</strong> {msg['text']}</p>", unsafe_allow_html=True)
else:
    st.markdown("<h1 style='color: #FFD700;'>InboxHero ✉️</h1>", unsafe_allow_html=True)
    st.markdown("<h3 style='color: #FFD700;'>Instant Email Prioritizer</h3>", unsafe_allow_html=True)
    st.markdown(
        """
        <p style='color: #ffffff;'>
        <strong>InboxHero</strong> helps you quickly identify the most important emails in your inbox along with those that require a reply.
        Use the sidebar to choose a time window (e.g., 1 Hour, 6 Hours, 12 Hours, 24 Hours, 3 Days, 1 Week, or 2 Weeks) to filter your emails.
        Then, click <strong>Fetch Emails</strong> to see a clean, organized list of your top important emails and interactive rows for emails needing a reply.
        </p>
        """,
        unsafe_allow_html=True
    )
    
    time_option = st.sidebar.selectbox(
        "Select Timeframe:",
        options=["1 Hour", "6 Hours", "12 Hours", "24 Hours", "3 Days", "1 Week", "2 Weeks"],
        index=3,
        help="Choose how old emails should be considered."
    )
    time_mapping = {
        "1 Hour": 1,
        "6 Hours": 6,
        "12 Hours": 12,
        "24 Hours": 24,
        "3 Days": 72,
        "1 Week": 168,
        "2 Weeks": 336
    }
    time_frame_hours = time_mapping[time_option]
    
    st.sidebar.markdown("---")
    st.sidebar.markdown(
        """
        **Instructions:**
        - Select the desired timeframe from the dropdown.
        - Click **Fetch Emails** to prioritize your inbox.
        - The top important emails will be shown in a styled table.
        - Emails requiring a reply are listed with interactive rows and a "Generate Draft" button.
        """
    )
    
    if st.button("Fetch Emails"):
        with st.spinner("Fetching and prioritizing emails... Please wait..."):
            result_json, reply_email_objects = email_prioritizer(time_frame_hours=time_frame_hours)
            st.session_state.result = json.loads(result_json)
            st.session_state.reply_email_objects = reply_email_objects
    
    if st.session_state.result:
        result = st.session_state.result
        st.markdown("<h2 style='color: #ffffff;'>Top Important Emails</h2>", unsafe_allow_html=True)
        if result["top_important_emails"]:
            df_top = pd.DataFrame(result["top_important_emails"])
            components.html(render_table(df_top), height=300, scrolling=True)
        else:
            st.markdown("<h4 style='color: #ffffff;'>No top important emails found.</h4>", unsafe_allow_html=True)
        
        st.markdown("<h2 style='color: #ffffff;'>Emails Requiring a Reply</h2>", unsafe_allow_html=True)
        if st.session_state.reply_email_objects:
            for idx, email in enumerate(st.session_state.reply_email_objects, start=1):
                with st.container():
                    st.markdown(
                        """
                        <div style="border: 1px solid white; padding: 8px; margin-bottom: 8px;">
                        """,
                        unsafe_allow_html=True,
                    )
                    cols = st.columns([3, 5, 3, 2])
                    cols[0].markdown(f"<span style='color:#ffffff;'><strong>Sender:</strong> {email.sender}</span>", unsafe_allow_html=True)
                    summary_key = f"summary_{idx}"
                    if summary_key not in st.session_state.email_summaries:
                        st.session_state.email_summaries[summary_key] = summarize_email(email)
                    cols[1].markdown(f"<span style='color:#ffffff;'><strong>Summary:</strong> {html.escape(st.session_state.email_summaries[summary_key])}</span>", unsafe_allow_html=True)
                    cols[2].markdown(f"<span style='color:#ffffff;'><strong>Date:</strong> {format_date(email.date)}</span>", unsafe_allow_html=True)
                    draft_key = f"draft_{idx}"
                    draft_placeholder = cols[3].empty()
                    if draft_key in st.session_state.generated_drafts:
                        draft_placeholder.markdown("<span style='color:#00ff00;'><strong>Draft Generated</strong></span>", unsafe_allow_html=True)
                    else:
                        if draft_placeholder.button("Generate Draft", key=draft_key):
                            with st.spinner("Generating draft..."):
                                draft_text = generate_and_save_draft(email)
                                st.session_state.generated_drafts[draft_key] = draft_text
                            draft_placeholder.markdown("<span style='color:#00ff00;'><strong>Draft Generated</strong></span>", unsafe_allow_html=True)
                    st.markdown("</div>", unsafe_allow_html=True)
        else:
            st.markdown("<h4 style='color: #ffffff;'>No emails requiring a reply found.</h4>", unsafe_allow_html=True)
    
        if st.session_state.generated_drafts:
            for key, draft in st.session_state.generated_drafts.items():
                if draft and draft != "loading":
                    st.success(f"Draft created successfully for {key}!")
                elif draft == "loading":
                    st.info(f"Generating draft for {key}...")