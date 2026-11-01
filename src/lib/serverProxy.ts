export const PYTHON_BACKEND_URL = (
  process.env.PYTHON_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export async function backendReachable(): Promise<{
  ok: boolean;
  engine?: string;
  mode?: string;
  message?: string;
}> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(`${PYTHON_BACKEND_URL}/api/health`, {
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return { ok: false, message: `Backend returned ${res.status}` };
    const data = (await res.json()) as Record<string, unknown>;
    return {
      ok: true,
      engine: data.engine as string | undefined,
      mode: data.mode as string | undefined,
      message: data.message as string | undefined,
    };
  } catch {
    return { ok: false, message: "AI backend is not running" };
  }
}

export async function proxyJson(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(`${PYTHON_BACKEND_URL}${path}`, {
    ...init,
    cache: "no-store",
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/json",
    },
  });
}

export async function proxyForm(path: string, form: FormData): Promise<Response> {
  const res = await fetch(`${PYTHON_BACKEND_URL}${path}`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/json",
    },
  });
}

export async function proxyStream(
  path: string,
  range?: string | null,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (range) headers.range = range;
  const res = await fetch(`${PYTHON_BACKEND_URL}${path}`, {
    cache: "no-store",
    headers,
  });
  // 200 (full) or 206 (partial / range request) are both valid video responses.
  const ok = res.status === 200 || res.status === 206;
  if ((!ok || !res.body) && res.status !== 206) {
    return new Response(
      JSON.stringify({ error: "Video not available" }),
      { status: res.status || 404, headers: { "content-type": "application/json" } },
    );
  }
  if (!res.body) {
    return new Response(
      JSON.stringify({ error: "Video not available" }),
      { status: 404, headers: { "content-type": "application/json" } },
    );
  }
  // Forward every header the browser needs to actually play/seek the MP4,
  // including Content-Range (required for 206 partial responses).
  const outHeaders = new Headers();
  for (const h of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "content-disposition",
  ]) {
    const v = res.headers.get(h);
    if (v) outHeaders.set(h, v);
  }
  outHeaders.set("cache-control", "no-store");
  return new Response(res.body, { status: res.status, headers: outHeaders });
}
