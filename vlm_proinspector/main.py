import os
import base64
import json
import re
from io import BytesIO
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="ProInspector API",
    description="API for analyzing warehouse rack images using VLM",
    version="1.0.0",
)

# Initialize the LLM model
def get_model():
    return ChatOpenAI(
        model="google/gemma-3-27b-it", 
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        streaming=True
    )

# Pydantic models
class ImageAnalysisRequest(BaseModel):
    image_base64: Optional[str] = None

class BatchImageBase64Request(BaseModel):
    images: List[str] = Field(..., description="List of base64-encoded images")
    batch_name: Optional[str] = Field(None, description="Optional name for the batch")

class AnalysisResponse(BaseModel):
    category: str
    observations: str
    recommendations: str
    
class BatchAnalysisResult(BaseModel):
    image_index: int
    image_name: Optional[str] = None
    category: str
    observations: str
    recommendations: str
    
class BatchReport(BaseModel):
    batch_id: str
    batch_name: Optional[str] = None
    timestamp: str
    total_images: int
    green_count: int = 0
    amber_count: int = 0
    red_count: int = 0
    results: List[BatchAnalysisResult] = []
    
    @property
    def green_percentage(self) -> float:
        return (self.green_count / self.total_images) * 100 if self.total_images > 0 else 0
        
    @property
    def amber_percentage(self) -> float:
        return (self.amber_count / self.total_images) * 100 if self.total_images > 0 else 0
        
    @property
    def red_percentage(self) -> float:
        return (self.red_count / self.total_images) * 100 if self.total_images > 0 else 0

# Global storage for batch reports
batch_reports = {}

# Helper functions
def encode_image(image_bytes):
    return base64.b64encode(image_bytes).decode('utf-8')

def create_batch_id() -> str:
    return f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

def extract_category(text: str) -> str:
    """Extract the category (GREEN, AMBER, RED) from the analysis text."""
    # Look for the category mentioned in the text
    if re.search(r'\b(GREEN)\b', text, re.IGNORECASE):
        return "GREEN"
    elif re.search(r'\b(AMBER)\b', text, re.IGNORECASE):
        return "RED" if re.search(r'\b(RED)\b', text, re.IGNORECASE) else "AMBER"
    elif re.search(r'\b(RED)\b', text, re.IGNORECASE):
        return "RED"
    return "UNKNOWN"  # Default if no category found

def create_image_prompt(image_data):
    return ChatPromptTemplate.from_messages(
        [
            ("system", "You are ProInspector AI, a specialized warehouse auditing assistant focused on rack inspection. Your task is to analyze images of warehouse racks and categorize them according to the following criteria:\n\n1. GREEN: Completely fine condition - The rack shows no visible damage, is structurally sound, has all components intact, and is safe for continued use.\n\n2. AMBER: Mildly damaged condition - The rack shows minor issues such as slight bends, surface rusting, missing nuts/bolts, minor dents, or similar non-critical damage that should be addressed during regular maintenance but doesn't require immediate action.\n\n3. RED: Severely damaged condition - The rack exhibits major structural damage such as significant bends, broken welds, severe corrosion, missing critical components, or any damage that compromises the rack's structural integrity and safety. Requires immediate attention and possible replacement.\n\nFor each image analysis, clearly state the category (GREEN, AMBER, or RED) and provide specific observations that justify your categorization. Include details about the visible damage, potential safety concerns, and any recommendations for maintenance or replacement."),
            (
                "user",
                [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_data}"},
                    }
                ],
            ),
        ]
    )

# Endpoint for health check
@app.get("/")
async def root():
    return {"status": "online", "message": "ProInspector API is running"}

# Endpoint for analyzing image via file upload
@app.post("/analyze/upload")
async def analyze_upload(file: UploadFile = File(...)):
    try:
        # Read the image file
        contents = await file.read()
        
        # Check file size (10MB limit)
        if len(contents) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")
            
        # Check if it's an image file
        content_type = file.content_type
        if not content_type or not content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Encode the image
        image_data = encode_image(contents)
        
        # Create response streaming iterator
        async def generate_analysis():
            model = get_model()
            prompt = create_image_prompt(image_data)
            chain = prompt | model
            
            response = chain.stream({"image_data": image_data})
            
            for chunk in response:
                yield chunk.content
        
        return StreamingResponse(generate_analysis(), media_type="text/plain")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# Endpoint for analyzing image via base64
@app.post("/analyze/base64")
async def analyze_base64(request: ImageAnalysisRequest):
    try:
        if not request.image_base64:
            raise HTTPException(status_code=400, detail="Base64 image data is required")
        
        # Create response streaming iterator
        async def generate_analysis():
            model = get_model()
            prompt = create_image_prompt(request.image_base64)
            chain = prompt | model
            
            response = chain.stream({"image_data": request.image_base64})
            
            for chunk in response:
                yield chunk.content
        
        return StreamingResponse(generate_analysis(), media_type="text/plain")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# Endpoint for analyzing image from a path 
@app.post("/analyze/path")
async def analyze_path(image_path: str):
    try:
        if not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail=f"Image file not found: {image_path}")
        
        # Read and encode the image
        with open(image_path, "rb") as image_file:
            image_data = encode_image(image_file.read())
        
        # Create response streaming iterator
        async def generate_analysis():
            model = get_model()
            prompt = create_image_prompt(image_data)
            chain = prompt | model
            
            response = chain.stream({"image_data": image_data})
            
            for chunk in response:
                yield chunk.content
        
        return StreamingResponse(generate_analysis(), media_type="text/plain")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

async def analyze_single_image(image_data: str) -> str:
    """Analyze a single image and return the raw analysis text."""
    model = get_model()
    prompt = create_image_prompt(image_data)
    chain = prompt | model
    
    # For batch processing, we don't stream but collect the full response
    result = chain.invoke({"image_data": image_data})
    return result

async def process_batch(
    batch_id: str, 
    images: List[str], 
    image_names: List[str] = None,
    batch_name: str = None
):
    """Process a batch of images and store the results."""
    total_images = len(images)
    results = []
    green_count = 0
    amber_count = 0
    red_count = 0
    
    if not image_names:
        image_names = [None] * total_images
    
    for i, (image_data, image_name) in enumerate(zip(images, image_names)):
        try:
            analysis_text = await analyze_single_image(image_data)
            category = extract_category(analysis_text)
            
            # Update counts
            if category == "GREEN":
                green_count += 1
            elif category == "AMBER":
                amber_count += 1
            elif category == "RED":
                red_count += 1
                
            # Create result object
            result = BatchAnalysisResult(
                image_index=i,
                image_name=image_name,
                category=category,
                observations=analysis_text,
                recommendations=""  # Extracted from analysis_text if needed
            )
            
            results.append(result)
            
        except Exception as e:
            results.append(
                BatchAnalysisResult(
                    image_index=i,
                    image_name=image_name,
                    category="ERROR",
                    observations=f"Error analyzing image: {str(e)}",
                    recommendations="Please check the image format and try again."
                )
            )
    
    # Create and store the report
    report = BatchReport(
        batch_id=batch_id,
        batch_name=batch_name,
        timestamp=datetime.now().isoformat(),
        total_images=total_images,
        green_count=green_count,
        amber_count=amber_count,
        red_count=red_count,
        results=results
    )
    
    batch_reports[batch_id] = report
    return report

# Batch processing endpoints
@app.post("/analyze/batch/base64")
async def analyze_batch_base64(
    request: BatchImageBase64Request,
    background_tasks: BackgroundTasks
):
    try:
        if not request.images or len(request.images) == 0:
            raise HTTPException(status_code=400, detail="At least one image is required")
        
        if len(request.images) > 50:  # Limit batch size
            raise HTTPException(status_code=400, detail="Maximum batch size is 50 images")
        
        batch_id = create_batch_id()
        
        # Start the batch processing in the background
        background_tasks.add_task(
            process_batch,
            batch_id=batch_id,
            images=request.images,
            batch_name=request.batch_name
        )
        
        return {
            "batch_id": batch_id,
            "message": f"Batch processing started with {len(request.images)} images",
            "status": "processing"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing batch: {str(e)}")

@app.post("/analyze/batch/upload")
async def analyze_batch_upload(
    files: List[UploadFile] = File(...),
    batch_name: Optional[str] = None,
    background_tasks: BackgroundTasks = None
):
    try:
        if not files or len(files) == 0:
            raise HTTPException(status_code=400, detail="At least one file is required")
        
        if len(files) > 50:  # Limit batch size
            raise HTTPException(status_code=400, detail="Maximum batch size is 50 files")
        
        # Process and validate each file
        images = []
        image_names = []
        
        for file in files:
            # Check file size
            contents = await file.read()
            if len(contents) > 10 * 1024 * 1024:  # 10MB
                raise HTTPException(status_code=400, detail=f"File {file.filename} is too large (max 10MB)")
                
            # Check if it's an image
            content_type = file.content_type
            if not content_type or not content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not an image")
            
            # Encode and add to batch
            images.append(encode_image(contents))
            image_names.append(file.filename)
            
            # Reset file position for any subsequent operations
            await file.seek(0)
        
        batch_id = create_batch_id()
        
        # Start the batch processing in the background
        background_tasks.add_task(
            process_batch,
            batch_id=batch_id,
            images=images,
            image_names=image_names,
            batch_name=batch_name
        )
        
        return {
            "batch_id": batch_id,
            "message": f"Batch processing started with {len(files)} images",
            "status": "processing"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing batch: {str(e)}")

@app.get("/report/{batch_id}")
async def get_report(batch_id: str):
    """Get the report for a specific batch."""
    if batch_id not in batch_reports:
        raise HTTPException(status_code=404, detail=f"Report for batch {batch_id} not found")
    
    report = batch_reports[batch_id]
    
    return {
        "batch_id": report.batch_id,
        "batch_name": report.batch_name,
        "timestamp": report.timestamp,
        "summary": {
            "total_images": report.total_images,
            "green_count": report.green_count,
            "amber_count": report.amber_count,
            "red_count": report.red_count,
            "green_percentage": report.green_percentage,
            "amber_percentage": report.amber_percentage,
            "red_percentage": report.red_percentage
        },
        "results": report.results
    }

@app.get("/reports")
async def list_reports():
    """List all available batch reports."""
    return {
        "reports": [
            {
                "batch_id": batch_id,
                "batch_name": report.batch_name,
                "timestamp": report.timestamp,
                "total_images": report.total_images
            }
            for batch_id, report in batch_reports.items()
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
