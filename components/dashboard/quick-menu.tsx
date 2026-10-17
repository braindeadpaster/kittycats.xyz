"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { V3Icon } from "./v3-icons";

interface QuickMenuProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  onClose: () => void;
}

export default function QuickMenu({ anchorRef, open, onClose }: QuickMenuProps) {
  const router = useRouter();
  const [shown, setShown] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0, bottom: 0, maxH: 420, openUp: true });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const menuH = Math.min(menuRef.current?.scrollHeight ?? 420, 480);
      const spaceAbove = r.top - 10;
      const spaceBelow = vh - r.bottom - 10;
      const openUp = spaceAbove >= menuH || spaceAbove >= spaceBelow;
      setPos({
        left: r.left,
        openUp,
        maxH: Math.min(menuH, openUp ? spaceAbove : spaceBelow),
        ...(openUp ? { bottom: vh - r.top + 10, top: 0 } : { top: r.bottom + 10, bottom: 0 }),
      });
    };
    update();
    const t = window.setTimeout(() => setShown(true), 20);
    window.addEventListener("resize", update);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      // Let the anchor toggle button handle its own clicks so the menu
      // can be closed by clicking it again.
      if (anchorRef.current && anchorRef.current.contains(t)) return;
      if (menuRef.current && !menuRef.current.contains(t)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/register");
    router.refresh();
  }

  return (
    <div
      ref={menuRef}
      className={`fixed z-[999] w-[260px] overflow-y-auto rounded-lg border-2 border-[#161616] bg-[#111] p-[13px] text-[#fafafa] transition-all duration-250 ${
        shown ? "scale-100 opacity-100" : "scale-[0.85] opacity-0"
      }`}
      style={{
        left: pos.left,
        top: pos.openUp ? undefined : pos.top,
        bottom: pos.openUp ? pos.bottom : undefined,
        maxHeight: pos.maxH,
        transformOrigin: pos.openUp ? "center bottom" : "center top",
      }}
      role="menu"
    >
      <div>
        <h1 className="m-0 text-[20px] text-[#fafafa]">Quick Menu</h1>
        <h3 className="m-0 mb-[10px] text-[16px] font-[450] text-[#999999]">
          Navigate quickly through egirls.lol
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        <a
          href="/"
          className="flex cursor-pointer items-center gap-[6px] rounded-md border-2 border-pink-500/60 bg-pink-600 px-3 py-[7px] font-medium text-[#fafafa] no-underline transition active:translate-y-1"
        >
          <V3Icon name="home" className="size-[22px]" />
          Home
        </a>
        <a
          href="/leaderboard"
          className="flex cursor-pointer items-center gap-[6px] rounded-md border-2 border-[#f59f0b3d] bg-[#f59f0b48] px-3 py-[7px] font-medium text-[#fafafa] no-underline transition active:translate-y-1"
        >
          <V3Icon name="trophy" className="size-[22px]" />
          Leaderboard
        </a>
        <a
          href="https://discord.gg/HgqbxHRDxX"
          target="_blank"
          rel="noopener nofollow"
          className="flex cursor-pointer items-center gap-[6px] rounded-md border-2 border-[#5661f659] bg-[#5661f64b] px-3 py-[7px] font-medium text-[#fafafa] no-underline transition active:translate-y-1"
        >
          <V3Icon name="discord" className="size-[22px]" />
          Discord Server
        </a>
        <button
          type="button"
          onClick={handleLogout}
          className="flex cursor-pointer items-center gap-[6px] rounded-md border-2 border-[#f443368c] bg-[#f4433661] px-3 py-[7px] font-medium text-[#fafafa] transition active:translate-y-1"
        >
          <V3Icon name="logout" className="size-[22px]" />
          Logout
        </button>
      </div>
    </div>
  );
}
