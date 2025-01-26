from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from Crawler import EnhancedWebTool

app = FastAPI(title="Web Crawler API", description="API for crawling websites and extracting content")

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
        crawler = EnhancedWebTool(max_depth=request.max_depth, max_pages=request.max_pages)
        results = crawler.crawl(str(request.url), formats=request.formats)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scrape", summary="Scrape a single webpage", response_description="Scraped webpage content")
async def scrape(request: ScrapeRequest):
    """
    Scrape a single webpage.

    - **url**: The URL of the webpage to scrape
    - **formats**: List of formats to return (options: "markdown", "html", "structured_data")
    """
    try:
        crawler = EnhancedWebTool(max_depth=1, max_pages=1)
        result = crawler.scrape_page(str(request.url), request.formats)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
