const SECTIONS = [
  {
    h: "1. Acceptance of Terms",
    p: "By accessing VISIONAI you agree to these Terms of Service. The service is provided as-is and as-available for generating AI videos without an account.",
  },
  {
    h: "2. Acceptable Use",
    p: "You agree not to use VISIONAI to create unlawful, harmful, deceptive, or infringing content. Do not attempt to abuse, overload, or circumvent the backend, including rate-limit or upload restrictions.",
  },
  {
    h: "3. No Account Required",
    p: "VISIONAI does not require registration. Features that rely on local browser storage are provided for convenience and are not guaranteed to persist across devices or browsers.",
  },
  {
    h: "4. Generated Content",
    p: "You are responsible for the prompts and media you submit and for how you use the resulting videos. Ensure you have the rights to any images or videos you upload.",
  },
  {
    h: "5. Service Limits",
    p: "Generation is subject to resource and queue limits. The backend may apply automatic cleanup of temporary files and may reject oversized or unsupported uploads.",
  },
  {
    h: "6. Disclaimers",
    p: "The service is provided without warranties of any kind. We do not guarantee uninterrupted availability, specific output quality, or that any particular model is loaded at a given time.",
  },
  {
    h: "7. Changes",
    p: "We may modify these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms.",
  },
];

export default function TermsPage() {
  return (
    <div className="container-x section-pad">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Legal
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-muted">
          Last updated: {new Date().getFullYear()}. Please read these terms
          before using VISIONAI.
        </p>

        <div className="mt-10 space-y-7">
          {SECTIONS.map((s) => (
            <section key={s.h} className="glass gradient-border rounded-2xl p-6">
              <h2 className="font-display text-lg font-semibold">{s.h}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
