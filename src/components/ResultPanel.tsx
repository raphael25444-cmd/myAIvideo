"use client";

import { useState } from "react";
import type { HistoryItem, JobStatus } from "@/lib/types";
import { videoStreamUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

function StageSteps({ stage }: { stage?: string }) {
  const steps = ["Queued", "Loading model", "Rendering frames", "Encoding video", "Done"];
  const active = stage ? steps.indexOf(stage) : 0;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {steps.map((s, i) => (
        <span
          key={s}
          className={cn(
            "rounded-full px-2.5 py-1 text-[0.65rem]",
            i <= active ? "bg-violet-500/20 text-violet-200" : "bg-white/5 text-muted",
          )}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

export function ResultPanel({
  status,
  generating,
  onCancel,
  onCopyPrompt,
  onRegenerate,
  history,
  onSelectHistory,
}: {
  status: JobStatus | null;
  generating: boolean;
  onCancel: () => void;
  onCopyPrompt: () => void;
  onRegenerate: () => void;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!status?.prompt) return;
    try {
      await navigator.clipboard.writeText(status.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const done = status?.status === "completed";
  const failed = status?.status === "failed";
  const cancelled = status?.status === "cancelled";

  return (
    <div className="flex flex-col gap-5">
      <div className="video-frame aspect-video">
        {done && status.videoUrl ? (
          <video
            key={status.videoUrl}
            className="h-full w-full bg-black"
            src={status.videoUrl}
            controls
            playsInline
            autoPlay
            muted
            loop
          />
        ) : (
          <div className="relative grid h-full w-full place-items-center overflow-hidden">
            <div className="aurora-blob h-64 w-64 gradient-animated" />
            <div className="absolute inset-0 grid-bg opacity-40" />
            <div className="relative z-10 text-center px-6">
              {!status && !generating && (
                <>
                  <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl glass-strong text-3xl">
                    🎬
                  </div>
                  <p className="text-sm text-muted">
                    Your generated video will appear here.
                  </p>
                </>
              )}
              {generating && status && (
                <>
                  <div className="relative mx-auto mb-5 grid h-20 w-20 place-items-center">
                    <span className="absolute inset-0 rounded-full gradient-animated pulse-ring" />
                    <span className="relative grid h-14 w-14 place-items-center rounded-full glass-strong text-2xl">
                      ✨
                    </span>
                  </div>
                  <p className="font-display text-lg font-semibold">
                    {status.stage ?? "Generating your video…"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Real AI rendering in progress. Please keep this tab open.
                  </p>
                  <div className="mx-auto mt-4 max-w-xs">
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.max(3, status.progress)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs tabular-nums text-muted">
                      {Math.round(status.progress)}% · {status.engine ?? "engine"}
                    </p>
                  </div>
                  <StageSteps stage={status.stage} />
                  <button onClick={onCancel} className="btn-ghost mt-5 text-xs">
                    Cancel job
                  </button>
                </>
              )}
              {failed && (
                <div className="max-w-sm">
                  <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl glass-strong text-2xl">
                    ⚠️
                  </div>
                  <p className="font-semibold text-rose-300">Generation failed</p>
                  <p className="mt-1 text-xs text-muted">
                    {status.error ?? "The backend could not complete this request."}
                  </p>
                </div>
              )}
              {cancelled && (
                <p className="text-sm text-muted">Job cancelled.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {done && status && (
        <div className="animate-fade-up space-y-4">
          <div className="glass rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Prompt
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">{status.prompt}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={status.videoUrl}
              download={`visionai-${status.jobId}.mp4`}
              className="btn-gradient flex-1"
            >
              ⬇ Download MP4
            </a>
            <button onClick={copy} className="btn-ghost">
              {copied ? "✓ Copied" : "Copy prompt"}
            </button>
            <button onClick={onRegenerate} className="btn-ghost">
              ↻ Another version
            </button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Your recent videos</h3>
            <span className="text-xs text-muted">Stored locally</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {history.map((h) => (
              <button
                key={h.jobId}
                onClick={() => onSelectHistory(h)}
                className="group relative aspect-video overflow-hidden rounded-xl border border-line card-hover"
                title={h.prompt}
              >
                <video
                  className="h-full w-full object-cover"
                  src={h.videoUrl}
                  muted
                  playsInline
                  preload="metadata"
                />
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-left text-[0.65rem] text-white/90">
                  {h.prompt}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
