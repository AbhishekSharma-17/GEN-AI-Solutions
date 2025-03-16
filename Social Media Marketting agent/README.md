# Social Media Marketing Agent

## Introduction
The Social Media Marketing Agent is a powerful application that enables users to manage and optimize their social media marketing efforts through an AI assistant. The application allows users to schedule posts, analyze engagement metrics, and interact with their audience in a conversational manner.

## Technologies Used
- FastAPI
- LangChain
- OpenAI
- Google Generative AI
- Uvicorn
- dotenv

## Features
- Schedule social media posts for various platforms.
- Analyze engagement metrics and performance.
- Chat with an AI assistant for marketing insights and recommendations.
- Manage user-specific marketing data securely.

## Setup and Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd social_media_marketing_agent
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   - Create a `.env` file and add your API keys for OpenAI and Google Generative AI.

## How to Execute
1. Start the FastAPI server:
   ```bash
   uvicorn backend:app --host localhost --port 8000 --reload
   ```
2. Access the API endpoints through your browser or API client.

## API Endpoints
- **POST** `/initialize`: Initialize API keys and provider.
- **POST** `/schedule`: Schedule a social media post.
- **GET** `/analytics`: Retrieve engagement metrics.
- **POST** `/chat`: Chat with the AI about marketing strategies.
- **DELETE** `/delete_data/{user_id}`: Delete user-specific marketing data.

## Frontend Components
- `HomePage`: The initial page where users can manage their social media accounts.
- `Analytics`: The interface for viewing engagement metrics.
- `Scheduler`: Component for scheduling posts.
- `ChatInterface`: The main chat interface for interacting with the AI assistant.

## Security Considerations
- API keys are handled securely and not stored on the client-side.
- User-specific data management ensures data isolation between different users.
- CORS middleware is implemented to control access to the API.
- Input validation is performed to ensure only relevant data is processed.

## Future Improvements
1. Implement user authentication for enhanced security.
2. Integrate with additional social media platforms for broader reach.
3. Implement a caching mechanism to improve response times for repeated queries.
4. Add multi-language support for user interactions and content.
