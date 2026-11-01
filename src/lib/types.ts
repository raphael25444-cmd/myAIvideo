export type GenerationMode = "text" | "image" | "video";

export type Duration = "5" | "10" | "15";
export type AspectRatio = "16:9" | "9:16" | "1:1";
export type VisualStyle =
  | "realistic"
  | "cinematic"
  | "anime"
  | "3d"
  | "fantasy"
  | "scifi"
  | "documentary"
  | "commercial";
export type CameraMovement =
  | "zoom_in"
  | "zoom_out"
  | "pan"
  | "tracking"
  | "drone"
  | "static";
export type Quality = "720p" | "1080p" | "4k";

export interface GenerationSettings {
  duration: Duration;
  aspectRatio: AspectRatio;
  style: VisualStyle;
  camera: CameraMovement;
  quality: Quality;
}

export interface GeneratePayload extends GenerationSettings {
  prompt: string;
  negativePrompt?: string;
  mode: GenerationMode;
  seed?: number;
}

export type JobStatusState =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface JobStatus {
  jobId: string;
  mode: GenerationMode;
  prompt: string;
  negativePrompt?: string;
  settings: GenerationSettings;
  status: JobStatusState;
  progress: number; // 0..100
  stage?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  engine?: string;
  error?: string;
}

export interface HistoryItem {
  jobId: string;
  prompt: string;
  negativePrompt?: string;
  settings: GenerationSettings;
  mode: GenerationMode;
  videoUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export const DURATIONS: { value: Duration; label: string }[] = [
  { value: "5", label: "5s" },
  { value: "10", label: "10s" },
  { value: "15", label: "15s" },
];

export const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: "16:9", label: "Landscape", icon: "▭" },
  { value: "9:16", label: "Portrait", icon: "▯" },
  { value: "1:1", label: "Square", icon: "◻" },
];

export const VISUAL_STYLES: { value: VisualStyle; label: string; emoji: string }[] = [
  { value: "realistic", label: "Realistic", emoji: "📷" },
  { value: "cinematic", label: "Cinematic", emoji: "🎬" },
  { value: "anime", label: "Anime", emoji: "🌸" },
  { value: "3d", label: "3D Animation", emoji: "🧊" },
  { value: "fantasy", label: "Fantasy", emoji: "🐉" },
  { value: "scifi", label: "Sci-Fi", emoji: "🚀" },
  { value: "documentary", label: "Documentary", emoji: "🎥" },
  { value: "commercial", label: "Commercial", emoji: "💎" },
];

export const CAMERA_MOVEMENTS: { value: CameraMovement; label: string }[] = [
  { value: "zoom_in", label: "Zoom In" },
  { value: "zoom_out", label: "Zoom Out" },
  { value: "pan", label: "Pan" },
  { value: "tracking", label: "Tracking Shot" },
  { value: "drone", label: "Drone Shot" },
  { value: "static", label: "Static Camera" },
];

export const QUALITIES: { value: Quality; label: string; note?: string }[] = [
  { value: "720p", label: "720p", note: "Fast" },
  { value: "1080p", label: "1080p", note: "Balanced" },
  { value: "4k", label: "4K", note: "Premium" },
];

export const STYLE_LABELS: Record<VisualStyle, string> = {
  realistic: "Realistic",
  cinematic: "Cinematic",
  anime: "Anime",
  "3d": "3D Animation",
  fantasy: "Fantasy",
  scifi: "Sci-Fi",
  documentary: "Documentary",
  commercial: "Commercial",
};

export const CAMERA_LABELS: Record<CameraMovement, string> = {
  zoom_in: "Zoom In",
  zoom_out: "Zoom Out",
  pan: "Pan",
  tracking: "Tracking Shot",
  drone: "Drone Shot",
  static: "Static Camera",
};

export const QUALITY_LABELS: Record<Quality, string> = {
  "720p": "720p",
  "1080p": "1080p",
  "4k": "4K",
};

export const DURATION_LABELS: Record<Duration, string> = {
  "5": "5 seconds",
  "10": "10 seconds",
  "15": "15 seconds",
};

export const ASPECT_LABELS: Record<AspectRatio, string> = {
  "16:9": "Landscape (16:9)",
  "9:16": "Portrait (9:16)",
  "1:1": "Square (1:1)",
};
