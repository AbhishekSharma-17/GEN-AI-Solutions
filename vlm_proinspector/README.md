# ProInspector API

This FastAPI application provides endpoints for analyzing warehouse rack images using a Vision Language Model (VLM). It categorizes racks as GREEN, AMBER, or RED based on their condition.

## Features

- Three endpoints for single image analysis:
  - File upload endpoint
  - Base64-encoded image endpoint
  - Local file path endpoint
- Batch processing capabilities for analyzing multiple images at once
- Comprehensive reporting system with category-wise statistics
- Streaming response for real-time analysis
- Health check endpoint

## Installation

1. Clone this repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file with your OpenRouter API key:

```
OPENROUTER_API_KEY=your_api_key_here
```

## Usage

Run the FastAPI application:

```bash
uvicorn main:app --reload
```

### API Endpoints

#### Health Check

```
GET /
```

Returns a status message indicating the API is running.

### Single Image Analysis

#### Analyze Image via File Upload

```
POST /analyze/upload
```

Upload an image file for analysis. Max file size: 10MB.

Example:
```bash
curl -X POST "http://localhost:8000/analyze/upload" \
  -H "accept: text/plain" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@rack_image.jpg"
```

#### Analyze Image via Base64

```
POST /analyze/base64
```

Send a base64-encoded image for analysis.

Example:
```bash
curl -X POST "http://localhost:8000/analyze/base64" \
  -H "accept: text/plain" \
  -H "Content-Type: application/json" \
  -d '{"image_base64":"[base64_encoded_image_data]"}'
```

#### Analyze Image from Path

```
POST /analyze/path
```

Analyze an image from a local file path.

Example:
```bash
curl -X POST "http://localhost:8000/analyze/path?image_path=/path/to/image.jpg" \
  -H "accept: text/plain"
```

### Batch Processing

#### Batch Process Multiple File Uploads

```
POST /analyze/batch/upload
```

Upload multiple image files for batch analysis. Limits: 50 files max, 10MB per file.

Example:
```bash
curl -X POST "http://localhost:8000/analyze/batch/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "files=@rack1.jpg" \
  -F "files=@rack2.jpg" \
  -F "batch_name=warehouse-inspection-20250322"
```

#### Batch Process Base64 Images

```
POST /analyze/batch/base64
```

Send multiple base64-encoded images for batch analysis. Limit: 50 images max.

Example:
```bash
curl -X POST "http://localhost:8000/analyze/batch/base64" \
  -H "Content-Type: application/json" \
  -d '{
    "images": ["base64_string1", "base64_string2"],
    "batch_name": "warehouse-inspection-20250322"
  }'
```

### Reports

#### Get Specific Batch Report

```
GET /report/{batch_id}
```

Retrieve a detailed report for a specific batch by its ID.

Example:
```bash
curl -X GET "http://localhost:8000/report/batch_20250322_091500"
```

#### List All Batch Reports

```
GET /reports
```

List all available batch reports.

Example:
```bash
curl -X GET "http://localhost:8000/reports"
```

## Responses

### Single Image Analysis

The API returns a streaming response with the analysis of the rack condition, including:
- Category (GREEN, AMBER, or RED)
- Detailed observations
- Recommendations for maintenance or repair

### Batch Processing

Batch processing returns a batch ID that can be used to retrieve the report once processing is complete:
```json
{
  "batch_id": "batch_20250322_091500",
  "message": "Batch processing started with 3 images",
  "status": "processing"
}
```

### Report

The report endpoint returns comprehensive statistics about the batch:
```json
{
  "batch_id": "batch_20250322_091500",
  "batch_name": "warehouse-inspection-20250322",
  "timestamp": "2025-03-22T09:15:00.123456",
  "summary": {
    "total_images": 3,
    "green_count": 1,
    "amber_count": 1,
    "red_count": 1,
    "green_percentage": 33.33,
    "amber_percentage": 33.33,
    "red_percentage": 33.33
  },
  "results": [
    {
      "image_index": 0,
      "image_name": "rack1.jpg",
      "category": "GREEN",
      "observations": "...",
      "recommendations": "..."
    },
    ...
  ]
}
```

## Documentation

API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
