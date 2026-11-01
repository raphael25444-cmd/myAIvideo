"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  prompt: string;
  category: string;
  gradient: string;
};

const ITEMS: Item[] = [
  { id: "c1", title: "Neon Metropolis", prompt: "A cinematic drone shot flying over a futuristic neon city at sunset, ultra realistic, 4K", category: "Cinematic", gradient: "linear-gradient(135deg,#7c3aed,#2563eb)" },
  { id: "c2", title: "Harbor Nights", prompt: "A dramatic tracking shot through a foggy harbor at night, anamorphic lenses, teal and orange", category: "Cinematic", gradient: "linear-gradient(135deg,#0ea5e9,#1e3a8a)" },
  { id: "n1", title: "Bioluminescent Ocean", prompt: "A majestic whale gliding through a glowing bioluminescent ocean, slow motion, ethereal light", category: "Nature", gradient: "linear-gradient(135deg,#0891b2,#22d3ee)" },
  { id: "n2", title: "Antarctic March", prompt: "A nature documentary of emperor penguins marching across the Antarctic ice at golden hour", category: "Nature", gradient: "linear-gradient(135deg,#334155,#0ea5e9)" },
  { id: "f1", title: "Floating Castle", prompt: "A dragon circling a floating castle above the clouds, fantasy art, volumetric light", category: "Futuristic", gradient: "linear-gradient(135deg,#6d28d9,#db2777)" },
  { id: "f2", title: "Space Station Dock", prompt: "A spaceship docking at a colossal space station, sci-fi, detailed hull, lens flare", category: "Futuristic", gradient: "linear-gradient(135deg,#4338ca,#06b6d4)" },
  { id: "a1", title: "Cherry Blossom Rooftop", prompt: "A schoolgirl with flowing hair standing on a rooftop as cherry blossoms fall, anime style", category: "Anime", gradient: "linear-gradient(135deg,#ec4899,#f472b6)" },
  { id: "a2", title: "Mecha Launch", prompt: "A mecha launching from a desert base, dynamic anime action, vibrant colors", category: "Anime", gradient: "linear-gradient(135deg,#f43f5e,#fb923c)" },
  { id: "ad1", title: "Liquid Gold", prompt: "A waterfall made of liquid gold pouring into a crystal pool, fantasy, hyper detailed", category: "Advertising", gradient: "linear-gradient(135deg,#d4af37,#f59e0b)" },
  { id: "ad2", title: "Luxury Perfume", prompt: "A perfume bottle with silk ribbons dancing around it, luxury advertisement, studio light", category: "Advertising", gradient: "linear-gradient(135deg,#a855f7,#f472b6)" },
  { id: "fa1", title: "Starlit Forest", prompt: "An elf archer firing a glowing arrow into a starlit forest, epic fantasy", category: "Fantasy", gradient: "linear-gradient(135deg,#7c3aed,#16a34a)" },
  { id: "fa2", title: "Cosmic Birth", prompt: "Time-lapse of a galaxy forming, swirling cosmic dust, deep space documentary", category: "Fantasy", gradient: "linear-gradient(135deg,#4f46e5,#9333ea)" },
];

const CATEGORIES = ["All", "Cinematic", "Nature", "Futuristic", "Anime", "Advertising", "Fantasy"];

export default function ExplorePage() {
  const router = useRouter();
  const [cat, setCat] = useState("All");

  const filtered = cat === "All" ? ITEMS : ITEMS.filter((i) => i.category === cat);

  const tryPrompt = (prompt: string) => {
    try {
      localStorage.setItem("visionai_seed_prompt", prompt);
    } catch {
      /* ignore */
    }
    router.push("/");
  };

  return (
    <div className="container-x section-pad">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Showcase
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
          Explore AI Videos
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
          Browse creative styles from the VISIONAI community. Tap any video to
          load its prompt into your studio and generate your own version.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn("chip", cat === c && "chip-active")}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="glass gradient-border overflow-hidden rounded-2xl card-hover"
          >
            <div className="relative aspect-video overflow-hidden">
              <div
                className="aurora-blob inset-0 h-full w-full"
                style={{ background: item.gradient, opacity: 0.85 }}
              />
              <div className="absolute inset-0 grid-bg opacity-30" />
              <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[0.65rem] font-medium text-white backdrop-blur">
                {item.category}
              </span>
              <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur">
                ▶
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-display text-base font-semibold">{item.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                {item.prompt}
              </p>
              <button
                onClick={() => tryPrompt(item.prompt)}
                className="btn-gradient mt-4 w-full py-2 text-sm"
              >
                ✨ Try this prompt
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
