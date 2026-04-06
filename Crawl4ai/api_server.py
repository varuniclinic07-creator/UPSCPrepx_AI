"""
Crawl4AI API Server - FastAPI wrapper for UPSC Content Crawler
Provides HTTP API for Next.js app integration
"""

from fastapi import FastAPI, HTTPException, Depends, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl, validator
from typing import List, Optional
import asyncio
import os
from datetime import datetime
import logging

from upsc_content_crawler import UPSCContentCrawler
from upsc_crawler_config import UpdateFrequency

# Configuration
API_TOKEN = os.getenv('API_TOKEN', 'upsc2026crawltoken')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
API_PORT = int(os.getenv('API_PORT', 11235))

# Allowed domains for SSRF protection
ALLOWED_DOMAINS = [
    'thehindu.com', 'indianexpress.com', 'pib.gov.in',
    'visionias.in', 'drishtiias.com', 'insightsonindia.com'
]

# Initialize FastAPI
app = FastAPI(title="UPSC Crawl4AI API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global crawler instance
crawler = None

# Request Models
class ScrapeRequest(BaseModel):
    url: HttpUrl
    
    @validator('url')
    def validate_domain(cls, v):
        if not any(domain in str(v) for domain in ALLOWED_DOMAINS):
            raise ValueError('Domain not whitelisted')
        return v

class BatchScrapeRequest(BaseModel):
    urls: List[HttpUrl]
    
    @validator('urls')
    def validate_urls(cls, v):
        if len(v) > 10:
            raise ValueError('Max 10 URLs per request')
        for url in v:
            if not any(domain in str(url) for domain in ALLOWED_DOMAINS):
                raise ValueError(f'Domain not whitelisted: {url}')
        return v

class FrequencyScrapeRequest(BaseModel):
    frequency: str
    force: bool = False
    
    @validator('frequency')
    def validate_frequency(cls, v):
        if v not in ['daily', 'weekly', 'monthly', 'realtime']:
            raise ValueError('Invalid frequency')
        return v

# Response Models
class ScrapeResponse(BaseModel):
    success: bool
    url: str
    title: Optional[str]
    content_length: int
    stored: bool

class BatchScrapeResponse(BaseModel):
    success: bool
    total: int
    succeeded: int
    failed: int
    results: List[ScrapeResponse]

# Authentication
async def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = authorization.replace('Bearer ', '')
    if token != API_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return token

# Initialize crawler
@app.on_event("startup")
async def startup():
    global crawler
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY")
    
    crawler = UPSCContentCrawler(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Crawler initialized")

# Health check
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "crawler_ready": crawler is not None
    }

# Single URL scrape
@app.post("/crawl", response_model=ScrapeResponse, dependencies=[Depends(verify_token)])
async def crawl_url(request: ScrapeRequest):
    try:
        from upsc_crawler_config import SourceConfig, ContentCategory
        
        source = SourceConfig(
            name="API Request",
            url=str(request.url),
            category=ContentCategory.CURRENT_AFFAIRS,
            update_frequency=UpdateFrequency.DAILY,
            priority=1,
            rate_limit_delay=2.0
        )
        
        from crawl4ai import AsyncWebCrawler
        async with AsyncWebCrawler(verbose=False) as web_crawler:
            data = await crawler._crawl_with_retry(web_crawler, source)
            
            if data:
                stored = await crawler.storage.store_content(data)
                return ScrapeResponse(
                    success=True,
                    url=str(request.url),
                    title=data.get('metadata', {}).get('title', 'N/A'),
                    content_length=len(data.get('markdown_content', '')),
                    stored=stored
                )
            else:
                raise HTTPException(status_code=500, detail="Crawl failed")
                
    except Exception as e:
        logger.error(f"Crawl error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Batch scrape
@app.post("/crawl/batch", response_model=BatchScrapeResponse, dependencies=[Depends(verify_token)])
async def crawl_batch(request: BatchScrapeRequest):
    results = []
    succeeded = 0
    failed = 0
    
    for url in request.urls:
        try:
            response = await crawl_url(ScrapeRequest(url=url))
            results.append(response)
            if response.success:
                succeeded += 1
            else:
                failed += 1
        except Exception as e:
            logger.error(f"Failed to crawl {url}: {e}")
            results.append(ScrapeResponse(
                success=False,
                url=str(url),
                title=None,
                content_length=0,
                stored=False
            ))
            failed += 1
    
    return BatchScrapeResponse(
        success=True,
        total=len(request.urls),
        succeeded=succeeded,
        failed=failed,
        results=results
    )

# Scrape by frequency (background task)
@app.post("/crawl/frequency", dependencies=[Depends(verify_token)])
async def crawl_by_frequency(request: FrequencyScrapeRequest, background_tasks: BackgroundTasks):
    freq_map = {
        'daily': UpdateFrequency.DAILY,
        'weekly': UpdateFrequency.WEEKLY,
        'monthly': UpdateFrequency.MONTHLY,
        'realtime': UpdateFrequency.REALTIME,
    }
    
    frequency = freq_map[request.frequency]
    
    # Run in background
    background_tasks.add_task(
        crawler.crawl_by_frequency,
        frequency,
        request.force
    )
    
    return {
        "success": True,
        "message": f"Started {request.frequency} crawl in background",
        "frequency": request.frequency
    }

# Get crawler stats
@app.get("/stats", dependencies=[Depends(verify_token)])
async def get_stats():
    return {
        "stats": crawler.stats,
        "failure_counts": crawler.failure_counts
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=API_PORT)
