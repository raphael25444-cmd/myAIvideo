"""Optional real diffusion engine (plugged in via VISIONAI_ENGINE=diffusers).

Uses Hugging Face `diffusers` + `torch` to generate actual AI keyframes from
the prompt and interpolates them into a smooth, clearly-animated video.

    pip install torch diffusers accelerate imageio imageio-ffmpeg

Environment variables:
    VISIONAI_ENGINE=diffusers
    DIFFUSERS_MODEL=runwayml/stable-diffusion-v1-5
    VISIONAI_DEVICE=auto|cpu|cuda|mps
"""
from __future__ import annotations

import math
import os

import numpy as np
from PIL import Image

from jobs import store
from engines.base import BaseEngine, ProgressCb
from media import ffmpeg_path, write_video


class DiffusersEngine(BaseEngine):
    name = "diffusers"
    description = "Real text-to-image diffusion + frame interpolation"

    def __init__(self, config):
        super().__init__()
        self.config = config
        self._pipe = None
        self._img2img = None
        self._device = None

    def supports(self, mode: str) -> bool:
        return mode in {"text", "image"}

    # ------------------------------------------------------------------
    def _load(self, progress: ProgressCb):
        try:
            import torch
            from diffusers import StableDiffusionPipeline, StableDiffusionImg2ImgPipeline
        except Exception as e:  # pragma: no cover
            raise RuntimeError(
                "diffusers/torch not installed. Run `pip install torch diffusers "
                "accelerate` or set VISIONAI_ENGINE=procedural."
            ) from e

        self._device = self.config.resolve_device()
        model = self.config.diffusers_model
        progress(3, f"Loading model {model}")
        pipe = StableDiffusionPipeline.from_pretrained(model, torch_dtype=torch.float32)
        if self._device == "cuda":
            pipe = pipe.to("cuda")
        self._pipe = pipe
        try:
            self._img2img = StableDiffusionImg2ImgPipeline(**pipe.components).to(pipe.device)
        except Exception:
            self._img2img = None

    # ------------------------------------------------------------------
    def generate(self, job, params: dict, files: dict, progress: ProgressCb, cancel) -> str:
        if self._pipe is None:
            self._load(progress)
        style = params.get("style", "cinematic")
        camera = params.get("camera", "static")
        quality = params.get("quality", "1080p")
        aspect = params.get("aspectRatio", "16:9")
        duration = float(params.get("duration", 5))
        seed = int(params.get("seed", 0) or 0)

        import torch

        W, H = self._resolve_resolution(quality, aspect)
        fps = 24
        n = max(2, int(round(fps * duration)))
        keyframes = 4
        crf = {"720p": 23, "1080p": 21, "4k": 19}.get(quality, 21)
        prompt = job.prompt
        neg = job.negative_prompt or "blurry, low quality, distorted, watermark"

        frames = []
        progress(10, "Generating keyframes")
        for k in range(keyframes):
            if cancel.is_set():
                raise InterruptedError("cancelled")
            g = torch.Generator(device="cpu").manual_seed(seed + k * 7)
            if job.mode == "image" and files.get("image"):
                init = Image.open(files["image"]).convert("RGB").resize((W, H))
                out = self._img2img(
                    prompt=prompt, negative_prompt=neg, image=init,
                    strength=0.55, guidance_scale=7.5, num_inference_steps=18, generator=g,
                ).images[0]
            else:
                out = self._pipe(
                    prompt=prompt, negative_prompt=neg,
                    guidance_scale=7.5, num_inference_steps=22, generator=g,
                ).images[0]
            frames.append(np.asarray(out.resize((W, H)).convert("RGB"), dtype=np.float32))
            progress(10 + 55 * (k + 1) / keyframes, "Generating keyframes")

        progress(70, "Interpolating motion")
        out_path = store.output_path_for(job.job_id)
        write_video(
            self._interp_frames(frames, n, camera, cancel, progress),
            out_path, fps, crf,
        )
        progress(100, "Done")
        return out_path

    # ------------------------------------------------------------------
    @staticmethod
    def _resolve_resolution(quality: str, aspect: str):
        base_h = {"720p": 720, "1080p": 1080, "4k": 1080}.get(quality, 768)
        if aspect == "1:1":
            w = h = base_h
        elif aspect == "9:16":
            w = int(round(base_h * 9 / 16 / 8) * 8)
            h = base_h
        else:
            w = int(round(base_h * 16 / 9 / 8) * 8)
            h = base_h
        return max(8, w), max(8, h)

    def _interp_frames(self, frames, n, camera, cancel, progress):
        seg = max(1, n // (len(frames) - 1))
        idx = 0
        for s in range(len(frames) - 1):
            a, b = frames[s], frames[s + 1]
            for j in range(seg):
                if cancel.is_set():
                    raise InterruptedError("cancelled")
                t = j / seg
                blend = a * (1 - t) + b * t
                if camera == "zoom_in":
                    z = 1.0 + 0.05 * t
                elif camera == "zoom_out":
                    z = 1.0 - 0.05 * t
                else:
                    z = 1.0
                if abs(z - 1.0) > 1e-3:
                    blend = self._zoom(blend, z)
                img = np.clip(blend, 0, 255).astype(np.uint8)
                if idx % 6 == 0:
                    progress(70 + 22 * idx / n, "Interpolating motion")
                idx += 1
                yield img
        # pad to exactly n frames
        while idx < n:
            if cancel.is_set():
                raise InterruptedError("cancelled")
            yield np.clip(frames[-1], 0, 255).astype(np.uint8)
            idx += 1

    @staticmethod
    def _zoom(arr: np.ndarray, z: float) -> np.ndarray:
        img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
        w, h = img.size
        img = img.resize((int(w * z), int(h * z)), Image.LANCZOS)
        left = (img.width - w) // 2
        top = (img.height - h) // 2
        return np.asarray(img.crop((left, top, left + w, top + h)), dtype=np.float32)
