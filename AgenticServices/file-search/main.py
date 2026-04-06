from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import hashlib

app = FastAPI(title="File Search", version="1.0.0")

# In-memory storage
file_index: Dict[str, Dict[str, Any]] = {}

class SearchRequest(BaseModel):
    query: str
    limit: int = 10

class IndexRequest(BaseModel):
    file_path: str
    content: str
    metadata: Dict[str, Any] = {}

class SearchResult(BaseModel):
    file_path: str
    content: str
    score: float
    metadata: Dict[str, Any] = {}

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "file-search", "indexed": len(file_index)}

@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    results = []
    query_lower = request.query.lower()
    
    for file_path, data in file_index.items():
        content = data["content"].lower()
        if query_lower in content:
            score = content.count(query_lower) / len(content.split())
            results.append(SearchResult(
                file_path=file_path,
                content=data["content"][:200],
                score=min(score * 100, 1.0),
                metadata=data.get("metadata", {})
            ))
    
    results.sort(key=lambda x: x.score, reverse=True)
    return SearchResponse(results=results[:request.limit], total=len(results))

@app.post("/index")
async def index_file(request: IndexRequest):
    file_index[request.file_path] = {
        "content": request.content,
        "metadata": request.metadata
    }
    return {"success": True, "file_path": request.file_path}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8032)
