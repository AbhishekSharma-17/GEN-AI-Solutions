# Gmail Agent - FastAPI Backend & React Frontend

This project converts the original Streamlit Gmail Agent into a modern web application with a FastAPI backend and React frontend.

## Project Structure

```
gmail_agent/
├── backend/             # FastAPI backend
│   ├── app.py           # Main FastAPI application
│   ├── config.py        # Configuration settings
│   ├── dependencies.py  # Dependency injection
│   ├── models/          # Pydantic models
│   ├── routers/         # API route definitions
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── requirements.txt # Python dependencies
│
└── frontend/            # React frontend
    ├── public/          # Static assets
    ├── src/             # Source code
    │   ├── components/  # React components
    │   ├── context/     # React contexts
    │   ├── pages/       # Page components
    │   ├── services/    # API services
    │   ├── App.jsx      # Main application component
    │   └── main.jsx     # Entry point
    ├── index.html       # HTML template
    ├── package.json     # Node dependencies
    └── vite.config.js   # Vite configuration
```

## Features

- ✅ **Gmail Authentication** - Secure Gmail API integration
- ✅ **Email Prioritization** - AI-powered email sorting
- ✅ **Draft Generation** - Intelligent email drafting
- ✅ **Chat Interface** - Natural language email queries
- ✅ **Attachment Processing** - Summary generation for email attachments

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd gmail_agent/backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Create a `.env` file with the following content:
   ```
   GROQ_API_KEY=your_groq_api_key
   SECRET_KEY=your_secret_key  # A randomly generated string for security
   ```

4. Run the FastAPI server:
   ```
   python run.py
   ```
   
   The API will be available at `http://localhost:8000`.
   OpenAPI documentation can be accessed at `http://localhost:8000/docs`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd gmail_agent/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`.

## Usage

1. Open the application in your browser
2. Upload your Gmail client secret JSON file
3. Go through the OAuth flow to authorize the application
4. Use the dashboard to view prioritized emails
5. Generate drafts for emails that need replies
6. Use the chat interface to ask questions about your emails

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

## Requirements

- Python 3.9+
- Node.js 16+
- Gmail account
- Google Cloud project with Gmail API enabled
- Client secret credentials JSON file
- GROQ API key for AI services

## Development

This project is structured for easy extension and modification:

- **Backend**: Add new endpoints by creating routers and services
- **Frontend**: Add new components and pages as needed

## License

MIT
