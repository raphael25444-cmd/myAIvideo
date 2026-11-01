const SECTIONS = [
  {
    h: "1. No Account, By Design",
    p: "VISIONAI does not require you to register, log in, or provide an email address. You can generate videos as a guest without creating any persistent user account with us.",
  },
  {
    h: "2. Information We Process",
    p: "To generate a video we temporarily process the prompt, optional negative prompt, selected settings, and any image or video you upload. Uploaded media is used solely to fulfill your generation request and is subject to automatic cleanup.",
  },
  {
    h: "3. Local Storage",
    p: "Your recent generations are stored in your own browser using localStorage so you can replay them. This data never leaves your device unless you choose to download or share the resulting video.",
  },
  {
    h: "4. Server-Side Data",
    p: "Prompts and generated videos are kept on the server only for as long as needed to serve your request and are removed by an automatic cleanup process. We do not sell personal data.",
  },
  {
    h: "5. Security",
    p: "All provider configuration and secrets remain server-side. The public studio never asks for API keys. Uploads are validated for type and size, and the backend is protected with rate limiting and file-size limits.",
  },
  {
    h: "6. Your Choices",
    p: "You can clear your local history at any time by clearing your browser storage. Because we do not maintain accounts, there is no separate deletion flow required.",
  },
  {
    h: "7. Changes",
    p: "We may update this policy as the service evolves. Material changes will be reflected on this page.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="container-x section-pad">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Legal
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted">
          Last updated: {new Date().getFullYear()}. VISIONAI is a no-login AI
          video platform. This policy explains, in plain language, what we do
          with your data.
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
