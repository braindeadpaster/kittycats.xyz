"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Primary popup button — purple. */
export const modalPrimaryBtn =
  "shrink-0 cursor-pointer rounded-md border border-pink-500/60 bg-pink-600 px-4 py-2.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-pink-500 active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50";

/** Secondary popup button — dark. */
export const modalGhostBtn =
  "shrink-0 cursor-pointer rounded-md border-2 border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2.5 text-[15px] font-semibold text-white transition-all duration-200 hover:border-[#3a3a3a] hover:bg-[#222222] active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50";

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-[460px]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (open) {
      clearTimeout(timer.current);
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    } else {
      setShown(false);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMounted(false), 200);
    }
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 transition-opacity duration-200 ${
        shown ? "opacity-100" : "opacity-0"
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidth} transform-gpu rounded-lg border-2 border-[#1e1e1e] bg-[#111111] text-[#fafafa] transition-all duration-200 ${
          shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
      >
        {title ? (
          <div className="px-4 pb-2 pt-3">
            <h2 className="m-0 text-[17px] font-semibold">{title}</h2>
            {subtitle ? (
              <p className="m-0 mt-0.5 text-[13px] font-light text-[#8a8a8a]">{subtitle}</p>
            ) : null}
          </div>
        ) : null}
        <div className="max-h-[70vh] overflow-y-auto px-4 pb-3">{children}</div>
      </div>
    </div>,
    document.body
  );
}
