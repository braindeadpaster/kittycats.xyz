"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { V3Icon } from "./v3-icons";

interface SearchItem {
  group: string;
  name: string;
  desc: string;
  icon: string;
  href?: string;
  external?: boolean;
  badge?: string;
  action?: "share" | "my-page";
}

interface SearchOverlayProps {
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchOverlay({ username, open, onOpenChange }: SearchOverlayProps) {
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const profileHref = username ? `/${encodeURIComponent(username)}` : "/dashboard/overview";

  const items: SearchItem[] = useMemo(
    () => [
      { group: "Account", name: "Overview", desc: "View your profile overview, UID, completion, and stats.", icon: "overview", href: "/dashboard/overview" },
      { group: "Account", name: "Analytics", desc: "Review views, clicks, devices, socials, referrers, and countries.", icon: "analytics", href: "/dashboard/analytics" },
      { group: "Account", name: "Badges", desc: "Manage profile badges and custom badge display.", icon: "badge", href: "/dashboard/badges" },
      { group: "Settings", name: "Username", desc: "Change your public profile username.", icon: "at", href: "/dashboard/settings" },
      { group: "Settings", name: "Display Name", desc: "Change the display name shown on your profile.", icon: "type", href: "/dashboard/settings" },
      { group: "Settings", name: "Open Alias Manager", desc: "Manage alternate profile aliases.", icon: "layers", href: "/dashboard/settings" },
      { group: "Settings", name: "Email", desc: "View or change your account email.", icon: "mail", href: "/dashboard/settings" },
      { group: "Security Settings", name: "Multi-factor authentication", desc: "Enable or disable multi-factor authentication.", icon: "shield", href: "/dashboard/settings" },
      { group: "Security Settings", name: "Session Management", desc: "Review active sessions and invalidate devices you do not recognize.", icon: "monitor", href: "/dashboard/settings" },
      { group: "Connections", name: "Login with Discord", desc: "Control whether Discord can be used to log in.", icon: "discord", href: "/dashboard/settings" },
      { group: "Account Actions", name: "Change Password", desc: "Change or add your account password.", icon: "key", href: "/dashboard/settings" },
      { group: "Account Actions", name: "Delete Account", desc: "Find the account deletion controls.", icon: "trash", href: "/dashboard/settings" },
      { group: "Customize", name: "Description", desc: "Edit the text shown on your profile.", icon: "align-left", href: "/dashboard/customize" },
      { group: "Customize", name: "Profile Widget", desc: "Choose the widget shown on your profile, including Discord Presence.", icon: "layout", href: "/dashboard/customize" },
      { group: "Customize", name: "Background Effects", desc: "Choose visual background effects.", icon: "sparkles", href: "/dashboard/customize" },
      { group: "Customize", name: "Profile Opacity", desc: "Adjust the profile container opacity.", icon: "droplet", href: "/dashboard/customize" },
      { group: "Customize", name: "Profile Blur", desc: "Adjust the profile background blur.", icon: "droplet", href: "/dashboard/customize" },
      { group: "Customize", name: "Username Effects", desc: "Choose animated username effects.", icon: "wand", href: "/dashboard/customize" },
      { group: "Customize", name: "Accent Color", desc: "Change profile accent color.", icon: "palette", href: "/dashboard/customize" },
      { group: "Customize", name: "Background Color", desc: "Change profile background color.", icon: "bucket", href: "/dashboard/customize" },
      { group: "Customize", name: "Enable Profile Gradient", desc: "Enable and edit profile gradient colors.", icon: "pipette", href: "/dashboard/customize" },
      { group: "Links", name: "Links", desc: "Manage social links and buttons on your profile.", icon: "link", href: "/dashboard/links" },
      { group: "Premium", name: "Profile Layout", desc: "Unlock this premium feature.", icon: "layout", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Profile Animation", desc: "Unlock this premium feature.", icon: "play", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Cursor Effects", desc: "Unlock this premium feature.", icon: "cursor", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Cursor Effects Color", desc: "Unlock this premium feature.", icon: "palette", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Text Font", desc: "Unlock this premium feature.", icon: "type", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Page Enter Screen", desc: "Unlock this premium feature.", icon: "door", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Page Click Sound", desc: "Unlock this premium feature.", icon: "volume", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Typewriter Description", desc: "Unlock this premium feature.", icon: "type", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Parallax Profile Animation", desc: "Unlock this premium feature.", icon: "move", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Hide Views", desc: "Unlock this premium feature.", icon: "eye-off", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Border Color", desc: "Unlock this premium feature.", icon: "square", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Border Width", desc: "Unlock this premium feature.", icon: "border-width", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Profile Border Type", desc: "Unlock this premium feature.", icon: "frame", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Profile Border Radius", desc: "Unlock this premium feature.", icon: "corner-radius", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Social Links Alignment", desc: "Unlock this premium feature.", icon: "align-center", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Premium", name: "Profile Metadata", desc: "Unlock this premium feature.", icon: "info", href: "/dashboard/premium", badge: "Upgrade" },
      { group: "Templates", name: "Template Library", desc: "Browse, favorite, and manage profile templates.", icon: "gallery", href: "/dashboard/templates/discover" },
      { group: "Templates", name: "Favorite Templates", desc: "Find your favorite templates.", icon: "heart", href: "/dashboard/templates/discover" },
      { group: "Templates", name: "My Templates", desc: "Manage templates you uploaded.", icon: "upload", href: "/dashboard/templates/discover" },
      { group: "Quick Actions", name: "Share Your Profile", desc: "Open sharing tools for your egirls.lol profile.", icon: "share", action: "share" },
      { group: "Quick Actions", name: "My Page", desc: `Open egirls.lol/${username || "you"} in a new tab.`, icon: "external", action: "my-page" },
      { group: "Quick Actions", name: "Help Center", desc: "Open the egirls.lol help center.", icon: "help", external: true, href: "https://help.egirls.lol" },
      { group: "Quick Actions", name: "Discord Server", desc: "Join the egirls.lol Discord server.", icon: "discord", external: true, href: "https://discord.gg/HgqbxHRDxX" },
      { group: "Quick Actions", name: "Home", desc: "Go to the egirls.lol home page.", icon: "home", href: "/" },
      { group: "Quick Actions", name: "Leaderboard", desc: "View the public profile views leaderboard.", icon: "trophy", href: "/leaderboard" },
    ],
    [username]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.group.toLowerCase().includes(q)
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchItem[]>();
    for (const item of filtered) {
      const arr = map.get(item.group) ?? [];
      arr.push(item);
      map.set(item.group, arr);
    }
    return [...map.entries()];
  }, [filtered]);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      onOpenChange(false);
      setClosing(false);
      setQuery("");
      setActive(0);
    }, 140);
  }, [onOpenChange]);

  const activate = useCallback(
    (item: SearchItem) => {
      onOpenChange(false);
      setClosing(false);
      setQuery("");
      if (item.action === "share") {
        const url = `${window.location.origin}${profileHref}`;
        navigator.clipboard?.writeText(url).catch(() => undefined);
      } else if (item.action === "my-page") {
        window.open(profileHref, "_blank", "noopener");
      } else if (item.external && item.href) {
        window.open(item.href, "_blank", "noopener");
      } else if (item.href) {
        router.push(item.href);
      }
    },
    [profileHref, router]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
        setClosing(false);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, onOpenChange]);

  useEffect(() => {
    if (open) {
      setActive(0);
      setQuery("");
      window.setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-5 py-8"
      style={{ animation: closing ? "fade-out 0.14s ease both" : "fade-in 0.16s ease both" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className="flex w-full max-w-[640px] flex-col overflow-hidden rounded-lg border-2 border-[#151515] bg-[#111111] text-[#fafafa]"
        style={{ animation: closing ? "menu-pop-out 0.14s ease both" : "menu-pop 0.23s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <div className="flex items-center gap-2 bg-[#121212] px-[11px] py-[10px]">
          <div className="flex h-[38px] min-w-0 flex-1 items-center gap-2 rounded-md bg-[#0c0c0c] px-[11px] transition-colors focus-within:bg-[#101010] hover:bg-[#101010]">
            <V3Icon name="search" className="size-[19px] min-w-[19px] shrink-0 text-[#707070]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, filtered.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const item = filtered[active];
                  if (item) activate(item);
                }
              }}
              placeholder="Search features, pages, and actions..."
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="h-full min-w-0 flex-1 border-none bg-transparent p-0 text-[14.5px] font-[450] text-[#eeeeee] outline-none placeholder:text-[#666666]"
            />
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="grid size-9 min-w-9 place-content-center rounded-md text-[#777777] transition hover:bg-[#1a1a1a] hover:text-[#fafafa]"
          >
            <V3Icon name="close" className="size-[22px]" />
          </button>
        </div>
        <div
          ref={listRef}
          className="flex h-[min(72dvh,590px)] min-h-[390px] flex-col gap-[14px] overflow-y-auto bg-[#111111] px-[10px] pb-[13px] pt-[4px]"
        >
          {grouped.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
              <span className="text-[15px] font-semibold text-[#fafafa]">No results found</span>
              <span className="text-[13px] text-[#949494]">Try a different search term.</span>
            </div>
          ) : (
            grouped.map(([group, groupItems]) => (
              <div key={group} className="flex flex-col gap-[7px]">
                <div className="px-2 text-[11px] font-bold uppercase text-[#8a8a8a]">{group}</div>
                <div className="flex flex-col gap-1 pl-2">
                  {groupItems.map((item) => {
                    const idx = filtered.indexOf(item);
                    const isActive = idx === active;
                    return (
                      <button
                        key={`${item.group}-${item.name}`}
                        type="button"
                        data-index={idx}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => activate(item)}
                        className={`flex min-h-[60px] w-full items-center gap-3 rounded-md border-2 px-3 py-2 text-left transition-all duration-150 ${
                          isActive
                            ? "border-[#1c1c1c] bg-[#171717]"
                            : "border-transparent bg-transparent"
                        }`}
                      >
                        <span
                          className={`flex size-6 min-w-6 items-center justify-center ${
                            isActive ? "text-pink-300" : "text-[#a7a7a7]"
                          }`}
                        >
                          <V3Icon name={item.icon} className="size-5" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
                          <strong className="truncate text-[15px] font-semibold text-[#fafafa]">
                            {item.name}
                          </strong>
                          <small className="line-clamp-1 text-[13px] font-[450] leading-[1.3] text-[#949494]">
                            {item.desc}
                          </small>
                        </span>
                        {item.badge ? (
                          <span className="h-6 min-w-fit rounded-[7px] border border-pink-500/30 bg-pink-600/15 px-2 text-[11px] font-bold leading-6 text-pink-300">
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
