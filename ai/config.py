"""VISIONAI backend configuration (env-driven, no secrets required)."""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def _bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _int(value: str | None, default: int) -> int:
    try:
        return int(value) if value else default
    except ValueError:
        return default


@dataclass
class Settings:
    # Engine selection: "procedural" (default, real renderer, no heavy deps)
    # or "diffusers" (loads a real open-source diffusion model).
    engine: str = field(default_factory=lambda: os.getenv("VISIONAI_ENGINE", "procedural"))

    host: str = field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    port: int = field(default_factory=lambda: _int(os.getenv("PORT"), 8000))

    storage_dir: str = field(default_factory=lambda: os.getenv("STORAGE_DIR", "./storage"))
    keep_files_hours: int = field(default_factory=lambda: _int(os.getenv("KEEP_FILES_HOURS"), 24))
    cleanup_interval_seconds: int = field(default_factory=lambda: _int(os.getenv("CLEANUP_INTERVAL"), 300))

    max_image_mb: int = field(default_factory=lambda: _int(os.getenv("MAX_IMAGE_MB"), 15))
    max_video_mb: int = field(default_factory=lambda: _int(os.getenv("MAX_VIDEO_MB"), 50))

    # Simple per-IP rate limiting.
    rate_limit_per_minute: int = field(default_factory=lambda: _int(os.getenv("RATE_LIMIT_PER_MINUTE"), 20))

    # Device for ML engines: auto | cpu | cuda | mps
    device: str = field(default_factory=lambda: os.getenv("VISIONAI_DEVICE", "auto"))

    # Diffusers engine settings.
    diffusers_model: str = field(
        default_factory=lambda: os.getenv("DIFFUSERS_MODEL", "runwayml/stable-diffusion-v1-5")
    )
    torch_dtype: str = field(default_factory=lambda: os.getenv("TORCH_DTYPE", "auto"))

    # CORS — by default permissive for local/dev usage behind the Next.js proxy.
    cors_allow_origins: list[str] = field(
        default_factory=lambda: [
            o.strip()
            for o in os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")
            if o.strip()
        ]
    )

    debug: bool = field(default_factory=lambda: _bool(os.getenv("DEBUG"), False))

    def resolve_device(self) -> str:
        if self.device in {"cpu", "cuda", "mps"}:
            return self.device
        # auto -> prefer cuda, then mps, then cpu
        try:
            import torch  # noqa: F401

            if hasattr(torch, "cuda") and torch.cuda.is_available():
                return "cuda"
            if hasattr(torch, "backends") and getattr(torch.backends, "mps", None) is not None:
                try:
                    if torch.backends.mps.is_available():
                        return "mps"
                except Exception:
                    pass
        except Exception:
            pass
        return "cpu"


settings = Settings()
