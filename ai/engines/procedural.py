"""Procedural real-time video engine.

This engine genuinely *renders* a unique, animated MP4 for every request using
numpy + Pillow and encodes it with a bundled ffmpeg (imageio-ffmpeg). It needs
no multi-GB model download, so it works out of the box on CPU, while the
backend stays modular so a real diffusion model can be plugged in.

Modes:
  - text  : synthesize an animated, camera-moving color scene themed by prompt/style
  - image : apply continuous camera motion (zoom/pan/drone/...) to an uploaded still
  - video : restyle an uploaded clip with ffmpeg color/frame filters
"""
from __future__ import annotations

import hashlib
import math
import os
import shutil
import subprocess
import tempfile

import numpy as np
from PIL import Image

from jobs import store
from engines.base import BaseEngine, ProgressCb
from media import ffmpeg_path, write_video


PALETTES = {
    "realistic": ["#1b2735", "#3a6073", "#cfd9df"],
    "cinematic": ["#0b1026", "#3b2f63", "#f0a500"],
    "anime": ["#ffd1dc", "#ff7eb3", "#7c5cff"],
    "3d": ["#1f3b73", "#46c2cb", "#f9f871"],
    "fantasy": ["#221b3a", "#7b2cbf", "#f6c177"],
    "scifi": ["#040d1a", "#1b6ca8", "#22d3ee"],
    "documentary": ["#2b2b2b", "#6b705c", "#a5a58d"],
    "commercial": ["#101010", "#3d3d3d", "#e8c39e"],
}


def _hex_to_rgb(h: str) -> np.ndarray:
    h = h.lstrip("#")
    return np.array([int(h[i : i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)


def _resolve_resolution(quality: str, aspect: str):
    base_h = {"720p": 720, "1080p": 1080, "4k": 1080}.get(quality, 720)
    if aspect == "1:1":
        w = h = base_h
    elif aspect == "9:16":
        w = int(round(base_h * 9 / 16 / 2) * 2)
        h = base_h
    else:  # 16:9
        w = int(round(base_h * 16 / 9 / 2) * 2)
        h = base_h
    w = min(w, 1920)
    h = min(h, 1080)
    return max(2, w), max(2, h)


def _seed_from(prompt: str, seed: int) -> int:
    h = hashlib.sha256(f"{prompt}:{seed}".encode()).hexdigest()
    return int(h[:16], 16)


class ProceduralEngine(BaseEngine):
    name = "procedural"
    description = "Real-time procedural renderer (numpy + bundled ffmpeg)"

    def supports(self, mode: str) -> bool:
        return mode in {"text", "image", "video"}

    # ------------------------------------------------------------------
    def generate(self, job, params: dict, files: dict, progress: ProgressCb, cancel) -> str:
        mode = job.mode
        if mode == "video" and files.get("video"):
            return self._video_to_video(job, params, files, progress, cancel)
        if mode == "image" and files.get("image"):
            return self._image_to_video(job, params, files, progress, cancel)
        return self._text_to_video(job, params, progress, cancel)

    # ------------------------------------------------------------------
    def _text_to_video(self, job, params, progress, cancel) -> str:
        prompt = job.prompt
        style = params.get("style", "cinematic")
        camera = params.get("camera", "static")
        quality = params.get("quality", "1080p")
        aspect = params.get("aspectRatio", "16:9")
        duration = float(params.get("duration", 5))
        seed = int(params.get("seed", 0) or 0)

        rng = np.random.default_rng(_seed_from(prompt, seed))
        W, H = _resolve_resolution(quality, aspect)
        fps = 24
        n = max(2, int(round(fps * duration)))
        crf = {"720p": 23, "1080p": 21, "4k": 19}.get(quality, 21)

        palette = np.stack([_hex_to_rgb(c) for c in PALETTES.get(style, PALETTES["cinematic"])], axis=0)
        f1 = float(rng.uniform(2.0, 5.0))
        f2 = float(rng.uniform(2.0, 5.0))
        f3 = float(rng.uniform(1.0, 3.0))
        phase0 = float(rng.uniform(0, 6.28))

        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        X = xx / max(1, W - 1) * 2 - 1
        Y = yy / max(1, H - 1) * 2 - 1
        R = np.sqrt(X * X + Y * Y)
        sigma = 0.16 * max(W, H)

        out = store.output_path_for(job.job_id)

        progress(4, "Initializing engine")

        def frame_gen():
            for i in range(n):
                if cancel.is_set():
                    raise InterruptedError("cancelled")
                t = i / max(1, n - 1)
                u, v = self._warp(X, Y, camera, t)
                # strong, clearly visible time evolution
                phase = phase0 + t * 6.0
                P = (
                    np.sin(u * f1 + phase) * 0.5
                    + np.cos(v * f2 - phase * 0.8) * 0.5
                    + 0.5 * np.sin((u + v) * f3 + phase * 1.3)
                )
                pmin = P.min()
                pmax = P.max()
                P = (P - pmin) / (pmax - pmin + 1e-6)
                c0, c1, c2 = palette[0], palette[1], palette[2]
                frame = c0[None, None, :] * (1 - P)[..., None] + c1[None, None, :] * P[..., None]
                # moving light source -> unmistakable motion in every mode
                lx = (0.5 + 0.4 * math.sin(t * math.pi * 0.9 + phase0)) * (W - 1)
                ly = (0.5 + 0.3 * math.cos(t * math.pi * 0.7)) * (H - 1)
                d2 = (xx - lx) ** 2 + (yy - ly) ** 2
                glow = np.exp(-d2 / (2 * sigma * sigma))
                frame = frame + glow[..., None] * c2[None, None, :] * 0.9
                # vignette
                vig = np.clip(1.0 - (R ** 2) * 0.35, 0, 1)
                frame = frame * vig[..., None]
                grain = (rng.random((H, W, 1)).astype(np.float32) - 0.5) * 8.0
                frame = np.clip(frame + grain, 0, 255).astype(np.uint8)
                if i % 4 == 0 or i == n - 1:
                    progress(8 + 84 * (i + 1) / n, "Rendering frames")
                yield frame

        progress(10, "Rendering frames")
        write_video(frame_gen(), out, fps, crf)
        progress(100, "Done")
        return out

    @staticmethod
    def _warp(X, Y, camera, t):
        if camera == "zoom_in":
            s = 1.0 + 0.5 * t
            return X / s, Y / s
        if camera == "zoom_out":
            s = 1.5 - 0.5 * t
            return X / s, Y / s
        if camera == "pan":
            return X + 0.9 * t, Y
        if camera == "tracking":
            return X + 0.6 * t, Y - 0.3 * t
        if camera == "drone":
            a = 0.35 * t
            u = X * (1 + 0.3 * t) + 0.4 * t
            v = Y * (1 + 0.3 * t) - 0.25 * t
            return (
                u * math.cos(a) - v * math.sin(a),
                u * math.sin(a) + v * math.cos(a),
            )
        # static — gentle breathing + slow drift so it is never frozen
        s = 1 + 0.03 * math.sin(t * 6.0)
        return (X / s) - 0.08 * t, (Y / s) + 0.05 * t

    # ------------------------------------------------------------------
    def _image_to_video(self, job, params, files, progress, cancel) -> str:
        camera = params.get("camera", "static")
        quality = params.get("quality", "1080p")
        aspect = params.get("aspectRatio", "16:9")
        duration = float(params.get("duration", 5))
        W, H = _resolve_resolution(quality, aspect)
        fps = 24
        n = max(2, int(round(fps * duration)))
        crf = {"720p": 23, "1080p": 21, "4k": 19}.get(quality, 21)

        img = Image.open(files["image"]).convert("RGB")
        img = self._cover(img, W, H)

        out = store.output_path_for(job.job_id)
        progress(6, "Initializing engine")

        def frame_gen():
            for i in range(n):
                if cancel.is_set():
                    raise InterruptedError("cancelled")
                t = i / max(1, n - 1)
                frame = self._transform_image(img, camera, t)
                bri = 1.0 + 0.05 * math.sin(t * 6.0)
                arr = np.clip(np.asarray(frame, dtype=np.float32) * bri, 0, 255).astype(np.uint8)
                if i % 4 == 0 or i == n - 1:
                    progress(8 + 84 * (i + 1) / n, "Rendering frames")
                yield arr

        progress(10, "Rendering frames")
        write_video(frame_gen(), out, fps, crf)
        progress(100, "Done")
        return out

    @staticmethod
    def _cover(img: Image.Image, W: int, H: int) -> Image.Image:
        iw, ih = img.size
        scale = max(W / iw, H / ih)
        nw, nh = int(round(iw * scale)), int(round(ih * scale))
        img = img.resize((nw, nh), Image.LANCZOS)
        left = (nw - W) // 2
        top = (nh - H) // 2
        return img.crop((left, top, left + W, top + H))

    @staticmethod
    def _transform_image(img: Image.Image, camera: str, t: float) -> Image.Image:
        W, H = img.size
        cx, cy = W / 2, H / 2
        if camera == "zoom_in":
            z = 1.0 + 0.45 * t
            tx = ty = 0.0
        elif camera == "zoom_out":
            z = 1.5 - 0.45 * t
            tx = ty = 0.0
        elif camera == "pan":
            z = 1.12
            tx, ty = -0.28 * t * W, 0.0
        elif camera == "tracking":
            z = 1.14
            tx, ty = -0.2 * t * W, 0.08 * t * H
        elif camera == "drone":
            a = 0.22 * t
            z = 1.0 + 0.22 * t
            tx, ty = -0.14 * t * W, -0.1 * t * H
        else:  # static — slow breathing zoom
            a = 0.0
            z = 1.0 + 0.04 * math.sin(t * 6.0)
            tx = ty = 0.0
        ca, sa = math.cos(a), math.sin(a)
        a1, b1 = z * ca, -z * sa
        d1, e1 = z * sa, z * ca
        c1 = cx - a1 * cx - b1 * cy + tx
        f1 = cy - d1 * cx - e1 * cy + ty
        return img.transform(
            (W, H), Image.AFFINE, (a1, b1, c1, d1, e1, f1), resample=Image.BICUBIC
        )

    # ------------------------------------------------------------------
    def _video_to_video(self, job, params, files, progress, cancel) -> str:
        style = params.get("style", "cinematic")
        quality = params.get("quality", "1080p")
        aspect = params.get("aspectRatio", "16:9")
        W, H = _resolve_resolution(quality, aspect)
        crf = {"720p": 23, "1080p": 21, "4k": 19}.get(quality, 21)
        src = files["video"]
        out = store.output_path_for(job.job_id)
        os.makedirs(os.path.dirname(out), exist_ok=True)

        filters = {
            "realistic": "eq=contrast=1.05:saturation=1.05:gamma=1.0",
            "cinematic": "eq=contrast=1.15:saturation=0.9:gamma=1.1,vignette=PI/5",
            "anime": "hue=s=1.3:sat=1.3",
            "3d": "eq=contrast=1.1:brightness=0.03:saturation=1.2",
            "fantasy": "hue=s=1.2,eq=saturation=1.3",
            "scifi": "hue=H=30,eq=contrast=1.1:saturation=1.3",
            "documentary": "eq=saturation=0.95:contrast=1.02",
            "commercial": "eq=contrast=1.1:saturation=1.15:brightness=0.02,vignette=PI/6",
        }.get(style, "eq=contrast=1.05:saturation=1.05")
        vf = (
            f"{filters},scale={W}:{H}:force_original_aspect_ratio=decrease,"
            f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p"
        )

        cmd = [
            ffmpeg_path(), "-y", "-i", src, "-vf", vf,
            "-c:v", "libx264", "-crf", str(crf), "-preset", "veryfast",
            "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", out,
        ]
        progress(20, "Restyleing video")
        self._run_ffmpeg(cmd, cancel, progress)
        progress(100, "Done")
        return out

    # ------------------------------------------------------------------
    @staticmethod
    def _run_ffmpeg(cmd, cancel, progress) -> None:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            while proc.poll() is None:
                if cancel is not None and cancel.is_set():
                    proc.terminate()
                    raise InterruptedError("cancelled")
                if progress is not None:
                    progress(70, "Encoding video")
        finally:
            pass
        if proc.returncode not in (0, None):
            err = proc.stderr.read().decode("utf-8", "ignore") if proc.stderr else ""
            raise RuntimeError(f"ffmpeg failed: {err[-500:]}")
