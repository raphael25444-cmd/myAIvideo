"""Engine registry — picks the right generation engine for a request."""
from __future__ import annotations

from engines.base import BaseEngine
from engines.procedural import ProceduralEngine
from config import settings

_engine_cache: dict[str, BaseEngine] = {}


def get_engine(mode: str) -> BaseEngine:
    """Return an engine that supports `mode`, falling back to the procedural
    renderer when the configured engine cannot handle the request."""
    preferred = (settings.engine or "procedural").lower()

    if preferred == "diffusers":
        try:
            from engines.diffusers_engine import DiffusersEngine

            eng = _engine_cache.get("diffusers")
            if eng is None:
                eng = DiffusersEngine(settings)
                _engine_cache["diffusers"] = eng
            if eng.supports(mode):
                return eng
        except Exception:  # fall through to procedural
            pass

    proc = _engine_cache.get("procedural")
    if proc is None:
        proc = ProceduralEngine()
        _engine_cache["procedural"] = proc
    return proc
