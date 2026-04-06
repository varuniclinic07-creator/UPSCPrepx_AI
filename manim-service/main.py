"""
UPSC Manim Animation Service
Renders mathematical and educational animations using Manim Community
"""

import os
import uuid
import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn

app = FastAPI(
    title="UPSC Manim Animation Service",
    description="Renders educational animations for UPSC preparation",
    version="1.0.0"
)

# Configuration
PORT = int(os.getenv("PORT", "8033"))
OUTPUT_DIR = "/app/output"
MANIM_QUALITY = os.getenv("MANIM_QUALITY", "medium_quality")

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)


class AnimationRequest(BaseModel):
    """Request model for animation generation"""
    scene_code: str
    scene_name: str
    quality: Optional[str] = None
    format: Optional[str] = "mp4"


class AnimationResponse(BaseModel):
    """Response model for animation generation"""
    job_id: str
    status: str
    message: str
    output_url: Optional[str] = None


# Job tracking
jobs = {}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "manim-animation",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "UPSC Manim Animation Service",
        "status": "running",
        "endpoints": ["/health", "/render", "/status/{job_id}", "/download/{job_id}"]
    }


@app.post("/render", response_model=AnimationResponse)
async def render_animation(request: AnimationRequest, background_tasks: BackgroundTasks):
    """
    Render a Manim animation from scene code
    """
    job_id = str(uuid.uuid4())
    quality = request.quality or MANIM_QUALITY
    
    jobs[job_id] = {
        "status": "queued",
        "scene_name": request.scene_name,
        "output_path": None
    }
    
    # Execute rendering in background
    background_tasks.add_task(
        execute_render,
        job_id,
        request.scene_code,
        request.scene_name,
        quality,
        request.format
    )
    
    return AnimationResponse(
        job_id=job_id,
        status="queued",
        message=f"Animation job {job_id} queued for rendering"
    )


async def execute_render(job_id: str, scene_code: str, scene_name: str, quality: str, format: str):
    """Execute Manim rendering"""
    try:
        jobs[job_id]["status"] = "rendering"
        
        # Create temporary scene file
        scene_file = f"/tmp/{job_id}_scene.py"
        with open(scene_file, "w") as f:
            f.write(scene_code)
        
        # Build manim command
        output_file = f"{OUTPUT_DIR}/{job_id}"
        cmd = f"manim -ql --format={format} -o {job_id} {scene_file} {scene_name}"
        
        if quality == "high_quality":
            cmd = cmd.replace("-ql", "-qh")
        elif quality == "production_quality":
            cmd = cmd.replace("-ql", "-qk")
        
        # Execute manim
        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode == 0:
            # Find output file
            output_path = f"{OUTPUT_DIR}/{job_id}.{format}"
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["output_path"] = output_path
        else:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = stderr.decode()
            
        # Cleanup temp file
        os.remove(scene_file)
        
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)


@app.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Get status of a rendering job"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "scene_name": job.get("scene_name"),
        "error": job.get("error"),
        "output_available": job.get("output_path") is not None
    }


@app.get("/download/{job_id}")
async def download_animation(job_id: str):
    """Download rendered animation"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail=f"Job status: {job['status']}")
    
    output_path = job.get("output_path")
    if not output_path or not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Output file not found")
    
    return FileResponse(
        output_path,
        media_type="video/mp4",
        filename=f"{job['scene_name']}.mp4"
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
