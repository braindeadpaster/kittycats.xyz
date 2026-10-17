"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export interface PendingLink {
  title: string;
  url: string;
}

export default function LinkConfirm({
  pending,
  onCancel,
  onConfirm,
}: {
  pending: PendingLink | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const close = useCallback(() => {
    setShown(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setMounted(false);
      onCancel();
    }, 250);
  }, [onCancel]);

  useEffect(() => {
    if (pending) {
      clearTimeout(timer.current);
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    } else {
      setShown(false);
      setMounted(false);
    }
    return () => clearTimeout(timer.current);
  }, [pending]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounted, close]);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!mounted || !pending) return null;
  if (typeof document === "undefined") return null;

  const displayUrl =
    pending.url.length > 60 ? `${pending.url.slice(0, 60)}…` : pending.url;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-250 ease-out ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >
      <div onClick={close} className="absolute inset-0 bg-black/80" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Are you sure?"
        className={`${montserrat.className} relative w-full max-w-sm transform-gpu rounded-2xl border border-[#1b1b1b] bg-[#0d0d0d] p-5 transition-[transform,opacity] duration-250 ease-out will-change-transform ${
          shown
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500">
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white">Are you sure?</h3>
        </div>

        <p className="mt-4 text-sm leading-5 text-white/50">
          You are about to visit an external link. Continue?
        </p>

        <div className="mt-4 flex min-w-0 items-center gap-3 rounded-lg border border-[#1b1b1b] bg-[#080808] px-3 py-2.5">
          <p
            title={pending.url}
            className="truncate text-xs text-white/40"
          >
            {displayUrl}
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className="flex-1" />
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white/40 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pink-400 active:scale-[0.98]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
