# Chat with PowerPoint AI Assistant

## Table of Contents
1. [Introduction](#introduction)
2. [Technologies Used](#technologies-used)
3. [Features](#features)
4. [Setup and Installation](#setup-and-installation)
5. [Usage](#usage)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Security Considerations](#security-considerations)
9. [Future Improvements](#future-improvements)

## Introduction

Chat with PowerPoint AI Assistant is an innovative application that allows users to interact with their PowerPoint presentations using natural language queries. The system uses advanced language models and embedding techniques to understand the content of PowerPoint files and provide intelligent responses to user questions.

## Technologies Used

### Backend
- **FastAPI**: A modern, fast (high-performance) web framework for building APIs with Python.
- **Langchain**: A framework for developing applications powered by language models.
- **OpenAI GPT**: Advanced language model for natural language processing and generation.
- **Google Gemini**: Alternative language model for natural language tasks.
- **FAISS**: An efficient similarity search and clustering library for dense vectors.
- **Unstructured**: A library for extracting and structuring information from various file formats.

### Frontend
- **React**: A JavaScript library for building user interfaces.
- **Bootstrap**: A popular CSS framework for responsive and mobile-first design.
- **React-Toastify**: A library for adding toast notifications to React applications.

## Features

1. **Multiple AI Provider Support**: Users can choose between OpenAI and Google Gemini as their AI provider.
2. **PowerPoint File Upload**: Users can upload PowerPoint files (.ppt and .pptx) for analysis.
3. **Content Embedding**: The system extracts and embeds the content of PowerPoint files for efficient retrieval.
4. **Intelligent Querying**: Users can ask questions about the uploaded presentation, and the AI provides context-aware responses.
5. **Streaming Responses**: AI responses are streamed in real-time for a smooth user experience.
6. **Automatic Query Generation**: The system generates relevant questions based on the uploaded content to guide user interaction.
7. **User-specific Vectorstores**: Each user's embedded content is stored separately for privacy and personalization.

## Setup and Installation

1. Clone the repository:
   ```
   git clone [repository-url]
   cd chat_with_ppt
   ```

2. Set up the backend:
   ```
   cd Backend
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```
   cd ../Frontend
   npm install
   ```

4. Create a `.env` file in the Backend directory with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_API_KEY=your_google_api_key
   UNSTRUCTURED_API_KEY=your_unstructured_api_key
   ```

5. Start the backend server:
   ```
   cd ../Backend
   uvicorn fastapi_ppt_chat:app --host localhost --port 8000 --reload
   ```

6. Start the frontend development server:
   ```
   cd ../Frontend
   npm run dev
   ```

## Usage

1. Open the application in your web browser (typically at `http://localhost:5173`).
2. Choose your preferred AI provider (OpenAI or Google Gemini) and enter the API key.
3. Upload a PowerPoint file using the file upload interface.
4. Once the file is processed, you can start asking questions about the presentation content.
5. The AI will provide context-aware responses based on the presentation content.

## API Endpoints

- `POST /initialize`: Initialize the AI model with the chosen provider and API key.
- `POST /upload`: Upload a PowerPoint file.
- `POST /embed`: Process and embed the content of the uploaded file.
- `POST /chat`: Send a question and receive an AI-generated response.
- `DELETE /delete_vectorstore/{user_id}`: Delete the vectorstore for a specific user.

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
- File type validation is performed to ensure only PowerPoint files are processed.

## Future Improvements

1. Implement user authentication for enhanced security.
2. Add support for more file formats (e.g., PDF, Word documents).
3. Integrate with cloud storage services for easier file management.
4. Implement a caching mechanism to improve response times for repeated queries.
5. Add multi-language support for both user queries and presentation content.
