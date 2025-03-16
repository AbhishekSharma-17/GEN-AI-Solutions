# Chat with SQL

## Introduction
Chat with SQL is a powerful application that allows users to interact with SQL databases through an AI assistant. The application enables users to upload their SQL queries, manage data, and ask questions about the material in a conversational manner.

## Technologies Used
- Python
- Flask
- SQLAlchemy
- OpenAI
- dotenv

## Features
- Upload SQL queries for analysis.
- Execute queries against a connected database.
- Chat with an AI assistant based on the executed queries.
- Reset cumulative tokens and costs for usage tracking.
- Manage user-specific data securely.

## Setup and Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd chat_with_sql
   ```
2. Install dependencies:
   ```bash
   pip install -r Backend/requirements.txt
   ```
3. Set up environment variables:
   - Create a `.env` file and add your database connection details and API keys.

## How to Execute
1. Start the Flask server:
   ```bash
   python Backend/backend.py
   ```
2. Access the application through your browser or API client.

## API Endpoints
- **POST** `/execute`: Execute a SQL query.
- **POST** `/upload`: Upload a SQL file.
- **POST** `/chat`: Chat with the AI about the executed queries.
- **DELETE** `/delete_data/{user_id}`: Delete user-specific data.

## Frontend Components
- `HomePage`: The initial page where users can enter their SQL queries.
- `Main`: The main interface where users interact with the AI about their queries.
- `Sidebar`: Navigation component for accessing different features of the application.
- `UploadSection`: Component for handling file uploads.

## Security Considerations
- API keys and database credentials are handled securely and not stored on the client-side.
- User-specific data management ensures data isolation between different users.
- CORS middleware is implemented to control access to the API.

## Future Improvements
1. Implement user authentication for enhanced security.
2. Integrate with cloud databases for easier data management.
3. Implement a caching mechanism to improve response times for repeated queries.
4. Add multi-language support for both user queries and SQL commands.
