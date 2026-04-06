from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os

app = FastAPI(title="Autodoc Thinker", version="1.0.0")

class ExplainRequest(BaseModel):
    content: str
    context: str = None

class SimplifyRequest(BaseModel):
    content: str

class Response(BaseModel):
    result: str
    confidence: float

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "autodoc-thinker"}

@app.post("/explain", response_model=Response)
async def explain(request: ExplainRequest):
    # Simple explanation generator using templates
    result = f"Explanation: {request.content[:200]}...\n\n"
    if request.context:
        result += f"Context: {request.context}\n\n"
    result += "This concept is important for UPSC preparation."
    
    return Response(result=result, confidence=0.85)

@app.post("/simplify", response_model=Response)
async def simplify(request: SimplifyRequest):
    # Simple text simplification
    words = request.content.split()
    simplified = " ".join(words[:50]) + "..." if len(words) > 50 else request.content
    
    return Response(result=f"Simplified: {simplified}", confidence=0.90)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8031)
