# ═══════════════════════════════════════════════════════════════
# AUTODOC THINKER - MAIN APPLICATION  
# Document RAG with A4F API integration
# ═══════════════════════════════════════════════════════════════

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime
import hashlib
from openai import OpenAI
import pypdf
from docx import Document as DocxDocument
import redis
import json
import asyncio

app = FastAPI(title="AutoDoc Thinker", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# A4F Client
client = OpenAI(
    api_key=os.getenv("A4F_API_KEY"),
    base_url=os.getenv("A4F_BASE_URL", "https://api.a4f.co/v1")
)

# Redis for caching
redis_client = redis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379"),
    decode_responses=True
)

# Models
class DocumentUpload(BaseModel):
    filename: str
    content_type: str

class ChatRequest(BaseModel):
    document_id: str
    question: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]
    confidence: float
    session_id: str

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF"""
    text = ""
    with open(file_path, 'rb') as file:
        pdf_reader = pypdf.PdfReader(file)
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX"""
    doc = DocxDocument(file_path)
    return "\n".join([para.text for para in doc.paragraphs])

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[dict]:
    """Split text into chunks with overlap"""
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        
        chunks.append({
            "text": chunk,
            "start": start,
            "end": end,
            "index": len(chunks)
        })
        
        start = end - overlap
    
    return chunks

async def create_embeddings(texts: List[str]) -> List[List[float]]:
    """Create embeddings using A4F"""
    try:
        response = client.embeddings.create(
            model="provider-5/qwen3-embedding-8b",
            input=texts
        )
        return [item.embedding for item in response.data]
    except Exception as e:
        print(f"Embedding error: {e}")
        # Return dummy embeddings as fallback
        return [[0.0] * 768 for _ in texts]

def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Calculate cosine similarity"""
    dot_product = sum(x * y for x, y in zip(a, b))
    magnitude_a = sum(x ** 2 for x in a) ** 0.5
    magnitude_b = sum(x ** 2 for x in b) ** 0.5
    
    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0
    
    return dot_product / (magnitude_a * magnitude_b)

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process document"""
    
    # Save file
    file_id = hashlib.md5(f"{file.filename}{datetime.now()}".encode()).hexdigest()
    file_path = f"/uploads/{file_id}_{file.filename}"
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Extract text based on file type
    if file.filename.endswith('.pdf'):
        text = extract_text_from_pdf(file_path)
    elif file.filename.endswith('.docx'):
        text = extract_text_from_docx(file_path)
    elif file.filename.endswith('.txt'):
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    # Create chunks
    chunks = chunk_text(text)
    
    # Create embeddings
    chunk_texts = [c["text"] for c in chunks]
    embeddings = await create_embeddings(chunk_texts)
    
    # Store in Redis
    doc_data = {
        "id": file_id,
        "filename": file.filename,
        "chunks": chunks,
        "embeddings": [[float(x) for x in emb] for emb in embeddings],
        "total_pages": text.count('\f') + 1,
        "uploaded_at": datetime.now().isoformat()
    }
    
    redis_client.setex(
        f"doc:{file_id}",
        86400 * 7,  # 7 days
        json.dumps(doc_data)
    )
    
    return {
        "document_id": file_id,
        "filename": file.filename,
        "chunks": len(chunks),
        "status": "ready"
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_with_document(request: ChatRequest):
    """Chat with uploaded document"""
    
    # Get document from Redis
    doc_str = redis_client.get(f"doc:{request.document_id}")
    if not doc_str:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc_data = json.loads(doc_str)
    
    # Create query embedding
    query_embedding = (await create_embeddings([request.question]))[0]
    
    # Find relevant chunks
    similarities = []
    for i, chunk_emb in enumerate(doc_data["embeddings"]):
        sim = cosine_similarity(query_embedding, chunk_emb)
        similarities.append({
            "index": i,
            "similarity": sim,
            "chunk": doc_data["chunks"][i]
        })
    
    # Sort by similarity
    similarities.sort(key=lambda x: x["similarity"], reverse=True)
    top_chunks = similarities[:3]  # Top 3 most relevant
    
    # Build context
    context = "\n\n---\n\n".join([
        f"[Chunk {c['index'] + 1}]: {c['chunk']['text']}"
        for c in top_chunks
    ])
    
    # Generate answer using A4F
    try:
        response = client.chat.completions.create(
            model="provider-2/kimi-k2-thinking-tee",
            messages=[
                {
                    "role": "system",
                    "content": """ You are an AI assistant helping with document analysis for UPSC CSE preparation.
                    Answer questions based ONLY on the provided context from the document.
                    If the answer is not in the context, say so clearly.
                    Provide concise, accurate answers with references to specific parts of the document."""
                },
                {
                    "role": "user",
                    "content": f"""Context from document:\n{context}\n\nQuestion: {request.question}"""
                }
            ],
            temperature=0.3
        )
        
        answer = response.choices[0].message.content
        
    except Exception as e:
        print(f"LLM error: {e}")
        answer = "I apologize, but I encountered an error processing your question."
    
    # Calculate confidence
    avg_similarity = sum(c["similarity"] for c in top_chunks) / len(top_chunks)
    
    return ChatResponse(
        answer=answer,
        sources=[{
            "chunk_index": c["index"],
            "similarity": c["similarity"],
            "text_preview": c["chunk"]["text"][:200]
        } for c in top_chunks],
        confidence=float(avg_similarity),
        session_id=request.session_id or hashlib.md5(f"{datetime.now()}".encode()).hexdigest()[:8]
    )

@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "service": "autodoc-thinker",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8031)
