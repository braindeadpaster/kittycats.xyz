"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBitcoin,
  faDiscord,
  faEthereum,
  faGithub,
  faInstagram,
  faLastfm,
  faPaypal,
  faReddit,
  faSnapchat,
  faSoundcloud,
  faSpotify,
  faSteam,
  faTelegram,
  faTiktok,
  faTwitch,
  faXTwitter,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import Modal, { modalGhostBtn, modalPrimaryBtn } from "@/components/dashboard/modal";
import { useToastStack } from "@/components/ui/toast-stack";
import { getPlatformName, socialIcons } from "@/components/profile/profile-card";
import type { SocialRow } from "./page";

const SECTION_LABEL = "ml-[5px] text-[22.5px] font-[600] text-[#bebebe]";
const CARD = "mt-[15px] flex flex-col gap-[10px] rounded-lg border border-[#1e1e1e] bg-[#111111] p-[15px]";

/** FontAwesome brand icons where available — same set as the public profile (halo). */
const BRAND_ICONS: Record<string, typeof faDiscord> = {
  instagram: faInstagram,
  youtube: faYoutube,
  tiktok: faTiktok,
  discord: faDiscord,
  twitter: faXTwitter,
  x: faXTwitter,
  github: faGithub,
  telegram: faTelegram,
  snapchat: faSnapchat,
  reddit: faReddit,
  twitch: faTwitch,
  lastfm: faLastfm,
  spotify: faSpotify,
  bitcoin: faBitcoin,
  ethereum: faEthereum,
  paypal: faPaypal,
  steam: faSteam,
  soundcloud: faSoundcloud,
};

const PLATFORMS = Object.keys(socialIcons).filter((p) => p !== "custom");

/** Brand color per platform so the picker/list icons match each service. */
const SOCIAL_BRAND_COLORS: Record<string, string> = {
  instagram: "#e4405f",
  youtube: "#ff0000",
  tiktok: "#25f4ee",
  discord: "#5865f2",
  twitter: "#e6e6e6",
  github: "#ffffff",
  telegram: "#2aabee",
  snapchat: "#fffc00",
  reddit: "#ff4500",
  twitch: "#9146ff",
  lastfm: "#d51007",
  spotify: "#1db955",
  bitcoin: "#f7931a",
  ethereum: "#627eea",
  solana: "#9945ff",
  paypal: "#0070e0",
  steam: "#66c0f4",
  roblox: "#e2231a",
  soundcloud: "#ff5500",
  kick: "#53fc18",
  onlyfans: "#00aff0",
  custom: "#e6e6e6",
};

const PLATFORM_HINTS: Record<string, string> = {
  instagram: "https://instagram.com/username",
  youtube: "https://youtube.com/@channel",
  tiktok: "https://tiktok.com/@username",
  discord: "https://discord.gg/invite",
  twitter: "https://x.com/username",
  github: "https://github.com/username",
  telegram: "https://t.me/username",
  snapchat: "https://snapchat.com/add/username",
  reddit: "https://reddit.com/u/username",
  twitch: "https://twitch.tv/channel",
  spotify: "https://open.spotify.com/…",
  soundcloud: "https://soundcloud.com/…",
  steam: "https://steamcommunity.com/id/…",
  paypal: "https://paypal.me/username",
  custom: "https://your-own-site.com/page",
};

const ICON_BTN =
  "grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-40";

type DialogState = {
  mode: "add" | "edit";
  id?: string;
  platform: string;
  url: string;
  iconUrl: string;
};

function PlatformIcon({ platform, iconUrl, size = 20 }: { platform: string; iconUrl?: string | null; size?: number }) {
  const key = platform.trim().toLowerCase();
  if (key === "custom" && iconUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={iconUrl} alt={platform} style={{ width: size, height: size }} className="rounded-[4px] object-cover" />;
  }
  const brand = BRAND_ICONS[key];
  if (brand) {
    return <FontAwesomeIcon icon={brand} style={{ width: size, height: size }} aria-hidden="true" />;
  }
  // Fallback to the inline path set (kick, onlyfans, roblox, solana…) then a letter tile.
  const path = socialIcons[key];
  if (!path) {
    return (
      <span
        className="grid shrink-0 place-content-center rounded-[4px] bg-[#2a2a2a] font-bold text-white"
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        {platform[0]?.toUpperCase() ?? "?"}
      </span>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: size, height: size }} className="block shrink-0">
      <path d={path} />
    </svg>
  );
}

function normalizeUrl(input: string): string | null {
  let clean = input.trim();
  if (!clean) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(clean)) clean = `https://${clean}`;
  try {
    const u = new URL(clean);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function shortDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function SocialsClient({ initial }: { initial: SocialRow[] }) {
  const router = useRouter();
  const { pushToast } = useToastStack();

  const [rows, setRows] = useState<SocialRow[]>(initial);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [armedDelete, setArmedDelete] = useState<string | null>(null);
  const dragFrom = useRef<number | null>(null);

  const have = useMemo(() => new Set(rows.map((r) => r.platform.toLowerCase())), [rows]);
  const totalClicks = useMemo(() => rows.reduce((n, r) => n + (r.clicks ?? 0), 0), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PLATFORMS;
    return PLATFORMS.filter(
      (p) => p.includes(q) || getPlatformName(p).toLowerCase().includes(q)
    );
  }, [query]);

  async function persistSocials(next: Array<{ platform: string; url: string; iconUrl: string | null; order: number }>) {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ socialLinks: next }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Could not save.");
    }
  }

  function toPayload(list: SocialRow[]) {
    return list.map((r, i) => ({ platform: r.platform, url: r.url, iconUrl: r.iconUrl, order: i }));
  }

  async function refreshSocials() {
    const res = await fetch("/api/profile", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    const fresh: SocialRow[] = (data?.socialLinks ?? []).map(
      (r: { id: string; platform: string; url: string; iconUrl: string | null; clicks: number | null }) => ({
        id: r.id,
        platform: r.platform,
        url: r.url,
        iconUrl: r.iconUrl,
        clicks: r.clicks ?? 0,
      })
    );
    setRows(fresh);
  }

  function openAdd(platform: string) {
    setDialog({ mode: "add", platform, url: "", iconUrl: "" });
    setError(null);
  }

  function openEdit(row: SocialRow) {
    setDialog({ mode: "edit", id: row.id, platform: row.platform, url: row.url, iconUrl: row.iconUrl ?? "" });
    setError(null);
  }

  async function saveDialog() {
    if (!dialog || busy) return;
    const normalized = normalizeUrl(dialog.url);
    if (!normalized) {
      setError("Enter a valid URL — e.g. https://instagram.com/username");
      return;
    }
    if (dialog.platform === "custom" && !dialog.iconUrl.trim()) {
      setError("Custom links need an icon URL so they show on your profile.");
      return;
    }
    // Prevent duplicate platforms (custom can repeat).
    const key = dialog.platform.toLowerCase();
    if (dialog.mode === "add" && key !== "custom" && have.has(key)) {
      setError(`${getPlatformName(dialog.platform)} is already added. Edit it below instead.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let next: SocialRow[];
      if (dialog.mode === "add") {
        next = [
          ...rows,
          {
            id: `tmp-${Date.now()}`,
            platform: dialog.platform,
            url: normalized.slice(0, 2000),
            iconUrl: dialog.platform === "custom" ? dialog.iconUrl.trim().slice(0, 2000) : null,
            clicks: 0,
          },
        ];
      } else {
        next = rows.map((r) =>
          r.id === dialog.id
            ? {
                ...r,
                url: normalized.slice(0, 2000),
                iconUrl: dialog.platform === "custom" ? dialog.iconUrl.trim().slice(0, 2000) : null,
              }
            : r
        );
      }
      await persistSocials(toPayload(next));
      await refreshSocials();
      setDialog(null);
      pushToast(dialog.mode === "add" ? "Social added!" : "Link updated!");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function removeSocial(id: string) {
    if (armedDelete !== id) {
      setArmedDelete(id);
      window.setTimeout(() => setArmedDelete((cur) => (cur === id ? null : cur)), 3000);
      return;
    }
    setArmedDelete(null);
    const prev = rows;
    const next = rows.filter((r) => r.id !== id);
    setRows(next);
    setRowBusy(id);
    try {
      await persistSocials(toPayload(next));
      await refreshSocials();
      pushToast("Social removed.");
      router.refresh();
    } catch {
      setRows(prev);
      pushToast("Could not delete.");
    } finally {
      setRowBusy(null);
    }
  }

  async function moveRow(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= rows.length || busy) return;
    const prev = rows;
    const next = [...rows];
    const [item] = next.splice(index, 1);
    next.splice(j, 0, item);
    setRows(next);
    setBusy(true);
    try {
      await persistSocials(toPayload(next));
      await refreshSocials();
      router.refresh();
    } catch {
      setRows(prev);
      pushToast("Could not reorder.");
    } finally {
      setBusy(false);
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      pushToast("Link copied!");
    } catch {
      pushToast("Could not copy.");
    }
  }

  const dialogHint = dialog ? (PLATFORM_HINTS[dialog.platform.toLowerCase()] ?? "https://…") : "https://…";

  return (
    <div className="flex w-full flex-col">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="m-0 flex items-center gap-2 text-[19px] font-[500] text-[#dddddd]">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="text-[22px] text-pink-400">
              <path fill="currentColor" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71a5 5 0 0 0-1.7 3.29a5 5 0 0 0 3.95 3.53m-2 0a5 5 0 0 0-3.95-3.53a5 5 0 0 0-1.7-3.29l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71a5 5 0 0 0 1.87-1.54Z" />
            </svg>
            Link your social media profiles.
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full border border-pink-500/40 bg-[#1e1e1e] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white">
              {rows.length} {rows.length === 1 ? "link" : "links"}
            </span>
            <span
              title="Total clicks across all social links"
              className="rounded-full bg-[#1e1e1e] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-[#a5a5a5]"
            >
              {totalClicks.toLocaleString()} clicks
            </span>
          </div>
        </div>
        <h3 className="m-0 ml-[3px] mt-1 text-[14px] font-[450] text-[#8a8a8a]">
          Pick a social media to add to your profile. Drag rows or use arrows to reorder.
        </h3>

        <div className="mt-[15px] rounded-lg border border-[#1e1e1e] bg-[#111111] p-[15px]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#555]">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search platforms…"
                spellCheck={false}
                autoComplete="off"
                aria-label="Search platforms"
                className="w-full rounded-md border-2 border-transparent bg-[#0c0c0c] py-2.5 pl-9 pr-3 text-[14px] text-white outline-none placeholder:text-[#555] focus:border-pink-500/70"
              />
            </div>
            <button
              type="button"
              onClick={() => openAdd("custom")}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-[#222] bg-[#0c0c0c] px-3 py-2.5 text-left text-[#e6e6e6] transition hover:border-pink-500/60 hover:bg-[#141414] active:translate-y-[2px]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span className="block text-[13px] font-semibold text-white">Add Custom URL</span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {filtered.map((p) => {
              const taken = have.has(p);
              return (
                <button
                  key={p}
                  type="button"
                  disabled={taken}
                  title={taken ? `${getPlatformName(p)} — already added` : `Add ${getPlatformName(p)}`}
                  onClick={() => openAdd(p)}
                  style={{ color: SOCIAL_BRAND_COLORS[p] ?? "#e6e6e6" }}
                  className={`relative grid cursor-pointer place-items-center gap-1 rounded-md border-2 px-2 py-3 transition active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-30 ${
                    taken
                      ? "border-[#1e1e1e] bg-[#101010]"
                      : "border-[#222] bg-[#0c0c0c] hover:border-pink-500/60 hover:bg-[#141414] hover:shadow-[0_0_0_1px_rgba(244,114,182,0.25)]"
                  }`}
                >
                  <PlatformIcon platform={p} />
                  <span className="max-w-full truncate text-[11px] font-medium text-[#bebebe]">
                    {getPlatformName(p)}
                  </span>
                  {taken ? (
                    <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-pink-600 text-[10px] font-bold text-white" aria-label="Added">
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {filtered.length === 0 ? (
            <p className="m-0 mt-3 text-center text-[13px] text-[#707070]">
              No platforms match “{query.trim()}”. Try another search or add a custom URL.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-[25px]">
        <div className="flex items-baseline gap-2">
          <span className={SECTION_LABEL}>Social Links</span>
          {rows.length > 1 ? (
            <span className="text-[12px] text-[#707070]">drag handle or ↑ ↓ to reorder — saves automatically</span>
          ) : null}
        </div>
        <div className={CARD}>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <span className="grid size-12 place-items-center rounded-lg bg-[#1a1a1a] text-pink-400/70 ring-1 ring-pink-500/25">
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </span>
              <p className="m-0 mt-3 text-[15px] font-semibold text-white">No links yet</p>
              <p className="m-0 mt-1 max-w-[320px] text-[13px] leading-relaxed text-[#8a8a8a]">
                Pick a platform above to add your first link. It will appear on your public profile instantly.
              </p>
            </div>
          ) : (
            rows.map((s, i) => {
              const key = s.platform.trim().toLowerCase();
              const armed = armedDelete === s.id;
              return (
                <div
                  key={s.id}
                  draggable={busy || rowBusy !== null ? false : true}
                  onDragStart={() => {
                    dragFrom.current = i;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    const from = dragFrom.current;
                    dragFrom.current = null;
                    if (from === null || from === i || busy) return;
                    const prev = rows;
                    const next = [...rows];
                    const [item] = next.splice(from, 1);
                    next.splice(i, 0, item);
                    setRows(next);
                    setBusy(true);
                    persistSocials(toPayload(next))
                      .then(refreshSocials)
                      .then(() => router.refresh())
                      .catch(() => {
                        setRows(prev);
                        pushToast("Could not reorder.");
                      })
                      .finally(() => setBusy(false));
                  }}
                  className="flex items-center gap-2 rounded-lg border-2 border-[#1c1c1c] bg-[#0c0c0c] p-3 transition-colors hover:border-[#2c2c2c] sm:gap-3"
                >
                  <span
                    title="Drag to reorder"
                    className="hidden shrink-0 cursor-grab touch-none select-none text-[#444] hover:text-[#888] active:cursor-grabbing sm:block"
                    aria-hidden="true"
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
                      <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
                      <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
                    </svg>
                  </span>
                  <span className="hidden w-6 shrink-0 text-right text-[11px] font-semibold tabular-nums text-[#555] sm:block">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="grid size-10 shrink-0 place-content-center rounded-md bg-[#1a1a1a] ring-1 ring-pink-500/20"
                    style={{ color: SOCIAL_BRAND_COLORS[key] ?? "#e6e6e6" }}
                  >
                    <PlatformIcon platform={s.platform} iconUrl={s.iconUrl} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-[15px] font-medium text-white">
                      {getPlatformName(s.platform)}
                    </p>
                    <p className="m-0 truncate text-[12px] text-[#707070]" title={s.url}>
                      {shortDomain(s.url)} <span className="opacity-60">·</span> <span className="opacity-80">{s.url}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                    <span
                      title={`${s.clicks.toLocaleString()} clicks`}
                      className="rounded-full bg-[#1e1e1e] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white"
                    >
                      {s.clicks.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      aria-label="Move up"
                      title="Move up"
                      disabled={busy || i === 0}
                      onClick={() => moveRow(i, -1)}
                      className={`${ICON_BTN} border-[#2a2a2a] bg-[#1a1a1a] text-[#bebebe] hover:border-pink-500/50 hover:bg-[#211419]`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      title="Move down"
                      disabled={busy || i === rows.length - 1}
                      onClick={() => moveRow(i, 1)}
                      className={`${ICON_BTN} border-[#2a2a2a] bg-[#1a1a1a] text-[#bebebe] hover:border-pink-500/50 hover:bg-[#211419]`}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label={`Copy ${s.platform} link`}
                      title="Copy link"
                      onClick={() => copyUrl(s.url)}
                      className={`${ICON_BTN} border-[#2a2a2a] bg-[#1a1a1a] text-[#bebebe] hover:border-pink-500/50 hover:bg-[#211419]`}
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                    </button>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${s.platform} link`}
                      title="Open link"
                      className={`${ICON_BTN} place-items-center border-[#2a2a2a] bg-[#1a1a1a] text-[#bebebe] hover:border-pink-500/50 hover:bg-[#211419]`}
                      style={{ display: "grid" }}
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17 17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    </a>
                    <button
                      type="button"
                      aria-label={`Edit ${s.platform}`}
                      title="Edit"
                      onClick={() => openEdit(s)}
                      className={`${ICON_BTN} border-[#2a2a2a] bg-[#1a1a1a] text-[#bebebe] hover:border-pink-500/50 hover:bg-[#211419]`}
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label={armed ? `Click again to confirm remove ${s.platform}` : `Remove ${s.platform}`}
                      title={armed ? "Click again to confirm" : "Remove"}
                      onClick={() => removeSocial(s.id)}
                      disabled={rowBusy === s.id}
                      className={`${ICON_BTN} ${
                        armed
                          ? "border-[#f87171] bg-[#f87171] text-black"
                          : "border-[#3a1d1d] bg-[#2a1515] text-[#f87171] hover:bg-[#3a1d1d]"
                      } ${armed ? "w-auto px-2 text-[12px] font-bold" : ""}`}
                    >
                      {armed ? (
                        "Sure?"
                      ) : (
                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <Modal
        open={dialog !== null}
        onClose={() => {
          if (!busy) setDialog(null);
        }}
        title={dialog ? (dialog.mode === "add" ? `Add ${getPlatformName(dialog.platform)}` : `Edit ${getPlatformName(dialog.platform)}`) : ""}
        subtitle={dialog?.mode === "edit" ? "Update the URL below — order and clicks stay in place." : undefined}
        maxWidth="max-w-[36rem]"
      >
        {dialog && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveDialog();
            }}
          >
            <div className="flex items-center gap-3 rounded-md border border-pink-500/30 bg-[#0e0e0e] p-3">
              <span
                className="grid size-10 shrink-0 place-content-center rounded-md bg-[#1a1a1a]"
                style={{ color: SOCIAL_BRAND_COLORS[dialog.platform.trim().toLowerCase()] ?? "#e6e6e6" }}
              >
                <PlatformIcon
                  platform={dialog.platform}
                  iconUrl={dialog.mode === "add" || dialog.platform === "custom" ? dialog.iconUrl || undefined : undefined}
                />
              </span>
              <div className="min-w-0">
                <p className="m-0 text-[15px] font-semibold text-white">{getPlatformName(dialog.platform)}</p>
                <p className="m-0 truncate text-[12px] text-[#707070]">
                  {dialog.url.trim() ? shortDomain(normalizeUrl(dialog.url) ?? dialog.url) : dialogHint}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <p className="m-0 mb-1.5 ml-1 text-[13px] font-medium text-[#c9c9c9]">Link URL</p>
                <input
                  value={dialog.url}
                  onChange={(e) => {
                    setDialog({ ...dialog, url: e.target.value });
                    if (error) setError(null);
                  }}
                  placeholder={dialogHint}
                  spellCheck={false}
                  autoComplete="off"
                  autoFocus
                  inputMode="url"
                  className="w-full rounded-md border-2 border-transparent bg-[#0c0c0c] p-3 text-[15px] text-white outline-none placeholder:text-[#555] focus:border-pink-500/70"
                />
              </div>
              {dialog.platform === "custom" && (
                <div>
                  <p className="m-0 mb-1.5 ml-1 text-[13px] font-medium text-[#c9c9c9]">Icon image URL</p>
                  <input
                    value={dialog.iconUrl}
                    onChange={(e) => {
                      setDialog({ ...dialog, iconUrl: e.target.value });
                      if (error) setError(null);
                    }}
                    placeholder="https://…/icon.png"
                    spellCheck={false}
                    autoComplete="off"
                    inputMode="url"
                    className="w-full rounded-md border-2 border-transparent bg-[#0c0c0c] p-3 text-[15px] text-white outline-none placeholder:text-[#555] focus:border-pink-500/70"
                  />
                </div>
              )}
            </div>
            {error ? <p className="m-0 mt-2 text-[13px] text-[#f87171]">{error}</p> : null}
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setDialog(null)} disabled={busy} className={`${modalGhostBtn} flex-1`}>
                {dialog.mode === "add" ? "Back" : "Cancel"}
              </button>
              <button type="submit" disabled={busy || !dialog.url.trim()} className={`${modalPrimaryBtn} flex-1`}>
                {busy ? "Saving…" : dialog.mode === "add" ? "Add Social" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
