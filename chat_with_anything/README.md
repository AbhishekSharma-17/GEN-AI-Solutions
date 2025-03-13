# Chat with Anything

## Introduction
Chat with Anything is a powerful application that allows users to interact with number's of document formats through an AI assistant. The application enables users to upload their documents, embed content, and ask questions about the material in a conversational manner.

## Technologies Used
- FastAPI
- LangChain
- OpenAI
- Google Generative AI
- Uvicorn
- dotenv

## Features
- Upload document for analysis.
- Embed content from uploaded files into a vector store.
- Chat with an AI assistant based on the embedded content.
- Reset cumulative tokens and costs for usage tracking.
- Delete user-specific vector stores.

## Setup and Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd chat_with_anything
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   - Create a `.env` file and add your API keys for OpenAI and Google Generative AI.

## How to execute it ?
1. Start the FastAPI server:
   ```bash
   uvicorn backend:app --host localhost --port 8000 --reload
   ```
2. Access the API endpoints through your browser or API client.

## API Endpoints
- **POST** `/initialize`: Initialize API keys and provider.
- **POST** `/upload`: Upload a PowerPoint file.
- **POST** `/embed`: Embed content from the uploaded file.
- **POST** `/chat`: Chat with the AI about the embedded content.
- **POST** `/global_reset`: Reset cumulative tokens and costs.
- **DELETE** `/delete_vectorstore/{user_id}`: Delete the vector store for a specific user.

## Frontend Components

- `HomePage`: The initial page where users can choose their AI provider and enter API keys.
- `Main`: The main chat interface where users interact with the AI about their presentations.
- `Sidebar`: Navigation component for accessing different features of the application.
- `UploadSection`: Component for handling file uploads.
- `QueryCard`: Displays AI-generated questions and user queries.

## Security Considerations
- API keys are handled securely and not stored on the client-side.
- User-specific vectorstores ensure data isolation between different users.
- CORS middleware is implemented to control access to the API.
- File type validation is performed to ensure only relevant documents are processed.

## Future Improvements
1. Implement user authentication for enhanced security.
3. Integrate with cloud storage services for easier file management.
4. Implement a caching mechanism to improve response times for repeated queries.
5. Add multi-language support for both user queries and presentation content.

