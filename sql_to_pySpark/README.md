# SQL to PySpark

## Introduction
The SQL to PySpark application allows users to convert SQL queries into PySpark code seamlessly. This application provides a user-friendly interface for uploading SQL files and receiving the corresponding PySpark code as output.

## Technologies Used
- FastAPI
- PySpark
- LangChain
- Uvicorn
- dotenv

## Features
- Upload SQL files for conversion to PySpark code.
- View conversion results in real-time.
- Manage user-specific conversion data securely.

## Setup and Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sql_to_pySpark
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   - Create a `.env` file and add any necessary configurations.

## How to Execute
1. Start the FastAPI server:
   ```bash
   uvicorn backend:app --host localhost --port 8000 --reload
   ```
2. Access the application through your browser or API client.

## API Endpoints
- **POST** `/convert`: Convert SQL to PySpark code.
- **GET** `/results`: Retrieve conversion results.

## Frontend Components
- `HomePage`: The initial page where users can upload SQL files.
- `ConversionResult`: The interface for displaying the converted PySpark code.
- `FileUpload`: Component for handling file uploads.

## Security Considerations
- User-specific data management ensures data isolation between different users.
- Input validation is performed to ensure only relevant SQL files are processed.

## Future Improvements
1. Implement user authentication for enhanced security.
2. Integrate with additional data processing tools for broader functionality.
3. Add multi-language support for user interactions and content.
