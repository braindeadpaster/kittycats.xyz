"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToastStack } from "@/components/ui/toast-stack";
import { PREMIUM_PLANS } from "@/lib/premium-plans";
import { modalPrimaryBtn } from "@/components/dashboard/modal";

function CrownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 512 512" style={{ fontSize: 21 }}>
      <path fill="currentColor" d="M121.72 32a4 4 0 0 0-3.72 5.56l2.3 5.43l40.7 94.9a4 4 0 0 0 6.88.82L243 38.4a4 4 0 0 0-3.2-6.4Zm298.21 26.06l-41.28 96.37a4 4 0 0 0 3.68 5.57h101a4 4 0 0 0 3.4-6.11L427 57.53a4 4 0 0 0-7.07.53M85 57.57l-59.71 96.32a4 4 0 0 0 3.4 6.11h101a4 4 0 0 0 3.67-5.58L92 58.1a4 4 0 0 0-7-.53M393.27 32H267.82a1.94 1.94 0 0 0-1.56 3.11l79.92 106.46a1.94 1.94 0 0 0 3.34-.4L391.6 43l3.4-8.34a1.92 1.92 0 0 0-1.7-2.66ZM239 448l-89.43-253.49A3.78 3.78 0 0 0 146 192H25.7a3.72 3.72 0 0 0-2.95 6l216 279.81a5.06 5.06 0 0 0 6.39 1.37a5 5 0 0 0 2.39-6.08Zm247.3-256H366a3.75 3.75 0 0 0-3.54 2.51l-98.2 278.16a5.21 5.21 0 0 0 2.42 6.31a5.22 5.22 0 0 0 6.61-1.39L489.25 198a3.72 3.72 0 0 0-2.95-6M259.2 78.93l56 74.67a4 4 0 0 1-3.2 6.4H200a4 4 0 0 1-3.2-6.4l56-74.67a4 4 0 0 1 6.4 0m-7 310.31l-67.7-191.91a4 4 0 0 1 3.77-5.33h135.46a4 4 0 0 1 3.77 5.33l-67.73 191.91a4 4 0 0 1-7.54 0Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 12 12" className="shrink-0 text-[16px] text-[#7dd87d]">
      <path fill="currentColor" d="M9.765 3.205a.75.75 0 0 1 .03 1.06l-4.25 4.5a.75.75 0 0 1-1.075.015L2.22 6.53a.75.75 0 0 1 1.06-1.06l1.705 1.704l3.72-3.939a.75.75 0 0 1 1.06-.03" />
    </svg>
  );
}

export default function PremiumClient({
  initialIsPremium,
  initialPlan,
  initialExpiresAt,
}: {
  initialIsPremium: boolean;
  initialPlan: string | null;
  initialExpiresAt: string | null;
}) {
  const router = useRouter();
  const { pushToast } = useToastStack();
  const [isPremium, setIsPremium] = useState(initialIsPremium);
  const [plan, setPlan] = useState<string | null>(initialPlan);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt);
  const [pending, setPending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  const offer = PREMIUM_PLANS[0];

  const subscribe = async () => {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: offer.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Checkout failed.");
      setIsPremium(true);
      setPlan(body.plan ?? offer.id);
      setExpiresAt(body.expiresAt ? String(body.expiresAt) : expiresAt);
      pushToast("Premium activated!");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setPending(false);
    }
  };

  const cancel = async () => {
    setCancelling(true);
    setError("");
    try {
      const res = await fetch("/api/premium", { method: "DELETE" });
      if (!res.ok) throw new Error("Could not cancel Premium.");
      setIsPremium(false);
      setPlan(null);
      setExpiresAt(null);
      pushToast("Premium cancelled.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel Premium.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="w-full max-w-[520px] rounded-lg border-2 border-[#1c1c1c] bg-[#111111]">
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
        <h2 className="m-0 text-[19px] font-semibold text-white">Upgrade to Premium</h2>
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Close"
          className="grid size-8 shrink-0 cursor-pointer place-content-center rounded-lg border-none bg-transparent text-[#adadad] transition-colors hover:bg-white/5 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="7.43 7.45 9.15 9.15" className="size-4">
            <path fill="currentColor" d="m12 13.4l-2.9 2.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l2.9-2.9l-2.9-2.875q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l2.9 2.9l2.875-2.9q.275-.275.7-.275t.7.275q.3.3.3.713t-.3.687L13.375 12l2.9 2.9q.275.275.275.7t-.275.7q-.3.3-.712.3t-.688-.3z" />
          </svg>
        </button>
      </div>
      <div className="px-5 pb-5">
        <h1 className="m-0 flex items-center gap-2 text-[24px] font-semibold text-white">
          <span className="text-[#e2b9ec]">
            <CrownIcon />
          </span>
          Premium
        </h1>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
          <h1 className="m-0 text-[32px] font-bold text-white">
            ${offer.price}
            <span className="text-[16px] font-medium text-[#8a8a8a]">/{offer.interval}</span>
          </h1>
        </div>
        <p className="m-0 mt-1 text-[13px] font-light text-[#8a8a8a]">{offer.tagline}</p>
        <h3 className="m-0 mt-2 text-[14px] font-normal text-[#a5a5a5]">
          The perfect plan to discover your creativity &amp; unlock more features.
        </h3>
        {isPremium && (
          <p className="m-0 mt-2 rounded-md border border-[#135315] bg-[#103310] p-3 text-[13px] text-[#c9c9c9]">
            Premium active{plan ? ` · ${plan}` : ""}{expiresAt ? ` · renews ${new Date(expiresAt).toLocaleDateString()}` : ""}.
          </p>
        )}
        <div className="mt-4 flex flex-col gap-2.5">
          {offer.features.map((f) => (
            <span key={f} className="flex items-center gap-2 text-[14px] text-[#e6e6e6]">
              <CheckIcon />
              {f}
            </span>
          ))}
        </div>
        <div className="mt-5">
          {isPremium ? (
            <div className="flex gap-2">
              <span className={`${modalPrimaryBtn} flex-1 cursor-default text-center opacity-60`}>
                Current plan
              </span>
              <button
                type="button"
                onClick={cancel}
                disabled={cancelling}
                className="shrink-0 cursor-pointer rounded-md border-2 border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2.5 text-[15px] font-semibold text-white transition hover:bg-[#222] disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Cancel"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={subscribe}
              disabled={pending}
              className={`${modalPrimaryBtn} w-full`}
            >
              {pending ? "Processing…" : "Purchase"}
            </button>
          )}
        </div>
        {error ? (
          <p role="alert" className="m-0 mt-2 text-[13px] text-[#f87171]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
