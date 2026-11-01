import type { GenerationSettings, VisualStyle, CameraMovement, Quality } from "@/lib/types";

export const dynamic = "force-dynamic";

const STYLE_TERMS: Record<VisualStyle, string[]> = {
  realistic: ["photorealistic", "natural lighting", "sharp focus", "real-world textures"],
  cinematic: ["cinematic composition", "anamorphic lens", "filmic color grading", "shallow depth of field"],
  anime: ["anime style", "cel shading", "vibrant flat colors", "expressive linework"],
  "3d": ["3D render", "smooth claymation look", "soft studio lighting", "subsurface scattering"],
  fantasy: ["epic fantasy art", "magical atmosphere", "volumetric god rays", "intricate detail"],
  scifi: ["futuristic sci-fi", "glowing neon tech", "chrome and glass surfaces", "holographic detail"],
  documentary: ["documentary footage", "handheld realism", "natural color", "unpretentious framing"],
  commercial: ["product commercial", "studio lighting", "premium look", "clean reflections"],
};

const CAMERA_TERMS: Record<CameraMovement, string> = {
  zoom_in: "slow cinematic zoom in",
  zoom_out: "gradual zoom out revealing the scene",
  pan: "smooth horizontal pan",
  tracking: "steady tracking shot following the subject",
  drone: "aerial drone shot with gentle drift",
  static: "locked-off static camera",
};

const QUALITY_TERMS: Record<Quality, string> = {
  "720p": "clean 720p",
  "1080p": "crisp 1080p",
  "4k": "ultra detailed 4K",
};

export async function POST(req: Request) {
  try {
    const { prompt, settings } = (await req.json()) as {
      prompt?: string;
      settings?: Partial<GenerationSettings>;
    };
    const base = (prompt ?? "").toString().trim();
    if (!base) {
      return Response.json({ enhanced: "" });
    }

    const style = (settings?.style ?? "cinematic") as VisualStyle;
    const camera = (settings?.camera ?? "static") as CameraMovement;
    const quality = (settings?.quality ?? "1080p") as Quality;

    const additions: string[] = [];
    // avoid duplicating if already present (case-insensitive substring)
    const has = (term: string) => base.toLowerCase().includes(term.toLowerCase());

    for (const t of STYLE_TERMS[style]) if (!has(t)) additions.push(t);
    if (!has(CAMERA_TERMS[camera])) additions.push(CAMERA_TERMS[camera]);
    if (!has(QUALITY_TERMS[quality])) additions.push(QUALITY_TERMS[quality]);
    additions.push("smooth temporal consistency", "masterpiece composition");

    const enhanced = `${base}, ${additions.join(", ")}`;
    return Response.json({ enhanced });
  } catch {
    return Response.json({ error: "Enhancement failed" }, { status: 500 });
  }
}
