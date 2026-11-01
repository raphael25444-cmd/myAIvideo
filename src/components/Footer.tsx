import Link from "next/link";

const NAV = [
  { href: "/", label: "AI Generator" },
  { href: "/explore", label: "Explore Videos" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About VisionAI" },
];

const LEGAL = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/80">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl gradient-animated">
              <span className="text-lg font-black text-white">V</span>
  </span>
            <span className="font-display text-lg font-bold tracking-tight">
              VISION<span className="gradient-text">AI</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Your Imagination. Powered by AI. Generate stunning AI videos from
            text, images and videos — instantly, with no account required.
          </p>
          <p className="mt-4 text-xs text-muted/70">
            Built on a modular Python AI engine · Runs locally via Docker.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Product</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {NAV.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Legal</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line/70">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted/70 sm:flex-row">
          <p>© {new Date().getFullYear()} VISIONAI. All rights reserved.</p>
          <p>No account. No API keys. Just create.</p>
        </div>
      </div>
    </footer>
  );
}
