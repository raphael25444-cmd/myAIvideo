import Link from "next/link";

const VALUES = [
  { icon: "🌍", title: "Open to everyone", text: "No sign-ups, no paywalls, no API keys. Creativity should be one click away." },
  { icon: "🤖", title: "Real AI, not demos", text: "A modular Python engine renders genuine video frames — extensible to the latest open models." },
  { icon: "⚡", title: "Fast & local", text: "Runs on your own machine or server via Docker. Your prompts never leave the pipeline unnecessarily." },
  { icon: "🎨", title: "Creator-first", text: "Built for filmmakers, marketers and dreamers who want to move from idea to footage instantly." },
];

const STACK = [
  "Next.js", "TypeScript", "Tailwind CSS", "FastAPI", "Python 3", "PyTorch", "Diffusers", "FFmpeg", "Docker", "Docker Compose",
];

export default function AboutPage() {
  return (
    <div className="container-x section-pad">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Our mission
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
          Making AI video creation effortless
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          VISIONAI started with a simple belief: anyone should be able to turn
          their imagination into video without wrestling with accounts, keys or
          complicated setups. We built a studio that talks directly to a real
          Python AI backend so the hardest part — the generation — just works.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {VALUES.map((v) => (
          <div key={v.title} className="glass gradient-border rounded-2xl p-6 card-hover">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/15 text-xl">
              {v.icon}
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{v.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 glass rounded-2xl p-6">
        <h2 className="font-display text-xl font-semibold">The technology</h2>
        <p className="mt-2 text-sm text-muted">
          VISIONAI is a fullstack platform. The studio is a modern web app; the
          intelligence lives in a containerized Python service.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {STACK.map((s) => (
            <span key={s} className="chip chip-active">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link href="/" className="btn-gradient px-6 py-3">
          ✨ Start Creating
        </Link>
      </div>
    </div>
  );
}
