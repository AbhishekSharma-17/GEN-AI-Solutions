"""
tools.py

This module contains tool implementations for our LangGraph agent.
It includes:
  - AsyncEnhancedWebTool: an asynchronous web crawler with scraping capabilities.
  - Utility functions for reading/writing files, getting current time,
    searching Wikipedia, and reading PDF files.
Each utility function is wrapped as a LangGraph tool using the @tool decorator.
"""
import asyncio
import httpx
from bs4 import BeautifulSoup
from typing import Dict, Any, List, Tuple
from urllib.parse import urlparse, urljoin
import html2text
import json
import time
import re
import os
from collections import Counter
import PyPDF2
from dotenv import load_dotenv
from wikipedia import summary

load_dotenv()

# Configure logging as needed
import logging
logger = logging.getLogger(__name__)

# Dummy settings class; replace or import from your project settings.
class settings:
    TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# ---------------- AsyncEnhancedWebTool Class ---------------- #

class AsyncEnhancedWebTool:
    def __init__(
        self,
        max_depth: int = 3,
        max_pages: int = 100,
        concurrency: int = 10,
        timeout: int = 300,
    ):
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.concurrency = concurrency
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                          "AppleWebKit/537.36 (KHTML, like Gecko) "
                          "Chrome/91.0.4472.124 Safari/537.36",
        }
        self.html2text_converter = html2text.HTML2Text()
        self.html2text_converter.ignore_links = False
        self.html2text_converter.ignore_images = False
        self.html2text_converter.ignore_emphasis = False
        self.html2text_converter.body_width = 0  # Disable line wrapping

        # Sets and locks to ensure each URL is processed only once
        self.visited = set()
        self.results = []
        self.visited_lock = asyncio.Lock()
        self.queue_size = 0  # Track the number of URLs in the queue
        self.start_time = 0
        self.max_pages_reached = False  # Flag to indicate if max pages limit was reached
        self.current_pages = 0  # Counter for pages processed
        self.current_pages_lock = asyncio.Lock()  # Lock for the counter
        self.all_links = Counter()  # Store all unique links with their counts

    async def crawl(
        self, start_url: str, formats: List[str] = ["markdown"]
    ) -> Tuple[List[Dict[str, Any]], bool]:
        """
        Initiates the crawling process starting from start_url.
        Uses an asyncio.Queue to hold URLs and spawns multiple workers.
        The process stops when no new URLs are found or when max_pages is reached.
        """
        self.start_time = time.time()
        queue = asyncio.Queue()
        await queue.put((start_url, 0))

        async with httpx.AsyncClient(headers=self.headers, timeout=10) as client:
            # Launch worker tasks concurrently.
            workers = [
                asyncio.create_task(self.worker(queue, client, formats))
                for _ in range(self.concurrency)
            ]
            # Wait until all queued tasks are processed or timeout is reached.
            try:
                await asyncio.wait_for(queue.join(), timeout=self.timeout)
            except asyncio.TimeoutError:
                print(f"Crawl timed out after {self.timeout} seconds")
            finally:
                # Cancel workers
                for w in workers:
                    w.cancel()
                await asyncio.gather(*workers, return_exceptions=True)

        return self.results, self.max_pages_reached

    async def worker(
        self, queue: asyncio.Queue, client: httpx.AsyncClient, formats: List[str]
    ):
        """
        Worker function that processes URLs from the queue.
        It checks if the URL has been visited and if we haven't exceeded max_depth or max_pages.
        """
        while True:
            async with self.current_pages_lock:
                if self.current_pages >= self.max_pages:
                    print(f"Reached max pages limit ({self.max_pages}). Stopping crawl.")
                    self.max_pages_reached = True
                    queue.task_done()
                    break

            try:
                url, depth = await queue.get()
                self.queue_size -= 1
                print(f"Processing URL: {url} at depth {depth}. Queue size: {self.queue_size}")
            except asyncio.CancelledError:
                break

            if time.time() - self.start_time > self.timeout:
                print("Timeout reached. Stopping crawl.")
                queue.task_done()
                break

            normalized_url = self.normalize_url(url)

            async with self.visited_lock:
                if normalized_url in self.visited or depth > self.max_depth:
                    print(f"URL already visited or max depth reached. Skipping {url}")
                    queue.task_done()
                    continue
                async with self.current_pages_lock:
                    if self.current_pages >= self.max_pages:
                        print(f"Max pages reached. Skipping {url}")
                        queue.task_done()
                        continue
                    self.visited.add(normalized_url)
                    self.current_pages += 1

            page_content = await self.scrape_page(url, client, formats)
            if page_content:
                self.results.append(page_content)
                print(f"Added content for {url}. Total pages: {len(self.results)}")

                async with self.current_pages_lock:
                    if depth < self.max_depth and self.current_pages < self.max_pages:
                        links = self.extract_links(url, page_content.get("html", ""))
                        print(f"Found {len(links)} links on {url}")
                        for link in links:
                            if link not in self.visited and self.current_pages < self.max_pages:
                                await queue.put((link, depth + 1))
                                self.queue_size += 1
                                print(f"Added {link} to queue at depth {depth + 1}. Queue size: {self.queue_size}")
            else:
                print(f"Failed to scrape {url}")

            queue.task_done()

    async def scrape_page(
        self, url: str, client: httpx.AsyncClient, formats: List[str]
    ) -> Dict[str, Any]:
        """
        Asynchronously scrapes a single page using httpx.
        Parses the content with BeautifulSoup and converts it to the desired formats.
        """
        try:
            response = await client.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")

            result = {
                "url": url,
                "metadata": self.extract_metadata(soup, url),
            }

            if "markdown" in formats:
                result["markdown"] = self.html_to_markdown(str(soup))
            if "html" in formats:
                result["html"] = str(soup)
            if "structured_data" in formats:
                result["structured_data"] = self.extract_structured_data(soup)

            return result
        except httpx.RequestError as e:
            print(f"Error scraping {url}: {str(e)}")
            return None

    def normalize_url(self, url: str) -> str:
        """
        Normalize URL to prevent duplicates by removing trailing slashes,
        fragments, and converting to lowercase.
        """
        parsed = urlparse(url)
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path.rstrip('/')}"
        return normalized.lower()

    def extract_links(self, base_url: str, html_content: str) -> List[str]:
        """
        Extracts all same-domain links from the provided HTML content.
        """
        soup = BeautifulSoup(html_content, "html.parser")
        base_domain = urlparse(base_url).netloc.split(".")[-2:]
        links = []

        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"]
            if not href or href.startswith("#"):
                continue
            full_url = urljoin(base_url, href)
            link_domain = urlparse(full_url).netloc.split(".")[-2:]
            if link_domain == base_domain:
                links.append(full_url)

        return links

    def extract_metadata(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """
        Extracts basic metadata such as title, description, and language.
        """
        metadata = {
            "title": self.clean_text(soup.title.string) if soup.title else "",
            "description": "",
            "language": soup.html.get("lang", "") if soup.html else "",
            "sourceURL": url,
            "last_updated": None,
        }

        meta_tags = soup.find_all("meta")
        for tag in meta_tags:
            name = tag.get("name") or tag.get("property")
            if not name:
                continue
            if any(x in name.lower() for x in ["sentry", "baggage", "intercom"]):
                continue
            if name == "description" or name == "og:description":
                metadata["description"] = self.clean_text(tag.get("content", ""))
            elif name == "article:modified_time":
                metadata["last_updated"] = tag.get("content")
        return metadata

    def html_to_markdown(self, html_content: str) -> str:
        """
        Converts HTML content to Markdown using html2text.
        """
        markdown = self.html2text_converter.handle(html_content)
        return markdown.strip()

    def clean_text(self, text: str) -> str:
        """
        Cleans text content by removing unwanted elements and normalizing whitespace.
        """
        if not text:
            return ""
        text = re.sub(r"Copyright.*?Intercom.*?$", "", text, flags=re.MULTILINE | re.DOTALL)
        text = re.sub(r"\[email.*?protected\]", "", text)
        text = re.sub(r"We run on Intercom", "", text)
        text = " ".join(text.split())
        return text.strip()

    def extract_structured_data(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """
        Extracts structured data including full text, headings, links, YouTube content, and JSON-LD.
        """
        structured_data = {}
        main_content = soup.find("main") or soup.find("article") or soup
        all_text = self.clean_text(main_content.get_text(separator=" "))
        structured_data["full_text"] = all_text

        headings = {}
        current_h1 = None
        for i in range(1, 7):
            h_tags = main_content.find_all(f"h{i}")
            if h_tags:
                clean_headings = [self.clean_text(tag.get_text()) for tag in h_tags]
                clean_headings = [h for h in clean_headings if h]
                if clean_headings:
                    headings[f"h{i}"] = clean_headings
                    if i == 1:
                        current_h1 = clean_headings[0]
        structured_data["headings"] = headings

        for a in soup.find_all("a", href=True):
            href = a["href"]
            text = self.clean_text(a.get_text())
            if not href or href.startswith("#") or not text:
                continue
            if "intercom" in href.lower():
                continue
            self.all_links[(text, href)] += 1

        video_content = []
        for iframe in soup.find_all("iframe", src=True):
            src = iframe["src"]
            if any(yt_domain in src for yt_domain in ["youtube.com/embed/", "youtube-nocookie.com/embed/"]):
                context = ""
                element = iframe
                while element and not context:
                    prev = element.find_previous(["h1", "h2", "h3", "h4", "h5", "h6", "p"])
                    if prev:
                        context = self.clean_text(prev.get_text())
                    element = element.parent
                video_id = src.split("/")[-1].split("?")[0]
                video_data = {
                    "title": context or current_h1,
                    "description": context,
                    "video": {
                        "type": "youtube",
                        "embed_url": src,
                        "video_id": video_id,
                        "watch_url": f"https://www.youtube.com/watch?v={video_id}",
                    },
                }
                video_content.append(video_data)
        if video_content:
            structured_data["video_content"] = video_content

        meta_tags = {}
        relevant_meta = ["description", "keywords", "author", "og:", "twitter:", "article:"]
        for meta in soup.find_all("meta"):
            name = meta.get("name") or meta.get("property")
            if name and any(rm in name.lower() for rm in relevant_meta):
                meta_tags[name] = meta.get("content")
        if meta_tags:
            structured_data["meta_tags"] = meta_tags

        json_ld_data = []
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and "@type" in data:
                    json_ld_data.append(data)
            except (json.JSONDecodeError, TypeError):
                pass
        if json_ld_data:
            structured_data["json_ld"] = json_ld_data

        return structured_data

# ---------------- Utility Functions (Non-class) ---------------- #

def _read_file(file_path: str) -> str:
    with open(file_path, 'r') as file:
        return file.read()

def _write_file(file_path: str, content: str) -> str:
    with open(file_path, 'w') as file:
        file.write(content)
    return f"Content written to {file_path}"

def _get_current_time(*args, **kwargs) -> str:
    now = time.localtime()
    return time.strftime("%d-%m-%Y | %I:%M %p", now)

def _search_wikipedia(query: str) -> str:
    try:
        return summary(query, sentences=2)
    except Exception as e:
        return f"Sorry, I couldn't find anything on Wikipedia. Error: {str(e)}"

def _read_pdf(file_path: str) -> str:
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text
    except Exception as e:
        return f"Error reading PDF file: {str(e)}"

# ---------------- LangGraph Tool Wrappers ---------------- #
# Import the @tool decorator from LangChain Core.
from langchain_core.tools import tool

@tool
async def tavily_search(query: str) -> str:
    """
    Tool to perform a web search using AsyncEnhancedWebTool.
    For demonstration, we use the crawler to search starting from the query as a URL.
    """
    crawler = AsyncEnhancedWebTool()
    # Here, we simulate a search by using the query as a starting URL.
    # In a real implementation, you might use a dedicated search API.
    results, _ = await crawler.crawl(query, formats=["markdown"])
    return json.dumps({"results": results})

@tool
async def web_crawler(start_url: str, formats: List[str] = ["markdown"]) -> str:
    """
    Tool that crawls the web starting from start_url using AsyncEnhancedWebTool.
    Returns a JSON string with the crawl results and a flag indicating if max pages were reached.
    """
    crawler = AsyncEnhancedWebTool()
    results, max_pages_reached = await crawler.crawl(start_url, formats)
    output = {"results": results, "max_pages_reached": max_pages_reached}
    return json.dumps(output)

@tool
def read_file_tool(file_path: str) -> str:
    """
    Tool to read the content of a file.
    """
    return _read_file(file_path)

@tool
def write_file_tool(file_path: str, content: str) -> str:
    """
    Tool to write content to a file.
    """
    return _write_file(file_path, content)

@tool
def get_current_time_tool() -> str:
    """
    Tool to return the current date and time.
    """
    return _get_current_time()

@tool
def search_wikipedia_tool(query: str) -> str:
    """
    Tool to perform a Wikipedia lookup and return a summary.
    """
    return _search_wikipedia(query)

@tool
def read_pdf_tool(file_path: str) -> str:
    """
    Tool to read a PDF file and return its text content.
    """
    return _read_pdf(file_path)



import os
import re
import json
import httpx
import requests
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from bs4 import BeautifulSoup
import html2text
from wikipedia import summary, WikipediaException
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import asyncio
import logging
from tavily import TavilyClient
import pandas as pd

# Mock document store for RAG
DOCUMENTS: Dict[str, Any] = {}

@dataclass
class Document:
    page_content: str
    metadata: Dict

class WikipediaTool:
    def search(self, query: str) -> Dict[str, Any]:
        """Search Wikipedia and return a 2-sentence summary."""
        steps = [{"step": "Received query", "details": query}]
        try:
            steps.append({"step": "Searching Wikipedia", "details": f"Query: {query}"})
            result = summary(query, sentences=2)
            steps.append({"step": "Summary retrieved", "details": result[:100] + "..."})
            return {"result": result, "intermediate_steps": steps, "status": "success"}
        except WikipediaException as e:
            steps.append({"step": "Error", "details": str(e)})
            return {"result": f"Couldn’t find anything on Wikipedia: {str(e)}", "intermediate_steps": steps, "status": "error"}

class ArXivTool:
    def fetch(self, arxiv_id: str) -> Dict[str, Any]:
        """Fetch the abstract of an ArXiv paper given its ID (e.g., '1706.03762')."""
        steps = [{"step": "Received ArXiv ID", "details": arxiv_id}]
        url = f"https://export.arxiv.org/abs/{arxiv_id}"
        abstract_pattern = re.compile(r'<blockquote class="abstract mathjax">\s*<span class="descriptor">Abstract:</span>(.*?)</blockquote>', re.DOTALL)

        steps.append({"step": "Fetching URL", "details": url})
        res = requests.get(url)
        re_match = abstract_pattern.search(res.text)

        if re_match:
            result = re_match.group(1).strip()
            steps.append({"step": "Abstract extracted", "details": result[:100] + "..."})
            return {"result": result, "intermediate_steps": steps, "status": "success"}
        else:
            steps.append({"step": "Error", "details": "Abstract not found"})
            return {"result": "Abstract not found", "intermediate_steps": steps, "status": "error"}

class WebScrapeTool:
    def __init__(self):
        self.html2text_converter = html2text.HTML2Text()
        self.html2text_converter.ignore_links = False
        self.html2text_converter.ignore_images = False
        self.html2text_converter.ignore_emphasis = False
        self.html2text_converter.body_width = 0

    async def scrape(self, url: str, formats: List[str] = ["markdown"]) -> Dict[str, Any]:
        """Scrape a webpage and return content in specified formats."""
        steps = [{"step": "Received URL", "details": url}]
        async with httpx.AsyncClient() as client:
            try:
                steps.append({"step": "Sending HTTP request", "details": url})
                response = await client.get(url)
                response.raise_for_status()
                steps.append({"step": "HTML received", "details": f"Status: {response.status_code}"})

                soup = BeautifulSoup(response.text, "html.parser")
                result = {"url": url, "metadata": {}}

                result["metadata"] = {
                    "title": soup.title.string.strip() if soup.title else "",
                    "description": next((tag["content"] for tag in soup.find_all("meta") if tag.get("name") == "description"), ""),
                    "language": soup.html.get("lang", "") if soup.html else "",
                    "sourceURL": url
                }
                steps.append({"step": "Metadata extracted", "details": str(result["metadata"])})

                if "markdown" in formats:
                    result["markdown"] = self.html2text_converter.handle(str(soup)).strip()
                if "html" in formats:
                    result["html"] = str(soup)
                if "structured_data" in formats:
                    result["structured_data"] = {
                        "full_text": soup.get_text(separator=" ").strip(),
                        "headings": {f"h{i}": [h.get_text().strip() for h in soup.find_all(f"h{i}")] for i in range(1, 7)}
                    }

                steps.append({"step": "Content processed", "details": f"Formats: {formats}"})
                DOCUMENTS[result["url"]] = Document(page_content=result.get("markdown", ""), metadata=result["metadata"])
                return {"result": result, "intermediate_steps": steps, "status": "success"}
            except Exception as e:
                steps.append({"step": "Error", "details": str(e)})
                return {"result": None, "intermediate_steps": steps, "status": "error"}

def search_web(query: str) -> Dict[str, Any]:
    steps = [{"step": "Received query", "details": query}]
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        error_msg = "TAVILY_API_KEY environment variable not set"
        steps.append({"step": "Error", "details": error_msg})
        return {"result": f"Search failed: {error_msg}", "intermediate_steps": steps, "status": "error"}
    
    tavily_client = TavilyClient(api_key=api_key)
    try:
        steps.append({"step": "Executing Tavily search", "details": f"Query: {query}"})
        response = tavily_client.search(
            query=query,
            search_depth="advanced",
            max_results=4,
            include_images=False,
            include_answer=True,
            include_raw_content=False
        )
        steps.append({"step": "Search results retrieved", "details": str(response)[:100] + "..."})
        return {"result": response, "intermediate_steps": steps, "status": "success"}
    except Exception as e:
        error_msg = str(e)
        steps.append({"step": "Error", "details": error_msg})
        return {"result": f"Search failed: {error_msg}", "intermediate_steps": steps, "status": "error"}

class DataAnalysisTool:
    def analyze(self, query: str, csv_path: Optional[str] = None, csv_content: Optional[str] = None) -> Dict[str, Any]:
        """Analyze CSV data if provided, returning basic stats or query-specific results."""
        steps = [{"step": "Received query", "details": query}]
        
        if not csv_path and not csv_content:
            steps.append({"step": "No CSV provided", "details": "Skipping analysis"})
            return {"result": "No CSV data provided for analysis", "intermediate_steps": steps, "status": "skipped"}

        try:
            if csv_path:
                steps.append({"step": "Reading CSV file", "details": csv_path})
                df = pd.read_csv(csv_path)
            elif csv_content:
                steps.append({"step": "Processing CSV content", "details": csv_content[:100] + "..."})
                from io import StringIO
                df = pd.read_csv(StringIO(csv_content))

            steps.append({"step": "CSV loaded", "details": f"Shape: {df.shape}"})
            
            if "mean" in query.lower() or "average" in query.lower():
                result = df.mean(numeric_only=True).to_dict()
                steps.append({"step": "Computed mean", "details": str(result)})
            elif "count" in query.lower():
                result = df.count().to_dict()
                steps.append({"step": "Computed count", "details": str(result)})
            else:
                result = df.describe().to_dict()
                steps.append({"step": "Generated description", "details": str(result)[:100] + "..."})

            return {"result": result, "intermediate_steps": steps, "status": "success"}
        except Exception as e:
            steps.append({"step": "Error", "details": str(e)})
            return {"result": f"Analysis failed: {str(e)}", "intermediate_steps": steps, "status": "error"}

class FileReadTool:
    def read(self, file_path: str) -> Dict[str, Any]:
        """Read content from a file."""
        steps = [{"step": "Received file path", "details": file_path}]
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            steps.append({"step": "File read", "details": content[:100] + "..."})
            return {"result": content, "intermediate_steps": steps, "status": "success"}
        except Exception as e:
            steps.append({"step": "Error", "details": str(e)})
            return {"result": f"Read failed: {str(e)}", "intermediate_steps": steps, "status": "error"}

class FileWriteTool:
    def write(self, file_path: str, content: str, append: bool = False) -> Dict[str, Any]:
        """Write content to a file, optionally appending."""
        steps = [{"step": "Received file path and content", "details": f"{file_path}, {content[:100]}..."}]
        try:
            mode = "a" if append else "w"
            with open(file_path, mode, encoding="utf-8") as f:
                f.write(content)
            steps.append({"step": "File written", "details": f"Mode: {mode}"})
            return {"result": "Write successful", "intermediate_steps": steps, "status": "success"}
        except Exception as e:
            steps.append({"step": "Error", "details": str(e)})
            return {"result": f"Write failed: {str(e)}", "intermediate_steps": steps, "status": "error"}

class RAGTool:
    def __init__(self):
        self.llm = ChatOpenAI(api_key=os.getenv("OPENAI_API_KEY"), model="gpt-4o")

    def retrieve_and_generate(self, query: str, context: Optional[str] = None) -> Dict[str, Any]:
        """Retrieve relevant documents and generate an answer using an LLM."""
        steps = [{"step": "Received query", "details": query}]
        
        if context:
            DOCUMENTS[query[:50]] = Document(page_content=context, metadata={"source": "user_provided"})
            steps.append({"step": "Added context to store", "details": context[:100] + "..."})

        steps.append({"step": "Searching documents", "details": f"Total docs: {len(DOCUMENTS)}"})
        relevant_doc = None
        for doc in DOCUMENTS.values():
            if query.lower() in doc.page_content.lower():
                relevant_doc = doc
                steps.append({"step": "Document found", "details": doc.page_content[:100] + "..."})
                break

        if not relevant_doc:
            steps.append({"step": "No relevant document", "details": "Using LLM directly"})
            result = self.llm.invoke(f"Answer based on general knowledge: {query}").content
        else:
            prompt = ChatPromptTemplate.from_template(
                "Using the following context, answer the query:\n\nContext: {context}\n\nQuery: {query}"
            )
            chain = prompt | self.llm
            steps.append({"step": "Generating with context", "details": relevant_doc.page_content[:100] + "..."})
            result = chain.invoke({"context": relevant_doc.page_content, "query": query}).content

        steps.append({"step": "Result generated", "details": result[:100] + "..."})
        return {"result": result, "intermediate_steps": steps, "status": "success"}