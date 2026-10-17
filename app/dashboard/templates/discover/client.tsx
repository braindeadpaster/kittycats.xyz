"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Modal, { modalGhostBtn, modalPrimaryBtn } from "@/components/dashboard/modal";
import Dropdown from "@/components/dashboard/dropdown";
import { useToastStack } from "@/components/ui/toast-stack";
import Tooltip from "@/components/ui/tooltip";
import ProfileCard from "@/components/profile/profile-card";

export interface DiscoverTemplate {
  id: string;
  name: string;
  previewUrl: string | null;
  tags: string[];
  premiumOnly: boolean;
  useCount: number;
  createdAt: string;
  ownerUsername: string;
  ownerDisplayName: string | null;
  ownerAvatarUrl: string | null;
  mine: boolean;
  favCount: number;
}

type Tab = "library" | "favorites" | "lastUsed" | "uploads";
type Sort = "trending" | "newest" | "oldest" | "free" | "premium";

const SORTS: Array<{ id: Sort; label: string }> = [
  { id: "trending", label: "Trending" },
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "free", label: "Free" },
  { id: "premium", label: "Premium Only" },
];

const PAGE_SIZE = 12;

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 12 12"
      className="size-[28px]"
      style={{ marginLeft: 1 }}
    >
      <path
        fill={filled ? "#fbbf24" : "currentColor"}
        d="M5.283 1.546a.8.8 0 0 1 1.435 0L7.83 3.798l2.486.361a.8.8 0 0 1 .443 1.365L8.96 7.277l.425 2.476a.8.8 0 0 1-1.16.844L6 9.427l-2.224 1.17a.8.8 0 0 1-1.16-.844l.424-2.476l-1.799-1.753a.8.8 0 0 1 .444-1.365l2.486-.36zm.718.806l-.98 1.983a.8.8 0 0 1-.601.438l-2.19.318l1.585 1.544a.8.8 0 0 1 .23.708l-.374 2.18l1.958-1.03a.8.8 0 0 1 .744 0l1.958 1.03l-.374-2.18a.8.8 0 0 1 .23-.708L9.771 5.09l-2.189-.318a.8.8 0 0 1-.602-.438z"
      />
    </svg>
  );
}

interface CreatePreview {
  profile: {
    avatarUrl: string | null;
    displayName: string;
    bio: string;
    accentColor: string;
    textColor: string;
    backgroundColor: string;
  };
  socials: Array<{ platform: string; url: string; iconUrl: string | null }>;
  links: Array<{ title: string }>;
}

/** 1:1 live render of the user's profile card, scaled to fit the modal. */
function TemplateLivePreview({ data }: { data: CreatePreview }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, el.clientWidth / 440));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={wrapRef} className="overflow-hidden rounded-lg border-2 border-[#1e1e1e]" style={{ height: 260 }}>
      <div style={{ width: 440, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <ProfileCard
          user={{ id: 0, username: "you" }}
          profile={data.profile as never}
          socials={data.socials.map((s, i) => ({ id: `preview-social-${i}`, ...s }))}
          links={data.links.map((l, i) => ({ id: `preview-link-${i}`, title: l.title, url: null }))}
          viewCount={0}
          preview
          feedback={null}
        />
      </div>
    </div>
  );
}

function MockPreview({ name, seed }: { name: string; seed: string }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return (
    <div
      className="flex h-[190px] w-full flex-col items-center justify-center gap-2 p-4"
      style={{ background: `linear-gradient(135deg, hsl(${h}, 45%, 22%), hsl(${(h + 60) % 360}, 50%, 10%))` }}
    >
      <div className="size-12 rounded-full bg-white/25" />
      <div className="h-2.5 w-24 rounded-full bg-white/40" />
      <div className="h-2 w-40 rounded-full bg-white/20" />
      <div className="mt-1 h-7 w-44 rounded-lg bg-white/15" />
      <span className="mt-1 max-w-full truncate px-2 text-[11px] font-semibold text-white/70">{name}</span>
    </div>
  );
}

export default function DiscoverClient({
  templates,
  myFavs,
  lastUsedIds,
  username,
  isPremium,
}: {
  templates: DiscoverTemplate[];
  myFavs: string[];
  lastUsedIds: string[];
  username: string;
  isPremium: boolean;
}) {
  const router = useRouter();
  const { pushToast } = useToastStack();

  const [tab, setTab] = useState<Tab>("library");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("trending");
  const [sortOpen, setSortOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [favs, setFavs] = useState<Set<string>>(new Set(myFavs));
  const [favCounts, setFavCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(templates.map((t) => [t.id, t.favCount]))
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmTpl, setConfirmTpl] = useState<DiscoverTemplate | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cTags, setCTags] = useState<string[]>([]);
  const [cTagInput, setCTagInput] = useState("");
  const [cVisibility, setCVisibility] = useState<"public" | "unlisted">("public");
  const [cVisOpen, setCVisOpen] = useState(false);
  const [cError, setCError] = useState<string | null>(null);
  const [cPreview, setCPreview] = useState<CreatePreview | null>(null);
  const [cPreviewLoading, setCPreviewLoading] = useState(false);

  const trendingIds = useMemo(() => {
    const sorted = [...templates].sort((a, b) => b.useCount - a.useCount);
    return new Set(sorted.slice(0, 3).map((t) => t.id));
  }, [templates]);

  const filtered = useMemo(() => {
    let list = [...templates];
    if (tab === "favorites") list = list.filter((t) => favs.has(t.id));
    else if (tab === "uploads") list = list.filter((t) => t.mine);
    else if (tab === "lastUsed") {
      const order = new Map(lastUsedIds.map((id, i) => [id, i] as const));
      list = list.filter((t) => order.has(t.id)).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.ownerUsername.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    switch (sort) {
      case "newest":
        list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      case "oldest":
        list.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        break;
      case "free":
        list = list.filter((t) => !t.premiumOnly);
        list.sort((a, b) => b.useCount - a.useCount);
        break;
      case "premium":
        list = list.filter((t) => t.premiumOnly);
        list.sort((a, b) => b.useCount - a.useCount);
        break;
      default:
        list.sort((a, b) => b.useCount - a.useCount);
        break;
    }
    return list;
  }, [templates, tab, favs, lastUsedIds, query, sort]);

  const shown = filtered.slice(0, visible);

  async function toggleFav(t: DiscoverTemplate) {
    const was = favs.has(t.id);
    setFavs((f) => {
      const n = new Set(f);
      if (was) n.delete(t.id);
      else n.add(t.id);
      return n;
    });
    setFavCounts((c) => ({ ...c, [t.id]: Math.max(0, (c[t.id] ?? 0) + (was ? -1 : 1)) }));
    try {
      const res = await fetch("/api/templates/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFavs((f) => {
        const n = new Set(f);
        if (was) n.add(t.id);
        else n.delete(t.id);
        return n;
      });
      setFavCounts((c) => ({ ...c, [t.id]: Math.max(0, (c[t.id] ?? 0) + (was ? 1 : -1)) }));
    }
  }

  async function useTemplate(t: DiscoverTemplate) {
    setBusyId(t.id);
    try {
      const res = await fetch("/api/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not apply template.");
      pushToast(data?.premiumStripped ? "Template applied! (Custom layout needs Premium)" : "Template applied to your profile!");
      setConfirmTpl(null);
      router.refresh();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Could not apply template.");
    } finally {
      setBusyId(null);
    }
  }

  function copyLink(t: DiscoverTemplate) {
    const url = `${window.location.origin}/${encodeURIComponent(username)}?templatePreview=true&templateId=${t.id}`;
    navigator.clipboard?.writeText(url).then(
      () => pushToast("Template link copied!"),
      () => pushToast("Could not copy link.")
    );
  }

  async function openCreate() {
    setCError(null);
    setCreateOpen(true);
    setCPreview(null);
    setCPreviewLoading(true);
    try {
      const [pRes, lRes] = await Promise.all([
        fetch("/api/profile", { cache: "no-store" }),
        fetch("/api/links", { cache: "no-store" }),
      ]);
      const p = await pRes.json().catch(() => null);
      const l = await lRes.json().catch(() => null);
      const profile = p?.profile ?? {};
      setCPreview({
        profile: {
          avatarUrl: profile.avatarUrl ?? null,
          displayName: profile.displayName || username,
          bio: profile.bio ?? "",
          accentColor: profile.accentColor ?? "#ffffff",
          textColor: profile.textColor ?? "#ffffff",
          backgroundColor: profile.backgroundColor ?? "#111111",
        },
        socials: (p?.socialLinks ?? []).map((s: { platform: string; url: string; iconUrl: string | null }) => ({
          platform: s.platform,
          url: s.url,
          iconUrl: s.iconUrl,
        })),
        links: (l?.links ?? []).map((x: { title: string }) => ({ title: x.title })),
      });
    } catch {
      setCPreview(null);
    } finally {
      setCPreviewLoading(false);
    }
  }

  function addTag() {
    const clean = cTagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 15);
    if (!clean || cTags.includes(clean) || cTags.length >= 6) return;
    setCTags((t) => [...t, clean]);
    setCTagInput("");
  }

  async function createTemplate() {
    if (!cName.trim()) {
      setCError("Give your template a name.");
      return;
    }
    setBusyId("create");
    setCError(null);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cName.trim(), tags: cTags.join(","), visibility: cVisibility }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not create template.");
      setCreateOpen(false);
      setCName("");
      setCTags([]);
      setCTagInput("");
      setCVisibility("public");
      pushToast("Template published!");
      router.refresh();
    } catch (e) {
      setCError(e instanceof Error ? e.message : "Could not create template.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTemplate(t: DiscoverTemplate) {
    setBusyId(t.id);
    try {
      const res = await fetch(`/api/templates?id=${encodeURIComponent(t.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      pushToast("Template deleted.");
      router.refresh();
    } catch {
      pushToast("Could not delete template.");
    } finally {
      setBusyId(null);
    }
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "library", label: "Template Library" },
    { id: "favorites", label: "Favorite Templates" },
    { id: "lastUsed", label: "Last Used Templates" },
    { id: "uploads", label: "My Templates" },
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <div className="rounded-lg border border-[#1a1a1a] bg-[#111111] p-5">
        <h1 className="m-0 text-[20px] font-semibold text-[#f2f2f2]">
          Discover the perfect egirls.lol Template for your Profile
        </h1>
        <p className="m-0 mt-1 text-[14px] font-light text-[#8a8a8a]">
          Browse community-created templates, or design your own to share with the egirls.lol community.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setVisible(PAGE_SIZE);
              }}
              className={`cursor-pointer rounded-md border-2 px-3 py-2 text-[14px] font-medium transition ${
                tab === t.id
                  ? "border-[#7e2c8b7c] bg-[#7e2c8b40] text-white"
                  : "border-[#1e1e1e] bg-[#111111] text-[#a1a1a1] hover:border-[#2a2a2a] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="cursor-pointer rounded-md border-2 border-pink-500/60 bg-pink-600 px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-pink-500 active:translate-y-[2px]"
        >
          Create Template
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#666]">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
              <path fill="currentColor" d="m19.6 21l-6.3-6.3q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l6.3 6.3zM9.5 14q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={40}
            placeholder="Explore community-created templates"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border-2 border-transparent bg-[#0c0c0c] p-[10px_12px_10px_40px] text-[15px] text-[#eee] outline-none transition placeholder:text-[#555] hover:border-[#191919] focus:border-pink-500/60"
          />
        </div>
        <div className="shrink-0 sm:w-[180px]">
          <Dropdown
            open={sortOpen}
            onOpenChange={setSortOpen}
            label={SORTS.find((s) => s.id === sort)?.label}
            ariaLabel="Sort templates"
          >
            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSort(s.id);
                  setSortOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2.5 text-left text-[14px] transition-colors ${
                  sort === s.id ? "font-medium text-white" : "text-[#dcdcdc] hover:bg-[#1b1b1b]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </Dropdown>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-lg border-2 border-[#1c1c1c] bg-[#111111] p-10 text-center">
          <p className="m-0 text-[16px] font-medium text-[#e6e6e6]">No templates found</p>
          <p className="m-0 mt-1 text-[13px] font-light text-[#8a8a8a]">
            {tab === "uploads" ? "Publish your first template with Create Template." : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((t) => {
            const fav = favs.has(t.id);
            const displayName = t.ownerDisplayName || t.ownerUsername;
            return (
              <div key={t.id} className="flex min-w-0 flex-col overflow-hidden rounded-lg border-2 border-[#1c1c1c] bg-[#111111]">
                <div className="relative">
                  {t.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.previewUrl} alt={`${t.name} preview`} draggable={false} className="h-[190px] w-full object-cover" />
                  ) : (
                    <MockPreview name={t.name} seed={t.id} />
                  )}
                  <button
                    type="button"
                    onClick={() => toggleFav(t)}
                    aria-label={fav ? "Unfavorite template" : "Favorite template"}
                    title={fav ? "Unfavorite template" : "Favorite template"}
                    className={`absolute right-2 top-2 cursor-pointer transition hover:scale-110 active:translate-y-[2px] ${
                      fav ? "text-[#fbbf24]" : "text-[#5a5a5a] hover:text-white"
                    }`}
                  >
                    <StarIcon filled={fav} />
                  </button>
                  {t.premiumOnly ? (
                    <span className="absolute left-2 top-2 rounded-full border border-pink-500/60 bg-pink-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                      Premium
                    </span>
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {t.ownerAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.ownerAvatarUrl} alt="" className="size-9 shrink-0 rounded-full border border-[#222] object-cover" />
                    ) : (
                      <span className="grid size-9 shrink-0 place-content-center rounded-full bg-[#2a2a2a] text-[15px] font-bold text-white">
                        {displayName[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="m-0 truncate text-[15px] font-semibold text-white">{t.name}</p>
                      <p className="m-0 truncate text-[12px] text-[#8a8a8a]">@{t.ownerUsername}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#8a8a8a]">
                    <span className="tabular-nums">{t.useCount.toLocaleString()} uses</span>
                    {trendingIds.has(t.id) ? <span className="font-medium text-[#d7a2e6]">Trending</span> : null}
                    <span className="tabular-nums">★ {(favCounts[t.id] ?? 0).toLocaleString()}</span>
                  </div>
                  {t.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {t.tags.slice(0, 5).map((tag) => (
                        <span key={tag} className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[11px] text-[#a1a1a1]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-auto flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setConfirmTpl(t)}
                      className="min-h-[40px] flex-1 cursor-pointer rounded-md border-2 border-pink-500/60 bg-pink-600 px-3 text-[14px] font-semibold text-white transition hover:bg-pink-500 active:translate-y-[2px]"
                    >
                      Use Template
                    </button>
                    <button
                      type="button"
                      onClick={() => copyLink(t)}
                      aria-label="Copy template link"
                      title="Copy template link"
                      className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-md border-2 border-[#222] bg-[#161616] text-[#c9c9c9] transition hover:border-[#3a3a3a] hover:text-white active:translate-y-[2px]"
                    >
                      <svg viewBox="0 0 256 256" fill="currentColor" className="size-[18px]">
                        <path d="M240 88.23a54.43 54.43 0 0 1-16 37L189.25 160a54.27 54.27 0 0 1-38.63 16h-.05A54.63 54.63 0 0 1 96 119.84a8 8 0 0 1 16 .45A38.62 38.62 0 0 0 150.58 160a38.4 38.4 0 0 0 27.31-11.31l34.75-34.75a38.63 38.63 0 0 0-54.63-54.63l-11 11A8 8 0 0 1 135.7 59l11-11a54.65 54.65 0 0 1 77.3 0a54.86 54.86 0 0 1 16 40.23m-131 97.43l-11 11A38.4 38.4 0 0 1 70.6 208a38.63 38.63 0 0 1-27.29-65.94L78 107.31a38.63 38.63 0 0 1 66 28.4a8 8 0 0 0 16 .45A54.86 54.86 0 0 0 144 96a54.65 54.65 0 0 0-77.27 0L32 130.75A54.62 54.62 0 0 0 70.56 224a54.28 54.28 0 0 0 38.64-16l11-11a8 8 0 0 0-11.2-11.34" />
                      </svg>
                    </button>
                    <a
                      href={`/${encodeURIComponent(username)}?templatePreview=true&templateId=${t.id}`}
                      target="_blank"
                      rel="noopener"
                      aria-label="Preview template"
                      title="Preview template"
                      className="grid size-10 shrink-0 place-items-center rounded-md border-2 border-[#222] bg-[#161616] text-[#c9c9c9] no-underline transition hover:border-[#3a3a3a] hover:text-white active:translate-y-[2px]"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-[18px]">
                        <path d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5" />
                      </svg>
                    </a>
                    {t.mine ? (
                      <button
                        type="button"
                        onClick={() => deleteTemplate(t)}
                        disabled={busyId === t.id}
                        aria-label="Delete template"
                        title="Delete template"
                        className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-md border-2 border-[#3a1d1d] bg-[#2a1515] text-[#f87171] transition hover:bg-[#3a1d1d] disabled:opacity-50"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > visible ? (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="mx-auto cursor-pointer rounded-md border-2 border-[#2a2a2a] bg-[#1a1a1a] px-6 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#222] active:translate-y-[2px]"
        >
          Load More
        </button>
      ) : null}

      <Modal
        open={confirmTpl !== null}
        onClose={() => setConfirmTpl(null)}
        title={confirmTpl ? (confirmTpl.premiumOnly && !isPremium ? "This Template is Premium Only!" : `Use ${confirmTpl.name}?`) : ""}
        subtitle={
          confirmTpl
            ? confirmTpl.premiumOnly && !isPremium
              ? "Upgrade to unlock every part of this template."
              : "Replaces your styles, links and socials. Your uploads stay yours."
            : ""
        }
      >
        {confirmTpl && confirmTpl.premiumOnly && !isPremium ? (
          <div>
            <p className="m-0 rounded-md border border-pink-500/60 bg-pink-600/15 p-3 text-[14px] text-[#e6e6e6]">
              This template uses Premium features. Upgrade to apply all of it, or use the free parts.
            </p>
            <div className="mt-4 flex gap-2">
              <a href="/dashboard/premium" className={`${modalPrimaryBtn} flex-1 text-center no-underline`}>
                Upgrade to Premium
              </a>
              <button
                type="button"
                disabled={busyId !== null}
                onClick={() => confirmTpl && useTemplate(confirmTpl)}
                className={`${modalGhostBtn} flex-1`}
              >
                {busyId ? "Applying…" : "Use free parts"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmTpl(null)} className={`${modalGhostBtn} flex-1`}>
              Cancel
            </button>
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => confirmTpl && useTemplate(confirmTpl)}
              className={`${modalPrimaryBtn} flex-1`}
            >
              {busyId ? "Applying…" : "Use Template"}
            </button>
          </div>
        )}
      </Modal>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Template"
        subtitle="Fill in the details. This creates a template based on your current configuration."
        maxWidth="max-w-[500px]"
      >
        <h1 className="m-0 mb-2 text-[15px] font-medium text-[#ddd]">Template Preview</h1>
        {cPreviewLoading || !cPreview ? (
          <div className="h-[190px] w-full animate-pulse rounded-lg bg-[#1c1c1c]" />
        ) : (
          <TemplateLivePreview data={cPreview} />
        )}
        <div className="mt-4 space-y-3">
          <div>
            <p className="m-0 mb-1.5 ml-1 text-[13px] font-medium text-[#c9c9c9]">Template Name</p>
            <input
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              maxLength={30}
              placeholder="My New Template"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-md border-2 border-transparent bg-[#0c0c0c] p-3 text-[15px] text-white outline-none placeholder:text-[#555] focus:border-pink-500/60"
            />
          </div>
          <div>
            <p className="m-0 mb-1.5 ml-1 text-[13px] font-medium text-[#c9c9c9]">Template Tags</p>
            <div className="flex gap-2">
              <input
                value={cTagInput}
                onChange={(e) => setCTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                maxLength={15}
                placeholder="Enter tag"
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 rounded-md border-2 border-transparent bg-[#0c0c0c] p-3 text-[15px] text-white outline-none placeholder:text-[#555] focus:border-pink-500/60"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!cTagInput.trim() || cTags.length >= 6}
                className="grid size-[46px] shrink-0 cursor-pointer place-items-center rounded-md border-2 border-[#2a2a2a] bg-[#1a1a1a] text-[20px] text-white transition hover:bg-[#222] disabled:opacity-40"
                aria-label="Add tag"
              >
                +
              </button>
            </div>
            {cTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {cTags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1.5 rounded-full bg-[#1e1e1e] py-1 pl-3 pr-1.5 text-[12px] text-white">
                    {tag}
                    <button
                      type="button"
                      onClick={() => setCTags((t) => t.filter((x) => x !== tag))}
                      aria-label={`Remove ${tag}`}
                      className="grid size-5 cursor-pointer place-items-center rounded-full text-[#8a8a8a] transition hover:bg-white/10 hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            <p className="m-0 mb-[6px] ml-1 flex items-center gap-1.5 text-[13px] font-medium text-[#c9c9c9]">
              Template Visibility
              <Tooltip label="Public templates appear in the library for everyone. Unlisted templates are only visible to you.">
                <span className="inline-flex cursor-help items-center text-[15px] text-[#bdbdbd]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256">
                    <path fill="#ffffff" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 168a12 12 0 1 1 12-12a12 12 0 0 1-12 12m8-48.72v.72a8 8 0 0 1-16 0v-8a8 8 0 0 1 8-8c13.23 0 24-9 24-20s-10.77-20-24-20s-24 9-24 20v4a8 8 0 0 1-16 0v-4c0-19.85 17.94-36 40-36s40 16.15 40 36c0 17.38-13.76 31.93-32 35.28" />
                  </svg>
                </span>
              </Tooltip>
            </p>
            <Dropdown
              open={cVisOpen}
              onOpenChange={setCVisOpen}
              label={cVisibility === "public" ? "Public" : "Unlisted"}
              ariaLabel="Template visibility"
              buttonClassName="flex w-full cursor-pointer items-center gap-2 rounded-md border-2 border-transparent bg-[#0c0c0c] p-3 text-left text-[15px] text-white transition hover:border-[#1e1e1e]"
            >
              {(["public", "unlisted"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setCVisibility(v);
                    setCVisOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2.5 text-left text-[14px] capitalize transition-colors ${
                    cVisibility === v ? "font-medium text-white" : "text-[#dcdcdc] hover:bg-[#1b1b1b]"
                  }`}
                >
                  {v}
                </button>
              ))}
            </Dropdown>
          </div>
        </div>
        {cError ? <p className="m-0 mt-2 text-[13px] text-[#f87171]">{cError}</p> : null}
        <button
          type="button"
          onClick={createTemplate}
          disabled={busyId !== null || !cName.trim()}
          className={`${modalPrimaryBtn} mt-4 w-full`}
        >
          {busyId === "create" ? "Publishing…" : "Create Template"}
        </button>
      </Modal>
    </div>
  );
}
