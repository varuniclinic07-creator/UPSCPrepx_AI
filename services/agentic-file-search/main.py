# ═══════════════════════════════════════════════════════════════
# AGENTIC FILE SEARCH - MAIN APPLICATION
# Dynamic navigation of UPSC materials (NCERTs, books, reports)
# ═══════════════════════════════════════════════════════════════

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
from datetime import datetime
from pathlib import Path
import json
from openai import OpenAI

app = FastAPI(title="Agentic File Search", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# A4F Client (using Gemini for tool calling)
client = OpenAI(
    api_key=os.getenv("A4F_API_KEY"),
    base_url=os.getenv("A4F_BASE_URL", "https://api.a4f.co/v1")
)

# Materials path
MATERIALS_PATH = Path(os.getenv("MATERIALS_PATH", "/materials"))

# Models
class SearchRequest(BaseModel):
    query: str
    subject: Optional[str] = None
    material_type: Optional[str] = None  # ncert, government_report, book

class FileInfo(BaseModel):
    path: str
    name: str
    type: str
    size: int
    relevance_score: float

class SearchResponse(BaseModel):
    query: str
    files_found: List[FileInfo]
    navigation_path: List[str]
    reasoning: str
    confidence: float

# Tools for agent
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "scan_folder",
            "description": "List all files and folders in a directory",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Relative path to scan from materials root"
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "preview_file",
            "description": "Get metadata about a file (name, size, type)",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Relative path to file"
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "grep_search",
            "description": "Search for text content within files",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Text to search for"
                    },
                    "path": {
                        "type": "string",
                        "description": "Path to search in"
                    }
                },
                "required": ["query", "path"]
            }
        }
    }
]

def scan_folder(path: str) -> List[Dict]:
    """Scan folder and return contents"""
    full_path = MATERIALS_PATH / path
    if not full_path.exists():
        return []
    
    result = []
    for item in full_path.iterdir():
        result.append({
            "name": item.name,
            "type": "directory" if item.is_dir() else "file",
            "path": str(item.relative_to(MATERIALS_PATH)),
            "size": item.stat().st_size if item.is_file() else 0
        })
    
    return result

def preview_file(path: str) -> Dict:
    """Get file metadata"""
    full_path = MATERIALS_PATH / path
    if not full_path.exists():
        return {"error": "File not found"}
    
    return {
        "name": full_path.name,
        "size": full_path.stat().st_size,
        "type": full_path.suffix,
        "modified": datetime.fromtimestamp(full_path.stat().st_mtime).isoformat()
    }

def grep_search(query: str, path: str) -> List[Dict]:
    """Search for text in files"""
    # Simplified - in production use ripgrep or proper text search
    return []

# Function execution
FUNCTION_MAP = {
    "scan_folder": scan_folder,
    "preview_file": preview_file,
    "grep_search": grep_search
}

@app.post("/search", response_model=SearchResponse)
async def search_files(request: SearchRequest):
    """Intelligent file search using agentic navigation"""
    
    # Prepare system prompt
    system_prompt = f"""You are an intelligent file navigator for UPSC study materials.  
    You have access to a materials library organized by:
    - Subject (history, polity, geography, etc.)
    - Type (NCERTs, government reports, standard books)
    - Standard (6-12 for NCERTs)
    
    Your task is to help find relevant materials for the query: "{request.query}"
    
    Use the available tools to navigate the file system intelligently:
    1. Start by scanning root folders to understand organization
    2. Navigate into relevant subdirectories
    3. Preview files to check relevance
    4. Return the most relevant files with reasoning
    """
    
    # Start conversation with agent
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Find materials for: {request.query}"}
    ]
    
    navigation_path = []
    max_iterations = 10
    iteration = 0
    
    while iteration < max_iterations:
        try:
            response = client.chat.completions.create(
                model="provider-3/gemini-3-flash-preview",  # Supports function calling
                messages=messages,
                tools=TOOLS,
                tool_choice="auto"
            )
            
            message = response.choices[0].message
            messages.append(message.model_dump())
            
            # Check if agent wants to use tools
            if message.tool_calls:
                for tool_call in message.tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)
                    
                    # Execute function
                    function_response = FUNCTION_MAP[function_name](**function_args)
                    navigation_path.append(f"{function_name}: {function_args}")
                    
                    # Add function response to messages
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(function_response)
                    })
                
                iteration += 1
            else:
                # Agent finished, no more tool calls
                break
                
        except Exception as e:
            print(f"Agent error: {e}")
            break
    
    # Extract final answer
    final_answer = messages[-1]["content"] if messages[-1]["role"] == "assistant" else "No files found"
    
    # Parse files from navigation (simplified)
    files_found = []
    
    return SearchResponse(
        query=request.query,
        files_found=files_found,
        navigation_path=navigation_path,
        reasoning=final_answer,
        confidence=0.8
    )

@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "service": "agentic-file-search",
        "materials_path": str(MATERIALS_PATH),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8032)
