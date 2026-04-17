from __future__ import annotations

import os
import time

from fastapi import FastAPI
from pydantic import BaseModel

from material_search import search_materials

app = FastAPI()
MATERIALS_PATH = os.getenv("MATERIALS_PATH", "/materials")


class AnalyzeRequest(BaseModel):
    query: str
    user_id: str | None = None
    document_ids: list[str] | None = None
    max_results: int = 5


class ChatRequest(BaseModel):
    document_id: str | None = None
    question: str


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    started = time.time()
    results = search_materials(request.query, MATERIALS_PATH, max_results=request.max_results)
    payload = [
        {
            "document_name": item["path"].name,
            "document_url": item["path"].as_uri(),
            "content": item["content"][:4000],
            "excerpt": item["excerpt"],
            "relevance_score": item["relevance_score"],
            "chapter": item["title"],
        }
        for item in results
    ]

    return {
        "results": payload,
        "total_results": len(payload),
        "processing_time_ms": int((time.time() - started) * 1000),
        "query": request.query,
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    started = time.time()
    results = search_materials(request.question, MATERIALS_PATH, max_results=3)

    if not results:
        return {
            "answer": "No relevant material was found in the mounted study library for this question.",
            "sources": [],
            "confidence": 0.0,
            "processingTime": int((time.time() - started) * 1000),
        }

    answer_parts = []
    sources = []
    for item in results:
        answer_parts.append(f"{item['title']}: {item['excerpt']}")
        sources.append(
            {
                "name": item["path"].name,
                "url": item["path"].as_uri(),
            }
        )

    return {
        "answer": "\n\n".join(answer_parts),
        "sources": sources,
        "confidence": max(item["relevance_score"] for item in results),
        "processingTime": int((time.time() - started) * 1000),
    }


@app.get("/documents/{user_id}")
async def get_documents(user_id: str):
    return {"documents": []}
