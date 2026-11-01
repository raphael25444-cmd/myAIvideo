import Link from "next/link";

const STEPS = [
  {
    n: "01",
    icon: "✍️",
    title: "Write your prompt",
    text: "Describe the scene you imagine. Add a negative prompt, pick a style, camera movement and quality. No account, no API key — just creativity.",
  },
  {
    n: "02",
    icon: "🚀",
    title: "Generate with AI",
    text: "Your request is sent to the Python FastAPI engine running in Docker. It loads a video model and renders frames asynchronously in the background.",
  },
  {
    n: "03",
    icon: "🎬",
    title: "Watch it render",
    text: "A live progress bar shows the real generation stage — queued, loading model, rendering frames, encoding. Never faked to 100% before it's ready.",
  },
  {
    n: "04",
    icon: "⬇️",
    title: "Download your MP4",
    text: "When done, preview the video in the player and download a high-quality MP4. Your recent videos are saved locally for instant replay.",
  },
];

const ARCHITECTURE = [
  ["Browser", "Next.js studio"],
  ["REST / FormData", "Next.js proxy API"],
  ["HTTP", "Python FastAPI"],
  ["Torch + FFmpeg", "AI Engine"],
  ["MP4", "Streamed back"],
];

export default function HowItWorksPage() {
  return (
    <div className="container-x section-pad">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Simple by design
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
          How VISIONAI Works
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
          From idea to downloadable video in four steps. The whole pipeline is
          automated and runs on a real Python AI backend.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {STEPS.map((s) => (
          <div key={s.n} className="glass gradient-border rounded-2xl p-6 card-hover">
            <div className="flex items-start gap-4">
              <span className="font-display text-3xl font-bold gradient-text">{s.n}</span>
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-xl">
                {s.icon}
              </div>
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold">The architecture</h2>
          <p className="mt-2 text-sm text-muted">
            VISIONAI is a fullstack system. The user-facing studio is a Next.js
            app. Generation runs on a dedicated Python service built with
            FastAPI, PyTorch and FFmpeg, started with a single command:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-black/40 p-4 text-xs text-emerald-300">
            <code>docker compose up ai</code>
          </pre>
          <p className="mt-3 text-sm text-muted">
            The backend exposes asynchronous jobs so long renders never block
            requests, and streams real MP4 files back to the browser.
          </p>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold">Request flow</h2>
          <div className="mt-4 space-y-2">
            {ARCHITECTURE.map(([a, b], i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-sm">
                  {a}
                </div>
                <span className="text-violet-300">→</span>
                <div className="flex-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm">
                  {b}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link href="/" className="btn-gradient px-6 py-3">
          ✨ Open the Studio
        </Link>
      </div>
    </div>
  );
}
