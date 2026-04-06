# ═══════════════════════════════════════════════════════════════
# AGENTIC WEB SEARCH SERVICE - MAIN APPLICATION
# DuckDuckGo search with UPSC filtering
# ═══════════════════════════════════════════════════════════════

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import asyncio
from datetime import datetime, timedelta
import hashlib
import json
import redis
import os

app = FastAPI(title="Agentic Web Search", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis for caching
redis_client = redis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379"),
    decode_responses=True
)

# UPSC-relevant sources
UPSC_SOURCES = [
    "vision ias",
    "drishti ias",
    "insights on india",
    "only ias",
    "pib.gov.in",
    "the hindu",
    "indian express",
    "yojana",
    "kurukshetra",
    "upsc.gov.in",
    "prsindia.org",
    "ncert.nic.in"
]

class SearchRequest(BaseModel):
    query: str
    max_results: int = 10
    filter_upsc: bool = True

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    source: str
    relevance_score: float

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total_results: int
    cached: bool
    timestamp: str

def calculate_upsc_relevance(result: dict) -> float:
    """Calculate relevance score for UPSC content"""
    score = 0.5  # Base score
    
    url = result.get('href', '').lower()
    title = result.get('title', '').lower()
    snippet = result.get('body', '').lower()
    
    # Boost for UPSC-specific sources
    for source in UPSC_SOURCES:
        if source in url or source in title:
            score += 0.3
            break
    
    # Boost for UPSC keywords
    upsc_keywords = ['upsc', 'civil services', 'ias', 'ips', 'prelims', 'mains', 'cse']
    for keyword in upsc_keywords:
        if keyword in title or keyword in snippet:
            score += 0.1
    
    # Boost for government/official sources
    if '.gov.in' in url or '.nic.in' in url:
        score += 0.2
    
    return min(score, 1.0)

async def search_duckduckgo(query: str, max_results: int = 10) -> List[dict]:
    """Search DuckDuckGo"""
    url = "https://html.duckduckgo.com/html/"
    
    params = {
        'q': query,
        'kl': 'in-en'  # India region, English
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(url, data=params, follow_redirects=True)
            response.raise_for_status()
            
            # Parse HTML results (simplified - use BeautifulSoup in production)
            # For now, return mock results structure
            # In production, parse response.text with BeautifulSoup
            
            results = []
            # TODO: Implement HTML parsing
            # For now, using DuckDuckGo API alternative
            
            return results[:max_results]
            
        except Exception as e:
            print(f"Search error: {e}")
            return []

@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """Perform web search with caching"""
    
    # Generate cache key
    cache_key = f"search:{hashlib.md5(request.query.encode()).hexdigest()}"
    
    # Check cache
    cached_result = redis_client.get(cache_key)
    if cached_result:
        data = json.loads(cached_result)
        data['cached'] = True
        return SearchResponse(**data)
    
    # Perform search
    raw_results = await search_duckduckgo(request.query, request.max_results * 2)
    
    # Process results
    results = []
    for item in raw_results:
        relevance = calculate_upsc_relevance(item)
        
        if not request.filter_upsc or relevance > 0.5:
            results.append(SearchResult(
                title=item.get('title', ''),
                url=item.get('href', ''),
                snippet=item.get('body', ''),
                source=item.get('href', '').split('/')[2] if '/' in item.get('href', '') else '',
                relevance_score=relevance
            ))
    
    # Sort by relevance
    results.sort(key=lambda x: x.relevance_score, reverse=True)
    results = results[:request.max_results]
    
    response_data = {
        'query': request.query,
        'results': [r.dict() for r in results],
        'total_results': len(results),
        'cached': False,
        'timestamp': datetime.now().isoformat()
    }
    
    # Cache for 1 hour
    redis_client.setex(
        cache_key,
        int(os.getenv("CACHE_TTL", "3600")),
        json.dumps(response_data)
    )
    
    return SearchResponse(**response_data)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "agentic-web-search",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8030)
