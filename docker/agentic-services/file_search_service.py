from __future__ import annotations

import os
import time

from fastapi import FastAPI
from pydantic import BaseModel

from material_search import search_materials

app = FastAPI()
MATERIALS_PATH = os.getenv("MATERIALS_PATH", "/materials")


class FileSearchRequest(BaseModel):
    query: str
    subject: str | None = None
    category: str | None = None
    max_results: int = 5
    user_id: str | None = None


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/search")
async def search(request: FileSearchRequest):
    started = time.time()
    results = search_materials(request.query, MATERIALS_PATH, max_results=request.max_results)

    payload = [
        {
            "file_name": item["path"].name,
            "file_url": item["path"].as_uri(),
            "file_path": str(item["path"]),
            "content": item["content"][:4000],
            "excerpt": item["excerpt"],
            "relevance_score": item["relevance_score"],
            "source_type": item["source_type"],
            "file_size": item["path"].stat().st_size,
            "last_modified": int(item["path"].stat().st_mtime),
        }
        for item in results
    ]

    return {
        "results": payload,
        "total_results": len(payload),
        "query": request.query,
        "reasoning_path": ["filesystem scan", "text extraction", "keyword scoring"],
        "search_time_ms": int((time.time() - started) * 1000),
    }
