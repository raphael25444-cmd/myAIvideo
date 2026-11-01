"""In-memory job registry + on-disk storage for generated videos."""
from __future__ import annotations

import os
import shutil
import threading
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class JobState(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class Job:
    job_id: str
    mode: str
    prompt: str
    negative_prompt: str = ""
    settings: dict = field(default_factory=dict)
    state: JobState = JobState.QUEUED
    progress: float = 0.0
    stage: str = "Queued"
    message: str = ""
    error: str = ""
    engine: str = ""
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    output_path: Optional[str] = None
    cancel_event: "threading.Event" = field(default_factory=threading.Event)


class JobStore:
    def __init__(self, storage_dir: str):
        self.storage_dir = storage_dir
        self._jobs: dict[str, Job] = {}
        self._lock = threading.RLock()

    def ensure_dirs(self) -> None:
        os.makedirs(os.path.join(self.storage_dir, "jobs"), exist_ok=True)
        os.makedirs(os.path.join(self.storage_dir, "tmp"), exist_ok=True)

    def create(
        self,
        mode: str,
        prompt: str,
        negative_prompt: str,
        settings: dict,
        engine: str,
    ) -> Job:
        job_id = uuid.uuid4().hex
        job = Job(
            job_id=job_id,
            mode=mode,
            prompt=prompt,
            negative_prompt=negative_prompt,
            settings=settings,
            engine=engine,
        )
        with self._lock:
            self._jobs[job_id] = job
        return job

    def get(self, job_id: str) -> Optional[Job]:
        with self._lock:
            return self._jobs.get(job_id)

    def update(self, job: Job, **kwargs) -> None:
        with self._lock:
            for k, v in kwargs.items():
                if hasattr(job, k):
                    setattr(job, k, v)
            job.updated_at = time.time()

    def delete(self, job_id: str) -> None:
        with self._lock:
            self._jobs.pop(job_id, None)
        self._delete_files(job_id)

    def _job_dir(self, job_id: str) -> str:
        return os.path.join(self.storage_dir, "jobs", job_id)

    def output_path_for(self, job_id: str) -> str:
        return os.path.join(self._job_dir(job_id), "video.mp4")

    def _delete_files(self, job_id: str) -> None:
        d = self._job_dir(job_id)
        if os.path.isdir(d):
            shutil.rmtree(d, ignore_errors=True)

    def cleanup(self, keep_hours: int) -> int:
        """Remove files for old completed/failed jobs. Returns count removed."""
        now = time.time()
        removed = 0
        with self._lock:
            stale = [
                j
                for j in self._jobs.values()
                if j.state in (JobState.COMPLETED, JobState.FAILED, JobState.CANCELLED)
                and now - j.updated_at > keep_hours * 3600
            ]
        for j in stale:
            self._delete_files(j.job_id)
            with self._lock:
                self._jobs.pop(j.job_id, None)
            removed += 1
        return removed


store = JobStore(os.getenv("STORAGE_DIR", "./storage"))
