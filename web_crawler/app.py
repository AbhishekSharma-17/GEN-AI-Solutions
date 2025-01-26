from Crawler import EnhancedWebTool
import json
from datetime import datetime
import os

def crawl_and_save_website(start_url: str, output_dir: str = "crawled_data", 
                          max_depth: int = 3, max_pages: int = 100):
    """
    Crawl a website starting from the given URL and save the results to files.
    
    Args:
        start_url (str): The URL to start crawling from
        output_dir (str): Directory to save the output files
        max_depth (int): Maximum depth to crawl
        max_pages (int): Maximum number of pages to crawl
    """
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Initialize the web tool
    web_tool = EnhancedWebTool(max_depth=max_depth, max_pages=max_pages)
    
    # Generate timestamp for unique filenames
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Crawl the website
    print(f"Starting crawl of {start_url}")
    results = web_tool.crawl(
        start_url, 
        formats=["markdown", "html", "structured_data"]
    )
    
    # Save the complete results as JSON
    json_filename = os.path.join(output_dir, f"crawl_results_{timestamp}.json")
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"Saved complete results to {json_filename}")
    
    # Save individual page contents in separate files
    for i, page in enumerate(results):
        # Create a safe filename from the URL
        safe_url = page['url'].replace('://', '_').replace('/', '_').replace('?', '_')
        if len(safe_url) > 100:  # Truncate if too long
            safe_url = safe_url[:100]
        
        # Save markdown content
        if 'markdown' in page:
            md_filename = os.path.join(output_dir, f"{safe_url}_{timestamp}.md")
            with open(md_filename, 'w', encoding='utf-8') as f:
                f.write(page['markdown'])
        
        # Save HTML content
        if 'html' in page:
            html_filename = os.path.join(output_dir, f"{safe_url}_{timestamp}.html")
            with open(html_filename, 'w', encoding='utf-8') as f:
                f.write(page['html'])
        
        # Save metadata and structured data
        meta_filename = os.path.join(output_dir, f"{safe_url}_{timestamp}_meta.json")
        meta_data = {
            'metadata': page['metadata'],
            'structured_data': page.get('structured_data', {})
        }
        with open(meta_filename, 'w', encoding='utf-8') as f:
            json.dump(meta_data, f, indent=2, ensure_ascii=False)
        
        print(f"Processed page {i+1}/{len(results)}: {page['url']}")
    
    # Generate a summary report
    summary = {
        'start_url': start_url,
        'total_pages_crawled': len(results),
        'crawl_timestamp': timestamp,
        'max_depth': max_depth,
        'max_pages': max_pages,
        'crawled_urls': [page['url'] for page in results]
    }
    
    summary_filename = os.path.join(output_dir, f"crawl_summary_{timestamp}.json")
    with open(summary_filename, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    print(f"\nCrawl completed!")
    print(f"Total pages crawled: {len(results)}")
    print(f"Results saved in directory: {output_dir}")
    print(f"Summary file: {summary_filename}")

if __name__ == "__main__":
    # Example usage
    start_url = "https://help.kroolo.com/en/"  
    crawl_and_save_website(
        start_url=start_url,
        output_dir="website_crawl",
        max_depth=3,
        max_pages=10
    )