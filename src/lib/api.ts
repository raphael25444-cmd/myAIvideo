import type {
  GeneratePayload,
  GenerationMode,
  JobStatus,
} from "./types";

const BASE = "/api";

export function videoStreamUrl(jobId: string): string {
  return `${BASE}/video/${jobId}`;
}

export function thumbnailUrl(jobId: string): string {
  return `${BASE}/video/${jobId}?thumb=1`;
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function startGeneration(
  mode: GenerationMode,
  payload: GeneratePayload,
  files?: { image?: File; video?: File },
): Promise<{ jobId: string }> {
  const form = new FormData();
  form.append("mode", mode);
  form.append("payload", JSON.stringify(payload));
  if (files?.image) form.append("image", files.image);
  if (files?.video) form.append("video", files.video);

  const res = await fetch(`${BASE}/generate/${mode}-to-video`, {
    method: "POST",
    body: form,
  });
  return parse<{ jobId: string }>(res);
}

export async function getStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${BASE}/status/${jobId}`);
  return parse<JobStatus>(res);
}

export async function cancelJob(jobId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${BASE}/jobs/${jobId}`, { method: "DELETE" });
  return parse<{ ok: boolean }>(res);
}

export async function getBackendStatus(): Promise<{
  ok: boolean;
  engine?: string;
  mode?: string;
  message?: string;
}> {
  try {
    const res = await fetch(`${BASE}/backend-status`, { cache: "no-store" });
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}
