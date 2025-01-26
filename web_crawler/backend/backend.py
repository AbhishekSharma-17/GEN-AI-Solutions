from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from fastapi.responses import StreamingResponse
import json
import asyncio
from Crawler import EnhancedWebTool
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Web Crawler API", description="API for crawling websites and extracting content")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust this to match your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CrawlRequest(BaseModel):
    url: HttpUrl
    max_depth: Optional[int] = 3
    max_pages: Optional[int] = 100
    formats: Optional[List[str]] = ["markdown", "html", "structured_data"]

class ScrapeRequest(BaseModel):
    url: HttpUrl
    formats: Optional[List[str]] = ["markdown", "html", "structured_data"]

@app.post("/crawl", summary="Crawl a website", response_description="Crawled website content")
async def crawl(request: CrawlRequest):
    """
    Crawl a website starting from the given URL.

    - **url**: The starting URL for the crawl
    - **max_depth**: Maximum depth of pages to crawl (default: 3)
    - **max_pages**: Maximum number of pages to crawl (default: 100)
    - **formats**: List of formats to return (options: "markdown", "html", "structured_data")
    """
    try:
        logger.info(f"Starting crawl for URL: {request.url}")
        crawler = EnhancedWebTool(max_depth=request.max_depth, max_pages=request.max_pages)
        
        async def event_stream():
            try:
                results = await asyncio.to_thread(crawler.crawl, str(request.url), request.formats)
                logger.info(f"Crawl completed. Total pages crawled: {len(results)}")
                total_pages = len(results)
                for i, result in enumerate(results, 1):
                    progress = (i / total_pages) * 100
                    yield f"data: {json.dumps({'progress': progress})}\n\n"
                    logger.info(f"Progress: {progress:.2f}%")
                    try:
                        yield f"data: {json.dumps({'result': result})}\n\n"
                    except Exception as e:
                        logger.error(f"Error encoding result: {str(e)}")
                        yield f"data: {json.dumps({'error': 'Error encoding result'})}\n\n"
                    logger.info(f"Sent result for page {i}")
            except Exception as e:
                logger.error(f"Error during crawl: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(event_stream(), media_type="text/event-stream")
    except Exception as e:
        logger.error(f"Error setting up crawl: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scrape", summary="Scrape a single webpage", response_description="Scraped webpage content")
async def scrape(request: ScrapeRequest):
    """
    Scrape a single webpage.

    - **url**: The URL of the webpage to scrape
    - **formats**: List of formats to return (options: "markdown", "html", "structured_data")
    """
    try:
        logger.info(f"Starting scrape for URL: {request.url}")
        crawler = EnhancedWebTool(max_depth=1, max_pages=1)
        
        async def event_stream():
            try:
                result = await asyncio.to_thread(crawler.scrape_page, str(request.url), request.formats)
                yield f"data: {json.dumps({'progress': 50})}\n\n"
                logger.info("Progress: 50%")
                try:
                    yield f"data: {json.dumps({'result': result})}\n\n"
                except Exception as e:
                    logger.error(f"Error encoding result: {str(e)}")
                    yield f"data: {json.dumps({'error': 'Error encoding result'})}\n\n"
                logger.info("Result sent")
                yield f"data: {json.dumps({'progress': 100})}\n\n"
                logger.info("Progress: 100%")
            except Exception as e:
                logger.error(f"Error during scrape: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(event_stream(), media_type="text/event-stream")
    except Exception as e:
        logger.error(f"Error setting up scrape: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend:app", host="localhost", port=8000, reload=True)

