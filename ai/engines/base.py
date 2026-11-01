"""Base class for all VISIONAI generation engines."""
from __future__ import annotations

import abc
from typing import Callable, Optional

from jobs import Job

ProgressCb = Callable[[float, Optional[str]], None]


class BaseEngine(abc.ABC):
    name: str = "base"
    description: str = ""

    def supports(self, mode: str) -> bool:
        return mode in {"text", "image", "video"}

    @abc.abstractmethod
    def generate(
        self,
        job: Job,
        params: dict,
        files: dict,
        progress: ProgressCb,
        cancel: "threading.Event",  # type: ignore[name-defined]
    ) -> str:
        """Run generation. Return the output mp4 path. Raise on failure."""
        ...
