import Link from "next/link";
import { GeneratorWorkspace } from "@/components/GeneratorWorkspace";

const STATS = [
  { value: "3", label: "Generation modes" },
  { value: "8", label: "Visual styles" },
  { value: "0", label: "Accounts needed" },
  { value: "∞", label: "Creativity" },
];

const FEATURES = [
  {
    icon: "⚡",
    title: "Instant generation",
    text: "No setup, no keys. Write a prompt and the Python AI engine starts rendering immediately.",
  },
  {
    icon: "🧠",
    title: "Real AI backend",
    text: "A modular FastAPI + PyTorch engine runs in Docker and streams real MP4 videos back to you.",
  },
  {
    icon: "🖼️",
    title: "Image & Video to Video",
    text: "Upload a photo or clip and let the model animate or restyle it with cinematic motion.",
  },
  {
    icon: "🎚️",
    title: "Total creative control",
    text: "Duration, aspect ratio, style, camera movement and quality — tuned to your vision.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="aurora-blob left-[-10%] top-[-5%] h-72 w-72 bg-violet-600/30" />
          <div className="aurora-blob right-[-8%] top-[10%] h-80 w-80 bg-blue-600/25" />
          <div className="absolute inset-0 grid-bg" />
        </div>

        <div className="container-x pt-16 pb-10 text-center sm:pt-20">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-1.5 text-xs text-muted backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            No account. No API keys. Just create.
          </Link>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-[clamp(2.4rem,6vw,4.4rem)] font-bold leading-[1.02]">
            <span className="text-glow gradient-text">Your Imagination.</span>
            <br />
            Powered by AI.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            VISIONAI turns text, images and videos into stunning AI-generated
            clips in seconds. Open the studio, describe a scene, and download
            your MP4 — no sign-up required.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="#studio" className="btn-gradient px-6 py-3">
              ✨ Start Creating
            </Link>
            <Link href="/explore" className="btn-ghost px-6 py-3">
              Explore Videos →
            </Link>
          </div>

          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="glass rounded-2xl px-3 py-4">
                <div className="font-display text-2xl font-bold gradient-text">
                  {s.value}
                </div>
                <div className="mt-1 text-[0.7rem] uppercase tracking-wider text-muted">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Studio */}
      <section id="studio" className="container-x scroll-mt-20">
        <div className="mb-6 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            The AI Video Studio
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
            Pick a mode, write your prompt, choose your settings, and generate.
            It really is that simple.
          </p>
        </div>
        <GeneratorWorkspace />
      </section>

      {/* Features */}
      <section className="container-x section-pad">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass gradient-border rounded-2xl p-5 card-hover"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/15 text-xl">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-base font-semibold">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
