# Final Voice Assistant

## Introduction
The Final Voice Assistant is an advanced application that allows users to interact with various document formats and perform text-to-speech operations through an AI assistant. The application enables users to upload audio, convert text to speech, and engage in conversational interactions.

## Technologies Used
- FastAPI
- OpenAI
- LangChain
- dotenv
- Uvicorn

## Features
- Convert text to speech using various voices.
- Real-time audio transcription through WebSocket connections.
- Engage in conversations with an AI assistant based on transcribed audio.
- Stream audio responses for a seamless user experience.

## Setup and Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Final Voice Assistant
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   - Create a `.env` file and add your API keys for OpenAI and any other necessary configurations.

## How to Execute
1. Start the FastAPI server:
   ```bash
   uvicorn backend:app --host localhost --port 8000 --reload
   ```
2. Access the application through your browser or API client.

## API Endpoints
- **GET** `/tts`: Convert text to speech.
- **WebSocket** `/ws`: Real-time audio processing and transcription.

## Frontend Components
- `HomePage`: The initial page where users can enter their text for TTS.
- `VoiceChat`: The main interface for interacting with the AI assistant.

## Security Considerations
- API keys are handled securely and not stored on the client-side.
- User-specific data management ensures data isolation between different users.

## Future Improvements
1. Implement user authentication for enhanced security.
2. Integrate with additional AI models for improved responses.
3. Add multi-language support for both user queries and TTS.
