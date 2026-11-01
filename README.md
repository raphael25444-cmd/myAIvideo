# VISIONAI — AI Video Generator Platform

**Your Imagination. Powered by AI.**

VISIONAI is a complete, no-login AI video generation platform. Write a prompt
(or upload an image / video), choose your settings, and the platform renders a
real MP4 using a Python AI backend — then lets you preview and download it.
No account, no API key, no setup.

```
OPEN WEBSITE → WRITE PROMPT → GENERATE VIDEO → DOWNLOAD VIDEO
```

---

## ✨ Features

- **No account required** — generate instantly, zero sign-up.
- **Three modes** — Text to Video, Image to Video, Video to Video.
- **Pro prompt editor** — negative prompts, AI prompt enhancer, example &
  random prompts, clear.
- **Full control** — duration (5/10/15s), aspect ratio (16:9 / 9:16 / 1:1),
  visual style (8), camera movement (6), quality (720p / 1080p / 4K).
- **Real Python backend** — FastAPI + PyTorch-ready engine, async jobs,
  ffmpeg video processing, persistent storage with auto-cleanup.
- **Live progress** — honest progress (never fakes 100% before the video is ready).
- **Gallery + local history** — explore styles and replay your own videos.
- **Premium UI** — dark, glassmorphic, responsive (Runway / Kling / Sora vibe).

---

## 🚀 Quick start (AI engine)

The whole generation service starts with a single command:

```bash
docker compose up ai
```

This builds the `ai` image (Python 3 + FastAPI + ffmpeg) and starts the
generation API on **http://localhost:8000**.

### Run the studio (frontend)

From the project root (Next.js App Router):

```bash
npm install
npm run dev          # http://localhost:3000
```

The studio talks to the Python backend through `PYTHON_BACKEND_URL`
(default `http://localhost:8000`). Everything is wired server-side, so no
API keys or CORS configuration is needed by visitors.

### Full stack in Docker (optional)

```bash
docker compose --profile full up
```

This also builds and starts the Next.js studio on **http://localhost:3000**
and connects it to the `ai` service.

---

## 🧠 The AI engine

The backend is **modular**. Two engines ship out of the box:

| Engine | Description | Dependencies |
|--------|-------------|--------------|
| `procedural` (default) | Genuinely *renders* a unique MP4 per prompt using numpy + ffmpeg. Works on CPU, no large model download. | numpy, Pillow, ffmpeg |
| `diffusers` | Loads a real open-source **text-to-image diffusion model**, generates keyframes, and interpolates them into video. | torch, diffusers, accelerate |

Switch engines with an environment variable (see `docker-compose.yml`):

```bash
VISIONAI_ENGINE=diffusers
DIFFUSERS_MODEL=runwayml/stable-diffusion-v1-5   # any SD 1.5 / SDXL repo
VISIONAI_DEVICE=auto                            # auto | cpu | cuda | mps
```

Install the optional dependencies to enable it:

```bash
pip install torch diffusers accelerate safetensors
```

> **Adding a new model** is as simple as creating a new class in
> `ai/engines/` that extends `BaseEngine` and implements `generate(...)`.
> The registry in `ai/engine.py` picks it up.

### GPU acceleration

The engine auto-detects CUDA / Apple MPS at runtime. For full GPU support,
build the image from an `nvidia/cuda` base and install the CUDA build of
PyTorch, then run with `docker run --gpus all`. CPU fallback works out of the box.

---

## 🔌 API reference

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/generate` | Start a job. `multipart/form-data`: `mode`, `payload` (JSON), optional `image` / `video`. |
| `GET`  | `/api/status/{job_id}` | Poll progress (`queued → processing → completed`). |
| `GET`  | `/api/video/{job_id}` | Stream the generated MP4 (range/seek supported). |
| `DELETE` | `/api/jobs/{job_id}` | Cancel & delete a job. |
| `GET`  | `/api/health` | Health check (`{ ok: true, engine, device }`). |

The Next.js studio proxies these via its own `/api/*` routes so secrets and
provider config stay server-side.

---

## 🛡️ Security & performance

- No visitor API keys; all provider config is server-side.
- Uploads validated by type **and** size (`MAX_IMAGE_MB`, `MAX_VIDEO_MB`).
- Per-IP rate limiting (`RATE_LIMIT_PER_MINUTE`).
- Generated files auto-cleaned after `KEEP_FILES_HOURS`.
- Asynchronous jobs so long renders never block HTTP requests.
- Clear error messages for offline backend, cancelled jobs, and failures.

---

## 📁 Project structure

```
.
├── docker-compose.yml          # `docker compose up ai`
├── Dockerfile                  # optional Next.js studio image
├── ai/                        # Python AI backend
│   ├── main.py                # FastAPI app + endpoints
│   ├── config.py              # env-driven configuration
│   ├── jobs.py                # job registry + storage + cleanup
│   ├── engine.py              # engine registry / selection
│   ├── requirements.txt
│   ├── Dockerfile
│   └── engines/
│       ├── base.py            # BaseEngine interface
│       ├── procedural.py      # default real renderer
│       └── diffusers_engine.py# optional real diffusion model
└── src/                       # Next.js studio (App Router)
    ├── app/                   # pages + API proxy routes
    ├── components/            # UI (generator, settings, player, ...)
    └── lib/                   # types, api, prompts, utils
```

---

## 📄 Pages

Home / AI Generator · Explore · How It Works · About · Privacy · Terms
(No login or registration pages by design.)

---

Made with Next.js, FastAPI, PyTorch & ffmpeg.
