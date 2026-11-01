"""Media helpers — guaranteed ffmpeg + MP4 writing.

We prefer the ffmpeg binary bundled with `imageio-ffmpeg` so the engine can
always encode video, even when no system ffmpeg is installed. Falls back to a
system `ffmpeg` on PATH when available.
"""
from __future__ import annotations

import os
import shutil
from typing import Iterable, Optional


def ffmpeg_path() -> str:
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    system = shutil.which("ffmpeg")
    if system:
        return system
    raise RuntimeError(
        "ffmpeg unavailable. Install it via apt (`ffmpeg`) or "
        "`pip install imageio-ffmpeg` so the engine can encode video."
    )


def write_video(
    frames: Iterable,
    out_path: str,
    fps: int,
    crf: int,
    on_frame=None,
) -> str:
    """Encode an iterable of uint8 HxWx3 numpy frames into an MP4.

    Streams frames to a bundled ffmpeg process so memory stays bounded.
    """
    import imageio.v2 as imageio

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    writer = imageio.get_writer(
        out_path,
        fps=fps,
        codec="libx264",
        macro_block_size=None,
        ffmpeg_params=[
            "-pix_fmt",
            "yuv420p",
            "-crf",
            str(crf),
            "-preset",
            "veryfast",
            "-movflags",
            "+faststart",
        ],
    )
    try:
        count = 0
        for i, frame in enumerate(frames):
            writer.append_data(frame)
            count += 1
            if on_frame is not None:
                on_frame(i)
        if count == 0:
            raise RuntimeError("No frames were produced for the video.")
    finally:
        writer.close()
    if not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
        raise RuntimeError("ffmpeg produced an empty video file.")
    return out_path
