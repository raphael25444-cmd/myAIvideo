# VISIONAI AI engine image
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# ffmpeg is required for encoding (text/image -> video) and restyling (video -> video)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ai/requirements.txt /app/requirements.txt
RUN pip install -r requirements.txt

COPY ai/ /app/

# Persistent storage volume is mounted at /app/storage (see docker-compose.yml)
RUN mkdir -p /app/storage/jobs /app/storage/tmp

EXPOSE 8000

# For GPU acceleration, build from an nvidia/cuda base image and install the
# CUDA build of torch, then run the container with `docker run --gpus all`.
# The engine auto-detects CUDA/MPS at runtime via VISIONAI_DEVICE=auto.
CMD ["python", "main.py"]
