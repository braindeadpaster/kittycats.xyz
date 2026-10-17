export const metadata = {
  title: "Help — egirls.lol",
};

const FAQ = [
  {
    q: "How do I change my profile picture?",
    a: "Head to Customize → Profile and click “Change Profile Picture”. You can upload an image or paste a URL.",
  },
  {
    q: "How do I add links to my profile?",
    a: "Go to Customize → Links and click “Add Link”. Your links appear on your profile card at /your-username.",
  },
  {
    q: "What are badges?",
    a: "Badges are collectible icons shown on your profile. Some are seasonal and limited — grab them while they last.",
  },
  {
    q: "What does Premium unlock?",
    a: "Premium unlocks the free-move Custom layout editor and more exclusive profile features.",
  },
];

export default function HelpPage() {
  return (
    <div className="bg-tertiary min-h-svh font-sans text-white">
      <div className="mx-auto w-full max-w-4xl space-y-6 px-3 pb-16 pt-12 lg:px-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Help</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Frequently asked questions about your profile.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ.map((item) => (
            <div
              key={item.q}
              className="relative rounded-3xl border border-white/[0.03] from-[#1a1a1a] to-[#131313] bg-gradient-to-br p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
            >
              <h2 className="text-foreground text-sm font-semibold">{item.q}</h2>
              <p className="text-muted-foreground mt-1.5 text-sm">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="border-foreground/5 bg-input/30 flex flex-col items-center gap-2 rounded-2xl border p-6 text-center shadow-md sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-foreground text-sm font-semibold">Still stuck?</h2>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Join our Discord and the community will help you out.
            </p>
          </div>
          <a
            href="https://discord.gg/HgqbxHRDxX"
            target="_blank"
            rel="noreferrer"
            className="bg-[#5865F2] hover:bg-[#4752c4] inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
            Join Discord
          </a>
        </div>
      </div>
    </div>
  );
}
