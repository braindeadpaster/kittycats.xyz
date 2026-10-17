"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { V3Icon } from "./v3-icons";

const NAV = [
  { label: "Overview", href: "/dashboard/overview", icon: "overview" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "analytics" },
  { label: "Customize", href: "/dashboard/customize", icon: "pencil" },
  { label: "Links", href: "/dashboard/links", icon: "link" },
  { label: "Settings", href: "/dashboard/settings", icon: "settings" },
];

export default function MobileNav({ username }: { username: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const profileHref = username ? `/${encodeURIComponent(username)}` : "/dashboard/overview";

  return (
    <>
      {/* top bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-[#181818] bg-[#0e0e0e]/95 px-4 py-3 backdrop-blur md:hidden">
        <a href="/" className="flex items-center no-underline" aria-label="egirls.lol home">
          <span className="grid h-8 w-8 place-content-center rounded-md bg-gradient-to-br from-[#ec4899] to-[#9d174d] text-base font-black text-white">
            E
          </span>
          <span className="ml-2 text-lg font-semibold text-[#fafafa]">
            egirls<span className="text-pink-500">.</span>lol
          </span>
        </a>
        <div className="flex items-center gap-2">
          <a
            href={profileHref}
            target="_blank"
            rel="noopener nofollow"
            className="flex items-center gap-1 rounded-md border border-pink-500/60 bg-pink-600 px-3 py-1.5 text-[13px] font-semibold text-white no-underline transition-colors hover:bg-pink-500"
          >
            <V3Icon name="external" className="size-4" />
            My Page
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Open menu"
            className="grid size-9 place-content-center rounded-md border border-[#222] bg-[#141414] text-[#fafafa]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </header>

      {/* dropdown panel */}
      <div
        className={`fixed inset-x-3 top-[64px] z-50 origin-top transition-all duration-200 md:hidden ${
          open ? "visible scale-100 opacity-100" : "invisible scale-[0.98] opacity-0"
        }`}
        style={{ transformOrigin: "top center" }}
      >
        <nav className="rounded-lg border border-[#1e1e1e] bg-[#111] p-2">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] no-underline transition-colors ${
                  active ? "bg-pink-600/20 text-white" : "text-[#bdbdbd] hover:bg-white/5 hover:text-white"
                }`}
              >
                <V3Icon name={item.icon} className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#181818] bg-[#0e0e0e]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[11px] no-underline transition-colors ${
                  active ? "text-pink-400" : "text-[#7a7a7a] hover:text-[#c9c9c9]"
                }`}
              >
                <V3Icon name={item.icon} className="size-5" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
