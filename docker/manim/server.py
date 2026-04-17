"""
UPSC Manim Animation Render Server
FastAPI server with dual endpoints:
  POST /render      — raw scene_code + scene_name (from animate route)
  POST /api/render  — prompt + topic + type (from animation-agent)
  GET  /status/{id} — poll job status
  GET  /download/{id} — download rendered file
  GET  /health      — health check
"""

import os
import uuid
import json
import asyncio
import importlib.util
from typing import Optional, Dict, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="UPSC Manim Render Server", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

OUTPUT_DIR = "/manim/output"
SCENES_DIR = "/manim/scenes"
QUALITY = os.getenv("MANIM_QUALITY", "medium_quality")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# In-memory job store
jobs: Dict[str, Dict[str, Any]] = {}

# Scene type → Python class mapping
SCENE_MAP = {
    "timeline": ("timeline_scene", "TimelineScene"),
    "flowchart": ("flowchart_scene", "FlowchartScene"),
    "map": ("map_scene", "MapScene"),
    "comparison": ("comparison_table", "ComparisonTableScene"),
    "pie_chart": ("pie_chart_scene", "PieChartScene"),
    "bar_graph": ("bar_graph_scene", "BarGraphScene"),
    "tree": ("tree_diagram", "TreeDiagramScene"),
    "venn": ("venn_diagram", "VennDiagramScene"),
    "cycle": ("cycle_scene", "CycleScene"),
    "math": ("math_solver", "MathSolverScene"),
    "article": ("article_highlight", "ArticleHighlightScene"),
    "scheme": ("scheme_info_card", "SchemeInfoCardScene"),
    "mind_map": ("mind_map", "MindMapScene"),
    # Aliases
    "concept": ("flowchart_scene", "FlowchartScene"),
    "case_study": ("timeline_scene", "TimelineScene"),
    "diagram": ("flowchart_scene", "FlowchartScene"),
    "process": ("flowchart_scene", "FlowchartScene"),
    "hierarchy": ("tree_diagram", "TreeDiagramScene"),
    "budget": ("pie_chart_scene", "PieChartScene"),
    "statistics": ("bar_graph_scene", "BarGraphScene"),
}


# ── Request / Response Models ────────────────────────────────────

class RenderRequest(BaseModel):
    """Direct render: raw Python scene code"""
    scene_code: str
    scene_name: str
    quality: Optional[str] = None
    format: Optional[str] = "mp4"


class AgentRenderRequest(BaseModel):
    """Agent render: prompt + topic + type → auto-generates scene code"""
    prompt: str
    topic: str
    type: Optional[str] = "concept"


class RenderResponse(BaseModel):
    job_id: str
    status: str
    message: str


# ── Endpoints ────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "manim-render", "version": "2.0.0",
            "scenes_available": list(SCENE_MAP.keys())}


@app.get("/")
async def root():
    return {"service": "UPSC Manim Render Server", "status": "running",
            "endpoints": ["/health", "/render", "/api/render", "/status/{id}", "/download/{id}"]}


@app.post("/render", response_model=RenderResponse)
async def render_direct(req: RenderRequest, bg: BackgroundTasks):
    """Render from raw scene code (used by /api/notes/[id]/animate)"""
    job_id = str(uuid.uuid4())
    quality = req.quality or QUALITY
    jobs[job_id] = {"status": "queued", "scene_name": req.scene_name, "output_path": None}
    bg.add_task(execute_render, job_id, req.scene_code, req.scene_name, quality, req.format or "mp4")
    return RenderResponse(job_id=job_id, status="queued", message=f"Render job {job_id} queued")


@app.post("/api/render", response_model=RenderResponse)
async def render_from_agent(req: AgentRenderRequest, bg: BackgroundTasks):
    """Render from topic + type (used by animation-agent)"""
    scene_type = (req.type or "concept").lower()
    if scene_type not in SCENE_MAP:
        scene_type = "flowchart"  # safe default

    module_name, class_name = SCENE_MAP[scene_type]
    config = {"topic": req.topic, "prompt": req.prompt}

    # Generate scene code that imports our parameterized scene
    scene_code = f"""
import sys
sys.path.insert(0, '{SCENES_DIR}')
from {module_name} import {class_name}
import json

config = json.loads('''{json.dumps(config)}''')

class GeneratedScene({class_name}):
    def __init__(self, **kwargs):
        super().__init__(config=config, **kwargs)
"""

    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "queued", "scene_name": "GeneratedScene", "type": scene_type, "output_path": None}
    bg.add_task(execute_render, job_id, scene_code, "GeneratedScene", QUALITY, "mp4")
    return RenderResponse(job_id=job_id, status="queued", message=f"Agent render job {job_id} queued (type={scene_type})")


@app.get("/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    job = jobs[job_id]
    return {"job_id": job_id, "status": job["status"],
            "scene_name": job.get("scene_name"), "error": job.get("error"),
            "output_available": job.get("output_path") is not None}


@app.get("/download/{job_id}")
async def download(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    job = jobs[job_id]
    if job["status"] != "completed":
        raise HTTPException(400, f"Job status: {job['status']}")
    path = job.get("output_path")
    if not path or not os.path.exists(path):
        raise HTTPException(404, "Output file not found")
    return FileResponse(path, media_type="video/mp4", filename=f"{job['scene_name']}.mp4")


# ── Background Render Logic ──────────────────────────────────────

async def execute_render(job_id: str, scene_code: str, scene_name: str, quality: str, fmt: str):
    try:
        jobs[job_id]["status"] = "rendering"

        scene_file = f"/tmp/manim_scenes/{job_id}_scene.py"
        with open(scene_file, "w") as f:
            f.write(scene_code)

        quality_flag = {
            "low_quality": "-ql",
            "medium_quality": "-qm",
            "high_quality": "-qh",
            "production_quality": "-qk",
        }.get(quality, "-qm")

        cmd = f"manim {quality_flag} --format={fmt} --media_dir {OUTPUT_DIR}/{job_id} {scene_file} {scene_name}"

        process = await asyncio.create_subprocess_shell(
            cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()

        if process.returncode == 0:
            # Find the output file
            output_path = find_output(f"{OUTPUT_DIR}/{job_id}", fmt)
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["output_path"] = output_path
        else:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = stderr.decode()[-500:]  # last 500 chars

        # Cleanup temp
        try:
            os.remove(scene_file)
        except OSError:
            pass

    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)


def find_output(base_dir: str, fmt: str) -> Optional[str]:
    """Walk the manim output tree to find the rendered file."""
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith(f".{fmt}"):
                return os.path.join(root, f)
    return None


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
