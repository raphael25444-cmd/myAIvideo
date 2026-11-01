"use client";

import {
  ASPECT_RATIOS,
  CAMERA_MOVEMENTS,
  DURATIONS,
  QUALITIES,
  VISUAL_STYLES,
  type GenerationSettings,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

export function SettingsPanel({
  settings,
  onChange,
  disabled,
}: {
  settings: GenerationSettings;
  onChange: (next: GenerationSettings) => void;
  disabled?: boolean;
}) {
  const set = <K extends keyof GenerationSettings>(
    key: K,
    value: GenerationSettings[K],
  ) => onChange({ ...settings, [key]: value });

  return (
    <div className="space-y-6">
      <Group title="Duration">
        <div className="grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              disabled={disabled}
              onClick={() => set("duration", d.value)}
              className={cn("chip justify-center py-2.5", settings.duration === d.value && "chip-active")}
            >
              {d.label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Aspect Ratio">
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.map((a) => (
            <button
              key={a.value}
              disabled={disabled}
              onClick={() => set("aspectRatio", a.value)}
              className={cn("chip flex-col gap-1 py-3", settings.aspectRatio === a.value && "chip-active")}
            >
              <span className="text-base leading-none">{a.icon}</span>
              <span className="text-xs">{a.label}</span>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Visual Style">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {VISUAL_STYLES.map((s) => (
            <button
              key={s.value}
              disabled={disabled}
              onClick={() => set("style", s.value)}
              className={cn("chip flex-col gap-1 py-3", settings.style === s.value && "chip-active")}
            >
              <span className="text-lg leading-none">{s.emoji}</span>
              <span className="text-[0.7rem] leading-tight">{s.label}</span>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Camera Movement">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CAMERA_MOVEMENTS.map((c) => (
            <button
              key={c.value}
              disabled={disabled}
              onClick={() => set("camera", c.value)}
              className={cn("chip justify-center py-2.5 text-xs", settings.camera === c.value && "chip-active")}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Quality">
        <div className="grid grid-cols-3 gap-2">
          {QUALITIES.map((q) => (
            <button
              key={q.value}
              disabled={disabled}
              onClick={() => set("quality", q.value)}
              className={cn("chip flex-col gap-0.5 py-2.5", settings.quality === q.value && "chip-active")}
            >
              <span>{q.label}</span>
              {q.note && <span className="text-[0.65rem] opacity-70">{q.note}</span>}
            </button>
          ))}
        </div>
      </Group>
    </div>
  );
}
