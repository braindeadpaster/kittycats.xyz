export const metadata = {
  title: "Casino — egirls.lol",
};

export default function CasinoPage() {
  return (
    <div className="bg-tertiary min-h-svh font-sans text-white">
      <div className="mx-auto w-full max-w-4xl space-y-6 px-3 pb-16 pt-12 lg:px-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Casino</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gamble your ₣ coins on profile-boosting games.
          </p>
        </div>

        <div className="relative rounded-3xl border border-white/[0.03] from-[#1a1a1a] to-[#131313] bg-gradient-to-br p-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/[0.03] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] shadow-md">
            <svg
              className="text-primary-300 size-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <h2 className="text-foreground mt-4 text-lg font-semibold">Games coming soon</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            The casino is under construction. Your wallet will be ready when the
            first games launch.
          </p>
          <div className="border-foreground/5 bg-input/30 mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2">
            <span className="text-muted-foreground text-sm">Wallet</span>
            <span className="text-foreground text-sm font-semibold">₣0.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
