"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Single shared dashboard dropdown. The menu renders in a portal pinned to
 * the trigger, so it can overflow outside popups and scroll containers
 * instead of stretching or clipping them.
 */
export default function Dropdown({
  open,
  onOpenChange,
  label,
  icon,
  ariaLabel,
  buttonClassName,
  align = "left",
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  label: React.ReactNode;
  icon?: React.ReactNode;
  ariaLabel?: string;
  buttonClassName?: string;
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, up: false });

  const measure = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const menuH = 260;
    const below = window.innerHeight - r.bottom - 8;
    const above = r.top - 8;
    const up = below < Math.min(menuH, 200) && above > below;
    const width = Math.max(r.width, 160);
    let left = align === "right" ? r.right - width : r.left;
    left = Math.min(Math.max(8, left), Math.max(8, window.innerWidth - width - 8));
    setPos({
      width,
      left,
      up,
      top: up ? Math.max(8, r.top - Math.min(menuH, above) - 6) : r.bottom + 6,
    });
  }, [align]);

  useEffect(() => {
    if (!open) return;
    measure();
    const onScroll = () => measure();
    window.addEventListener("resize", onScroll);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      onOpenChange(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-label={ariaLabel}
        className={
          buttonClassName ??
          "flex min-h-[46px] w-full cursor-pointer items-center gap-3 rounded-md border-2 border-transparent bg-[#0c0c0c] px-4 text-left text-[14px] font-medium text-[#eee] transition hover:border-[#222]"
        }
      >
        {icon}
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[200] origin-top overflow-hidden rounded-md border-2 border-[#1e1e1e] bg-[#0f0f0f] p-1.5"
              style={{
                top: pos.top,
                left: pos.left,
                width: pos.width,
                transformOrigin: pos.up ? "bottom center" : "top center",
              }}
              role="menu"
            >
              <div className="flex flex-col gap-1.5">{children}</div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
