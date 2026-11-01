import type { GenerationMode, VisualStyle } from "./types";

export const EXAMPLE_PROMPTS: string[] = [
  "A cinematic drone shot flying over a futuristic neon city at sunset, ultra realistic, 4K",
  "A majestic whale gliding through a glowing bioluminescent ocean, slow motion, ethereal light",
  "An astronaut floating above the rings of Saturn, photorealistic, lens flare, epic scale",
  "A cozy library where books float and turn their pages by themselves, magical realism",
  "A samurai walking through a cyberpunk street in the rain, anime style, neon reflections",
  "Time-lapse of a galaxy forming, swirling cosmic dust, deep space documentary",
  "A robotic fox exploring a mossy forest, 3D animation, soft studio lighting",
  "A waterfall made of liquid gold pouring into a crystal pool, fantasy, hyper detailed",
  "A vintage train speeding through snowy mountains at golden hour, film grain, nostalgic",
  "A bustling street market in Marrakech, handheld camera, warm tones, documentary feel",
];

export const STYLE_SEED_PROMPTS: Record<VisualStyle, string[]> = {
  realistic: [
    "A hyper realistic close up of morning dew on a spider web, natural lighting",
    "A weathered fisherman mending nets on a wooden boat at dawn, photojournalism",
  ],
  cinematic: [
    "A dramatic tracking shot through a foggy harbor at night, anamorphic lenses, teal and orange",
    "A lone figure walking down an empty neon boulevard, cinematic lighting, 35mm film",
  ],
  anime: [
    "A schoolgirl with flowing hair standing on a rooftop as cherry blossoms fall, anime style",
    "A mecha launching from a desert base, dynamic anime action, vibrant colors",
  ],
  "3d": [
    "A cute round robot rolling through a pastel playground, 3D render, claymation style",
    "A floating island with a tiny village, isometric 3D animation, soft shadows",
  ],
  fantasy: [
    "A dragon circling a floating castle above the clouds, fantasy art, volumetric light",
    "An elf archer firing a glowing arrow into a starlit forest, epic fantasy",
  ],
  scifi: [
    "A spaceship docking at a colossal space station, sci-fi, detailed hull, lens flare",
    "A holographic city rising from the ocean, futuristic, crystalline structures",
  ],
  documentary: [
    "A nature documentary of emperor penguins marching across the Antarctic ice",
    "An aerial documentary of the Amazon rainforest at sunrise, slow reveal",
  ],
  commercial: [
    "A sleek smartphone rotating on a reflective black surface, product commercial, studio light",
    "A perfume bottle with silk ribbons dancing around it, luxury advertisement",
  ],
};

const ADJECTIVES = [
  "cinematic",
  "hyper detailed",
  "volumetric lighting",
  "dramatic",
  "ethereal",
  "moody",
  "vibrant",
  "atmospheric",
  "photorealistic",
  "epic scale",
];

const SUBJECTS = [
  "a futuristic city skyline at dusk",
  "a lone explorer in a vast desert canyon",
  "a graceful dancer surrounded by particles of light",
  "an ancient temple hidden in the jungle",
  "a flock of glowing birds over a calm lake",
  "a steam locomotive crossing a stone viaduct",
  "a cat wearing tiny astronaut gear floating in zero gravity",
  "a waterfall cascading into a hidden grotto",
  "a marketplace bursting with color and life",
  "a whale breaching beneath the northern lights",
];

const CAMERA = [
  "slow drone shot",
  "tracking shot",
  "gentle zoom in",
  "handheld pan",
  "static wide angle",
  "orbiting camera",
];

export function randomPrompt(_mode: GenerationMode = "text"): string {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(SUBJECTS)}, ${pick(ADJECTIVES)}, ${pick(CAMERA)}, 4K`;
}
