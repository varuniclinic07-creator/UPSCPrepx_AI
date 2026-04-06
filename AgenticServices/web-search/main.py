from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from datetime import datetime

app = FastAPI(title="Web Search", version="1.0.0")

class SearchRequest(BaseModel):
    query: str
    limit: int = 10

class WebSearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    published_date: str = None
    source: str

class SearchResponse(BaseModel):
    results: List[WebSearchResult]
    query: str
    total: int

# Mock data for demonstration
MOCK_SOURCES = [
    {"title": "The Hindu", "url": "https://thehindu.com"},
    {"title": "Indian Express", "url": "https://indianexpress.com"},
    {"title": "PIB", "url": "https://pib.gov.in"},
]

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "web-search"}

@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    results = []
    for i, source in enumerate(MOCK_SOURCES[:request.limit]):
        results.append(WebSearchResult(
            title=f"{request.query} - {source['title']}",
            url=f"{source['url']}/article/{i}",
            snippet=f"Latest information about {request.query} from {source['title']}",
            published_date=datetime.now().isoformat(),
            source=source['title']
        ))
    
    return SearchResponse(results=results, query=request.query, total=len(results))

@app.post("/search/news", response_model=SearchResponse)
async def search_news(request: SearchRequest):
    results = []
    for i, source in enumerate(MOCK_SOURCES[:request.limit]):
        results.append(WebSearchResult(
            title=f"Breaking: {request.query}",
            url=f"{source['url']}/news/{i}",
            snippet=f"Latest news about {request.query}",
            published_date=datetime.now().isoformat(),
            source=source['title']
        ))
    
    return SearchResponse(results=results, query=request.query, total=len(results))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8030)
