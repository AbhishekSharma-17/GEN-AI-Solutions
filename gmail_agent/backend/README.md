# Gmail Agent API Backend

This is a FastAPI backend for the Gmail Agent, providing a powerful API for Gmail interaction, email prioritization, draft generation, and chat functionality.

## Features

- **Gmail Authentication** - Secure Gmail API integration
- **Email Prioritization** - Intelligent email sorting and prioritization
- **Draft Generation** - AI-powered email draft creation
- **Chat Interface** - Natural language querying of your inbox
- **Attachment Handling** - Attachment summarization and processing

## Setup and Installation

### Prerequisites

- Python 3.9+
- A Google account with Gmail
- Google Cloud Project with the Gmail API enabled
- Client secret credentials JSON file from Google Cloud Console

### Installation

1. Clone the repository and navigate to the backend directory:

```bash
cd gmail_agent/backend
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables (create a `.env` file):

```
GROQ_API_KEY=your_groq_api_key
SECRET_KEY=generate_a_secret_key
```

### Running the API

Start the FastAPI server:

```bash
uvicorn gmail_agent.backend.app:app --reload
```

The API will be available at `http://localhost:8000`.

OpenAPI documentation will be available at `http://localhost:8000/docs`.

## API Endpoints

### Authentication

- `POST /auth/upload-credentials` - Upload Gmail client secret
- `GET /auth/status` - Check authentication status
- `GET /auth/session` - Get session information
- `POST /auth/logout` - Logout and clear session

### Emails

- `GET /emails/priority` - Get prioritized emails
- `GET /emails/reply-needed` - Get emails needing replies
- `GET /emails/list` - List emails with filters
- `GET /emails/{email_id}` - Get email detail

### Drafts

- `POST /drafts/generate/{email_id}` - Generate draft for email
- `GET /drafts/list` - List generated drafts
- `GET /drafts/{draft_id}` - Get draft detail

### Chat

- `POST /chat/query` - Send a query about emails
- `POST /chat/clear-history` - Clear chat history

### Attachments

- `GET /attachments/{email_id}` - List attachments for email
- `GET /attachments/{email_id}/{attachment_id}/summary` - Get attachment summary
- `GET /attachments/{email_id}/{attachment_id}/download` - Download attachment

## Security Information

- Authentication using secure sessions
- Credentials stored securely with proper permissions
- No API keys exposed to frontend

## Tech Stack

- FastAPI - Modern API framework
- Pydantic - Data validation
- LangChain + Groq - AI integration
- SimpleGmail - Gmail API wrapper

## Next Steps

This backend is designed to be paired with a React frontend (coming next).
