"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type GenerationMode,
  type GenerationSettings,
  type HistoryItem,
  type JobStatus,
  ASPECT_LABELS,
  CAMERA_LABELS,
  DURATION_LABELS,
  QUALITY_LABELS,
  STYLE_LABELS,
} from "@/lib/types";
import { EXAMPLE_PROMPTS, randomPrompt } from "@/lib/prompts";
import {
  cancelJob,
  getBackendStatus,
  getStatus,
  startGeneration,
  videoStreamUrl,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { SettingsPanel } from "./SettingsPanel";
import { ResultPanel } from "./ResultPanel";

const MODES: { value: GenerationMode; label: string; icon: string; hint: string }[] = [
  { value: "text", label: "Text to Video", icon: "✍️", hint: "Describe a scene" },
  { value: "image", label: "Image to Video", icon: "🖼️", hint: "Animate a photo" },
  { value: "video", label: "Video to Video", icon: "🎞️", hint: "Restyle footage" },
];

const HISTORY_KEY = "visionai_history_v1";

const DEFAULT_SETTINGS: GenerationSettings = {
  duration: "5",
  aspectRatio: "16:9",
  style: "cinematic",
  camera: "static",
  quality: "1080p",
};

export function GeneratorWorkspace() {
  const [mode, setMode] = useState<GenerationMode>("text");
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState("");
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [status, setStatus] = useState<JobStatus | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);

  const [backend, setBackend] = useState<{
    ok: boolean;
    engine?: string;
    message?: string;
  } | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const jobIdRef = useRef<string | null>(null);
  const pollRef = useRef<number | null>(null);

  // load history
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    try {
      const seed = localStorage.getItem("visionai_seed_prompt");
      if (seed) {
        setPrompt(seed);
        localStorage.removeItem("visionai_seed_prompt");
      }
    } catch {
      /* ignore */
    }
  }, []);

  // backend status
  useEffect(() => {
    getBackendStatus().then(setBackend);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      pollRef.current = window.setInterval(async () => {
        try {
          const s = await getStatus(id);
          setStatus(s);
          if (s.status === "completed") {
            stopPolling();
            setGenerating(false);
            const item: HistoryItem = {
              jobId: s.jobId,
              prompt: s.prompt,
              negativePrompt: s.negativePrompt,
              settings: s.settings,
              mode: s.mode,
              videoUrl: videoStreamUrl(s.jobId),
              createdAt: s.updatedAt,
            };
            setHistory((prev) => {
              const next = [item, ...prev.filter((p) => p.jobId !== s.jobId)].slice(0, 12);
              try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
              } catch {
                /* ignore */
              }
              return next;
            });
          } else if (s.status === "failed" || s.status === "cancelled") {
            stopPolling();
            setGenerating(false);
            if (s.status === "failed") {
              setError(s.error ?? "Generation failed. Please try again.");
            }
          }
        } catch {
          /* transient network error — keep polling */
        }
      }, 1200);
    },
    [stopPolling],
  );

  const handleGenerate = useCallback(async () => {
    setError(null);
    if (!prompt.trim()) {
      setError("Please describe the video you want to create.");
      return;
    }
    if (mode === "image" && !imageFile) {
      setError("Upload an image to use Image to Video.");
      return;
    }
    if (mode === "video" && !videoFile) {
      setError("Upload a video to use Video to Video.");
      return;
    }

    setGenerating(true);
    setStatus(null);

    try {
      const payload = {
        prompt: prompt.trim(),
        negativePrompt: negative.trim() || undefined,
        mode,
        seed: Math.floor(Math.random() * 1_000_000_000),
        ...settings,
      };
      const files =
        mode === "image"
          ? { image: imageFile! }
          : mode === "video"
            ? { video: videoFile! }
            : {};
      const { jobId } = await startGeneration(mode, payload, files);
      jobIdRef.current = jobId;
      setStatus({
        jobId,
        mode,
        prompt: payload.prompt,
        negativePrompt: payload.negativePrompt,
        settings,
        status: "queued",
        progress: 0,
        stage: "Queued",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      startPolling(jobId);
    } catch (e) {
      setGenerating(false);
      setError(
        e instanceof Error
          ? e.message
          : "Could not reach the AI backend. Start it with `docker compose up ai`.",
      );
      getBackendStatus().then(setBackend);
    }
  }, [prompt, negative, mode, settings, imageFile, videoFile, startPolling]);

  const handleCancel = useCallback(async () => {
    if (!jobIdRef.current) return;
    try {
      await cancelJob(jobIdRef.current);
    } catch {
      /* ignore */
    }
    stopPolling();
    setStatus((s) => (s ? { ...s, status: "cancelled" } : s));
    setGenerating(false);
  }, [stopPolling]);

  const handleEnhance = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Write a prompt first so the AI can enhance it.");
      return;
    }
    setEnhancing(true);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, settings }),
      });
      const data = await res.json();
      if (data?.enhanced) setPrompt(data.enhanced);
    } catch {
      /* ignore */
    } finally {
      setEnhancing(false);
    }
  }, [prompt, settings]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setVideoFile(f);
  };

  const selectHistory = (h: HistoryItem) => {
    const s: JobStatus = {
      jobId: h.jobId,
      mode: h.mode,
      prompt: h.prompt,
      negativePrompt: h.negativePrompt,
      settings: h.settings,
      status: "completed",
      progress: 100,
      createdAt: h.createdAt,
      updatedAt: h.createdAt,
      videoUrl: h.videoUrl,
    };
    jobIdRef.current = h.jobId;
    setStatus(s);
    setPrompt(h.prompt);
    setNegative(h.negativePrompt ?? "");
    setSettings(h.settings);
    setMode(h.mode);
  };

  const summary = `${DURATION_LABELS[settings.duration]} · ${ASPECT_LABELS[settings.aspectRatio]} · ${STYLE_LABELS[settings.style]} · ${CAMERA_LABELS[settings.camera]} · ${QUALITY_LABELS[settings.quality]}`;

  return (
    <div className="space-y-6">
      {/* Backend status pill */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span
            className={cn(
              "relative flex h-2.5 w-2.5",
            )}
          >
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                backend?.ok ? "bg-emerald-400 animate-ping" : "bg-rose-500",
              )}
            />
            <span
              className={cn(
                "relative inline-flex h-2.5 w-2.5 rounded-full",
                backend?.ok ? "bg-emerald-400" : "bg-rose-500",
              )}
            />
          </span>
          {backend?.ok
            ? `AI Engine online · ${backend.engine ?? "ready"}`
            : "AI Engine offline — run `docker compose up ai`"}
        </div>
        <span className="hidden text-xs text-muted sm:block">{summary}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left: editor */}
        <div className="glass gradient-border rounded-2xl p-5 sm:p-6">
          {/* Mode tabs */}
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition-all",
                  mode === m.value
                    ? "border-violet-500/60 bg-violet-500/10"
                    : "border-line bg-white/[0.02] hover:border-violet-500/30",
                )}
              >
                <div className="text-lg">{m.icon}</div>
                <div className="mt-1 text-xs font-semibold text-white">{m.label}</div>
                <div className="text-[0.65rem] text-muted">{m.hint}</div>
              </button>
            ))}
          </div>

          {/* Prompt */}
          <div className="mt-5">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Describe the video you want to create. Example: A cinematic drone shot flying over a futuristic city at sunset, ultra realistic, 4K."
              className="input resize-none"
            />
          </div>

          {/* Controls row */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={handleEnhance}
              disabled={enhancing}
              className="btn-ghost text-xs"
              title="Use AI to expand and improve your prompt"
            >
              {enhancing ? "Enhancing…" : "✨ Enhance"}
            </button>
            <button
              onClick={() => setPrompt(randomPrompt(mode))}
              className="btn-ghost text-xs"
            >
              🎲 Random
            </button>
            <button
              onClick={() => {
                setPrompt("");
                setNegative("");
              }}
              className="btn-ghost text-xs"
            >
              🧹 Clear
            </button>
          </div>

          {/* Negative prompt */}
          <div className="mt-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
              Negative Prompt <span className="text-muted/60">(optional)</span>
            </label>
            <input
              value={negative}
              onChange={(e) => setNegative(e.target.value)}
              placeholder="blurry, low quality, distorted, watermark"
              className="input"
            />
          </div>

          {/* Uploads */}
          {mode === "image" && (
            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                Source Image
              </label>
              <div className="flex items-center gap-4">
                <label className="grid h-24 w-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-white/[0.02] hover:border-violet-500/50">
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-center text-2xl text-muted">＋</span>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                <div className="text-xs text-muted">
                  <p>Upload a JPG or PNG (max 15MB).</p>
                  <p className="mt-1">The AI will animate your image based on the prompt & camera movement.</p>
                  {imageFile && (
                    <button
                      onClick={() => {
                        setImageFile(null);
                        if (imagePreview) URL.revokeObjectURL(imagePreview);
                        setImagePreview(null);
                      }}
                      className="mt-2 text-rose-300 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {mode === "video" && (
            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                Source Video
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-white/[0.02] px-4 py-4 hover:border-violet-500/50">
                <span className="text-2xl">🎞️</span>
                <span className="text-xs text-muted">
                  {videoFile ? videoFile.name : "Upload an MP4 or WebM (max 50MB) to restyle"}
                </span>
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
              </label>
            </div>
          )}

          {/* Example prompts */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Try an example
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.slice(0, 5).map((p) => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className="chip text-left text-[0.72rem] leading-snug"
                  style={{ maxWidth: "100%" }}
                >
                  {p.length > 52 ? p.slice(0, 52) + "…" : p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: settings */}
        <div className="space-y-4">
          <div className="glass gradient-border rounded-2xl p-5">
            <h3 className="mb-4 font-display text-base font-semibold">Generation Settings</h3>
            <SettingsPanel settings={settings} onChange={setSettings} disabled={generating} />
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-gradient mt-6 w-full py-3 text-base"
            >
              {generating ? "Generating…" : "🚀 Generate Video"}
            </button>
          </div>
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      <div className="glass gradient-border rounded-2xl p-5 sm:p-6">
        <h3 className="mb-4 font-display text-base font-semibold">Preview & Output</h3>
        <ResultPanel
          status={status}
          generating={generating}
          onCancel={handleCancel}
          onCopyPrompt={() => status?.prompt && navigator.clipboard.writeText(status.prompt)}
          onRegenerate={handleGenerate}
          history={history}
          onSelectHistory={selectHistory}
        />
      </div>
    </div>
  );
}
