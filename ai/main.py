"""VISIONAI — Python AI video generation backend (FastAPI).

Run with:  uvicorn main:app --host 0.0.0.0 --port 8000
Or via:    docker compose up ai

Endpoints:
  POST /api/generate                 start a job (text | image | video)
  GET  /api/status/{job_id}         poll job progress
  GET  /api/video/{job_id}          stream the generated MP4
  DELETE /api/jobs/{job_id}          cancel / delete a job
  GET  /api/health                  health check
"""
from __future__ import annotations

import json
import os
import threading
import time
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

import config
from jobs import JobState, store
from engine import get_engine

app = FastAPI(title="VISIONAI Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.settings.cors_allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------
VALID = {
    "duration": {"5", "10", "15"},
    "aspectRatio": {"16:9", "9:16", "1:1"},
    "style": {
        "realistic", "cinematic", "anime", "3d",
        "fantasy", "scifi", "documentary", "commercial",
    },
    "camera": {
        "zoom_in", "zoom_out", "pan", "tracking", "drone", "static",
    },
    "quality": {"720p", "1080p", "4k"},
}


def _clean_payload(raw: dict) -> dict:
    out = {}
    out["duration"] = str(raw.get("duration", "5"))
    out["aspectRatio"] = str(raw.get("aspectRatio", "16:9"))
    out["style"] = str(raw.get("style", "cinematic"))
    out["camera"] = str(raw.get("camera", "static"))
    out["quality"] = str(raw.get("quality", "1080p"))
    out["seed"] = int(raw.get("seed", 0) or 0)
    for k, allowed in VALID.items():
        if out[k] not in allowed:
            out[k] = next(iter(allowed))
    return out


# ---------------------------------------------------------------------------
# Rate limiting (simple per-IP fixed window)
# ---------------------------------------------------------------------------
_RATE = {}
_RATE_LOCK = threading.Lock()


def _rate_ok(ip: str) -> bool:
    limit = config.settings.rate_limit_per_minute
    now = time.time()
    with _RATE_LOCK:
        hits = _RATE.get(ip, [])
        hits = [t for t in hits if now - t < 60]
        if len(hits) >= limit:
            _RATE[ip] = hits
            return False
        hits.append(now)
        _RATE[ip] = hits
        return True


# ---------------------------------------------------------------------------
# Upload handling
# ---------------------------------------------------------------------------
def _save_upload(upload: UploadFile, max_mb: int, allowed: tuple[str, ...]) -> str:
    ext = os.path.splitext(upload.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Allowed: {allowed}")
    tmp_dir = os.path.join(config.settings.storage_dir, "tmp")
    os.makedirs(tmp_dir, exist_ok=True)
    path = os.path.join(tmp_dir, f"up_{os.urandom(6).hex()}{ext}")
    max_bytes = max_mb * 1024 * 1024
    written = 0
    with open(path, "wb") as f:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            written += len(chunk)
            if written > max_bytes:
                f.close()
                os.remove(path)
                raise HTTPException(413, f"File too large (max {max_mb}MB).")
            f.write(chunk)
    return path


# ---------------------------------------------------------------------------
# Job runner
# ---------------------------------------------------------------------------
def _serialize(job) -> dict:
    return {
        "jobId": job.job_id,
        "mode": job.mode,
        "prompt": job.prompt,
        "negativePrompt": job.negative_prompt,
        "settings": job.settings,
        "status": job.state.value,
        "progress": round(job.progress, 1),
        "stage": job.stage,
        "message": job.message,
        "engine": job.engine,
        "error": job.error,
        "createdAt": datetime.fromtimestamp(job.created_at, tz=timezone.utc).isoformat(),
        "updatedAt": datetime.fromtimestamp(job.updated_at, tz=timezone.utc).isoformat(),
        "videoUrl": f"/api/video/{job.job_id}" if job.output_path and os.path.exists(job.output_path) else None,
    }


def _run_job(job, params: dict, files: dict) -> None:
    engine = get_engine(job.mode)
    job.engine = engine.name

    def progress(pct: float, stage: Optional[str] = None) -> None:
        upd = {"progress": max(0.0, min(100.0, pct))}
        if stage:
            upd["stage"] = stage
        store.update(job, **upd)

    try:
        store.update(job, state=JobState.PROCESSING, stage="Loading model", progress=2)
        out = engine.generate(job, params, files, progress, job.cancel_event)
        if job.cancel_event.is_set():
            store.update(job, state=JobState.CANCELLED, stage="Cancelled", progress=0)
            if out and os.path.exists(out):
                os.remove(out)
            return
        store.update(
            job,
            state=JobState.COMPLETED,
            output_path=out,
            progress=100,
            stage="Done",
        )
    except InterruptedError:
        store.update(job, state=JobState.CANCELLED, stage="Cancelled", progress=0)
    except Exception as e:  # noqa: BLE001
        store.update(job, state=JobState.FAILED, error=str(e)[:500], stage="Failed")
    finally:
        # remove uploaded source files (frames are cleaned inside engines)
        for p in files.values():
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                except OSError:
                    pass


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    try:
        device = config.settings.resolve_device()
    except Exception:
        device = "cpu"
    return {
        "ok": True,
        "engine": config.settings.engine,
        "mode": "real",
        "device": device,
        "version": "1.0.0",
        "storage": config.settings.storage_dir,
    }


@app.post("/api/generate")
async def generate(
    request: Request,
    mode: str = Form("text"),
    payload: str = Form("{}"),
    image: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None),
):
    client_ip = request.client.host if request.client else "unknown"
    if not _rate_ok(client_ip):
        raise HTTPException(429, "Rate limit exceeded. Please slow down.")

    mode = (mode or "text").lower()
    if mode not in {"text", "image", "video"}:
        raise HTTPException(400, "Invalid mode. Use text, image or video.")

    try:
        raw = json.loads(payload or "{}")
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid payload JSON.")

    prompt = str(raw.get("prompt", "")).strip()
    if not prompt:
        raise HTTPException(400, "A prompt is required.")
    if len(prompt) > 1000:
        raise HTTPException(400, "Prompt too long (max 1000 chars).")

    negative = str(raw.get("negativePrompt", "")).strip()[:500]
    params = _clean_payload(raw)

    files: dict[str, Optional[str]] = {}
    try:
        if mode == "image":
            if not image:
                raise HTTPException(400, "Image file is required for image-to-video.")
            files["image"] = _save_upload(image, config.settings.max_image_mb, (".jpg", ".jpeg", ".png", ".webp"))
        elif mode == "video":
            if not video:
                raise HTTPException(400, "Video file is required for video-to-video.")
            files["video"] = _save_upload(video, config.settings.max_video_mb, (".mp4", ".webm", ".mov", ".mkv"))
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        raise HTTPException(400, f"Upload error: {e}")

    job = store.create(mode=mode, prompt=prompt, negative_prompt=negative, settings=params, engine="")
    thread = threading.Thread(target=_run_job, args=(job, params, files), daemon=True)
    thread.start()

    return JSONResponse({"jobId": job.job_id, "status": "queued"})


@app.get("/api/status/{job_id}")
def status(job_id: str):
    job = store.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    return _serialize(job)


@app.get("/api/video/{job_id}")
def video(job_id: str):
    job = store.get(job_id)
    if not job or not job.output_path or not os.path.exists(job.output_path):
        raise HTTPException(404, "Video not ready or not found.")
    if job.state != JobState.COMPLETED:
        raise HTTPException(409, "Video is still being generated.")
    return FileResponse(
        job.output_path,
        media_type="video/mp4",
        filename=f"visionai-{job_id}.mp4",
        headers={
            "Content-Disposition": f'inline; filename="visionai-{job_id}.mp4"',
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-store",
        },
    )


@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: str):
    job = store.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    job.cancel_event.set()
    # give the running thread a moment to notice cancellation
    store.delete(job_id)
    return {"ok": True, "jobId": job_id}


# ---------------------------------------------------------------------------
# Startup / background cleanup
# ---------------------------------------------------------------------------
def _cleanup_loop() -> None:
    while True:
        time.sleep(config.settings.cleanup_interval_seconds)
        try:
            removed = store.cleanup(config.settings.keep_files_hours)
            if config.settings.debug and removed:
                print(f"[cleanup] removed {removed} stale job file sets")
        except Exception:  # noqa: BLE001
            pass


@app.on_event("startup")
def _startup() -> None:
    store.ensure_dirs()
    t = threading.Thread(target=_cleanup_loop, daemon=True)
    t.start()
    print(
        f"VISIONAI engine ready · engine={config.settings.engine} · "
        f"device={config.settings.resolve_device()} · storage={config.settings.storage_dir}"
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=config.settings.host,
        port=config.settings.port,
        reload=config.settings.debug,
    )
