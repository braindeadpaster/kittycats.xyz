"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { ColorPickerField } from "@/components/dashboard/appearance/colors-tab";
import {
  btnGradient,
  Card,
  CardContent,
  CardHeader,
  CardTile,
  Divider,
  formLabel,
  inputClass,
  Switch,
  ToggleCard,
} from "@/components/dashboard/ui";
import ProfilePreview from "@/components/dashboard/profile-preview";
import { useToastStack } from "@/components/ui/toast-stack";
import type { FeedbackState } from "@/lib/feedback";
import type {
  ProfileCardBadge,
  ProfileCardLink,
  ProfileCardSocial,
} from "@/components/profile/profile-card";

export interface AppearanceData {
  layout: string | null;
  accentColor: string | null;
  primaryColor: string | null;
  textColor: string | null;
  borderColor: string | null;
  backgroundColor: string | null;
  badgeColor: string | null;
  socialColor: string | null;
  linkHoverColor: string | null;
  borderRadius: number | null;
  borderWidth: number | null;
  cardWidth: number | null;
  cardOpacity: number | null;
  borderOpacity: number | null;
  cardBlurEnabled: number | boolean | null;
  cardBlur: number | null;
  tiltEnabled: number | boolean | null;
  tiltMode: string | null;
  glowEnabled: number | boolean | null;
  overlayEnabled: number | boolean | null;
  overlayText: string | null;
  avatarUrl: string | null;
  backgroundUrl: string | null;
  description: string | null;
  displayName: string | null;
  cursorUrl: string | null;
  blur: number | null;
  showViews: number | boolean | null;
  customLayout: string | null;
  avatarShape: string | null;
  bio: string | null;
  location: string | null;
  occupation: string | null;
}

const TEMPLATES = [
  { id: "classic", label: "Classic", blur: 0, radius: 0 },
  { id: "frosted-square", label: "Frosted Square", blur: 10, radius: 15 },
  { id: "frosted-soft", label: "Frosted Soft", blur: 20, radius: 30 },
] as const;

const DEFAULTS = {
  borderRadius: 25,
  borderWidth: 1,
  cardWidth: 420,
  cardOpacity: 100,
  borderOpacity: 100,
  cardBlur: 2,
  cardBlurEnabled: 1,
};

function crown() {
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.735H5.81a1 1 0 0 1-.957-.735L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
      <path d="M5 21h14" />
    </svg>
  );
}

function PremiumChip() {
  return (
    <span className="flex items-center gap-1 rounded-full border border-pink-500/40 bg-pink-600/15 px-1.5 py-0.5 text-[10px] font-semibold text-pink-300">
      {crown()} Premium
    </span>
  );
}

function PremiumButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push("/dashboard/premium")}
      className="border-foreground/10 text-muted-foreground hover:border-pink-500/40 hover:text-foreground hover:bg-pink-600/5 flex w-full items-center justify-between gap-2 rounded-md border border-dashed bg-transparent px-3 py-2.5 text-sm font-medium transition-colors"
    >
      <span className="flex items-center gap-2">
        {crown()}
        {label}
      </span>
      <PremiumChip />
    </button>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-foreground text-sm font-medium leading-none">{label}</label>
        <span className="text-muted-foreground text-sm tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-pink-600 w-full"
      />
    </div>
  );
}

export default function AppearanceClient({
  profile,
  socials,
  links,
  badges,
  isPremium,
  feedback,
  widgets,
  username,
  userId,
}: {
  profile: AppearanceData | null;
  socials: ProfileCardSocial[];
  links: ProfileCardLink[];
  badges: ProfileCardBadge[];
  isPremium: boolean;
  feedback: FeedbackState | null;
  widgets: Array<{ type: string; config: Record<string, string>; enabled?: boolean }>;
  username?: string;
  userId?: number;
}) {
  const router = useRouter();
  const { pushToast } = useToastStack();

  const [layout, setLayout] = useState<string>(profile?.layout ?? "halo");
  const customActive =
    !!profile?.customLayout &&
    (() => {
      try {
        const parsed = JSON.parse(profile.customLayout);
        return !!parsed?.enabled;
      } catch {
        return false;
      }
    })();

  const [accentColor, setAccentColor] = useState(profile?.accentColor ?? "#ffffff");
  const [textColor, setTextColor] = useState(profile?.textColor ?? "#ffffff");
  const [borderColor, setBorderColor] = useState(profile?.borderColor ?? "#ffffff");
  const [backgroundColor, setBackgroundColor] = useState(profile?.backgroundColor ?? "#111111");
  const [badgeColor, setBadgeColor] = useState(profile?.badgeColor ?? "#ffffff");
  const [socialColor, setSocialColor] = useState(profile?.socialColor ?? "#ffffff");
  const [linkHoverColor, setLinkHoverColor] = useState(profile?.linkHoverColor ?? "#ffffff");

  const [borderRadius, setBorderRadius] = useState(profile?.borderRadius ?? DEFAULTS.borderRadius);
  const [borderWidth, setBorderWidth] = useState(profile?.borderWidth ?? DEFAULTS.borderWidth);
  const [cardWidth, setCardWidth] = useState(profile?.cardWidth ?? DEFAULTS.cardWidth);
  const [cardOpacity, setCardOpacity] = useState(profile?.cardOpacity ?? DEFAULTS.cardOpacity);
  const [borderOpacity, setBorderOpacity] = useState(profile?.borderOpacity ?? DEFAULTS.borderOpacity);
  const [cardBlur, setCardBlur] = useState(profile?.cardBlur ?? DEFAULTS.cardBlur);
  const [cardBlurEnabled, setCardBlurEnabled] = useState(
    Number(profile?.cardBlurEnabled ?? DEFAULTS.cardBlurEnabled) !== 0
  );
  const [advanced, setAdvanced] = useState(false);

  const [tiltEnabled, setTiltEnabled] = useState(Number(profile?.tiltEnabled ?? 0) !== 0);
  const [glowEnabled, setGlowEnabled] = useState(Number(profile?.glowEnabled ?? 0) !== 0);
  const [overlayEnabled, setOverlayEnabled] = useState(Number(profile?.overlayEnabled ?? 0) !== 0);
  const [overlayText, setOverlayText] = useState(profile?.overlayText ?? "Click to show");

  const [saving, setSaving] = useState<string | null>(null);
  const [previewMounted, setPreviewMounted] = useState(false);
  const [previewShown, setPreviewShown] = useState(false);

  const activeTemplate =
    TEMPLATES.find((t) => t.blur === cardBlur && t.radius === borderRadius)?.id ?? null;

  async function save(fields: Record<string, unknown>, tag: string) {
    setSaving(tag);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Could not save.");
      }
      pushToast("Saved!");
      router.refresh();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setSaving(null);
    }
  }

  const openPreview = () => {
    setPreviewMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setPreviewShown(true)));
  };

  const closePreview = useCallback(() => {
    setPreviewShown(false);
    window.setTimeout(() => setPreviewMounted(false), 250);
  }, []);

  useEffect(() => {
    if (!previewMounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewMounted, closePreview]);

  const previewProfile = profile ?? null;

  return (
    <div className="space-y-6 pb-20">
      {/* ------------------------------ Layout ------------------------------ */}
      <Card>
        <CardHeader
          title="Layout"
          description="Pick how your profile card is presented to visitors."
        >
          <svg
            className="text-pink-300 size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setLayout("halo")}
              className={`border-foreground/5 bg-input/30 flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-white/15 ${
                layout === "halo" && !customActive ? "border-pink-500/40 bg-pink-600/10" : ""
              }`}
            >
              <CardTile size="md">
                <div className="bg-pink-600 size-5 rounded-full" />
              </CardTile>
              <div className="min-w-0">
                <p className="text-foreground text-sm font-semibold">Halo</p>
                <p className="text-muted-foreground truncate text-xs">
                  Classic centered card with halo glow.
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled={!isPremium}
              onClick={() => router.push("/dashboard/customize/edit")}
              className={`border-foreground/5 bg-input/30 flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-white/15 disabled:cursor-not-allowed disabled:opacity-60 ${
                customActive ? "border-pink-500/40 bg-pink-600/10" : ""
              }`}
            >
              <CardTile size="md">
                <div className="grid size-5 grid-cols-2 gap-0.5">
                  <div className="bg-pink-600/80 rounded-sm" />
                  <div className="border-pink-500/60 rounded-sm border" />
                  <div className="border-pink-500/60 rounded-sm border" />
                  <div className="bg-pink-600/80 rounded-sm" />
                </div>
              </CardTile>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-foreground text-sm font-semibold">Custom</p>
                  {!isPremium ? <PremiumChip /> : null}
                </div>
                <p className="text-muted-foreground truncate text-xs">
                  Free-move canvas — drag, resize and style everything.
                </p>
              </div>
            </button>
          </div>

          {!isPremium ? (
            <div className="from-pink-600/20 via-pink-600/5 flex items-center justify-between gap-3 rounded-md border border-pink-500/25 bg-gradient-to-r to-transparent p-3">
              <p className="text-foreground/80 text-xs">
                Unlock the free-move canvas editor with Premium.
              </p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/premium")}
                className="bg-pink-600 hover:bg-pink-500 flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white transition-colors"
              >
                {crown()} Upgrade
              </button>
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving !== null}
              onClick={() =>
                save({ layout: "halo", customLayout: null }, "layout")
              }
              className={btnGradient}
            >
              {saving === "layout" ? "Saving…" : "Save Layout"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ---------------------------- Profile Card ---------------------------- */}
      <Card>
        <CardHeader
          title="Profile Card"
          description="Control the shape, size and frost of your card."
        >
          <svg
            className="text-pink-300 size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map((template) => {
              const active = activeTemplate === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setCardBlur(template.blur);
                    setBorderRadius(template.radius);
                    setCardBlurEnabled(template.blur > 0);
                  }}
                  className={`border-foreground/5 bg-input/30 flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-white/15 ${
                    active ? "border-pink-500/40 bg-pink-600/10" : ""
                  }`}
                >
                  <div
                    className="border-white/10 bg-foreground/5 flex h-14 w-10 items-center justify-center rounded-lg border"
                    style={{
                      borderRadius: `${Math.min(template.radius, 16)}px`,
                      backdropFilter: template.blur > 0 ? `blur(${template.blur}px)` : undefined,
                    }}
                  >
                    <div className="bg-pink-600 size-3 rounded-full" />
                  </div>
                  <p className={`text-xs font-semibold ${active ? "text-pink-300" : "text-foreground"}`}>
                    {template.label}
                  </p>
                </button>
              );
            })}
          </div>

          <Divider />

          <div className="flex items-center justify-between gap-2.5 rounded-lg border border-foreground/5 bg-input/30 p-3">
            <div>
              <p className="text-foreground text-sm font-medium leading-none">Advanced</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Fine-tune the card with custom values.
              </p>
            </div>
            <Switch
              checked={advanced}
              onCheckedChange={setAdvanced}
              label="Advanced"
            />
          </div>

          {advanced ? (
            <div className="space-y-5 rounded-lg border border-foreground/5 bg-input/20 p-4">
              <SliderRow
                label="Border Radius"
                value={borderRadius}
                min={0}
                max={48}
                unit="px"
                onChange={setBorderRadius}
              />
              <SliderRow
                label="Card Width"
                value={cardWidth}
                min={280}
                max={640}
                step={10}
                unit="px"
                onChange={setCardWidth}
              />
              <SliderRow
                label="Border Width"
                value={borderWidth}
                min={0}
                max={4}
                unit="px"
                onChange={setBorderWidth}
              />
              <SliderRow
                label="Border Opacity"
                value={borderOpacity}
                min={0}
                max={100}
                unit="%"
                onChange={setBorderOpacity}
              />
              <SliderRow
                label="Card Opacity"
                value={cardOpacity}
                min={10}
                max={100}
                unit="%"
                onChange={setCardOpacity}
              />
              <div className="space-y-3">
                <ToggleCard
                  label="Card Blur"
                  checked={cardBlurEnabled}
                  onCheckedChange={setCardBlurEnabled}
                />
                {cardBlurEnabled ? (
                  <SliderRow
                    label="Blur Amount"
                    value={cardBlur}
                    min={0}
                    max={40}
                    unit="px"
                    onChange={setCardBlur}
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving !== null}
              onClick={() =>
                save(
                  {
                    borderRadius,
                    borderWidth,
                    cardWidth,
                    cardOpacity,
                    borderOpacity,
                    cardBlurEnabled: cardBlurEnabled ? 1 : 0,
                    cardBlur,
                  },
                  "card"
                )
              }
              className={btnGradient}
            >
              {saving === "card" ? "Saving…" : "Save Card"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------ Colors ------------------------------ */}
      <Card>
        <CardHeader
          title="Colors"
          description="Tint every part of your profile card."
        >
          <svg
            className="text-pink-300 size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ColorPickerField
              label="Card Accent"
              description="Main accent used for the halo and highlights."
              value={accentColor}
              onChange={setAccentColor}
            />
            <Divider />
            <ColorPickerField
              label="Text"
              description="Username, bio and link text."
              value={textColor}
              onChange={setTextColor}
            />
            <Divider />
            <ColorPickerField
              label="Border"
              description="Outer glow ring around your card."
              value={borderColor}
              onChange={setBorderColor}
            />
            <Divider />
            <ColorPickerField
              label="Background"
              description="Card background when no image is set."
              value={backgroundColor}
              onChange={setBackgroundColor}
            />
            <Divider />
            <ColorPickerField
              label="Badges"
              description="Default color for all of your badges."
              value={badgeColor}
              onChange={setBadgeColor}
            />
            <Divider />
            <ColorPickerField
              label="Social Icons"
              description="Color of the social link icons."
              value={socialColor}
              onChange={setSocialColor}
            />
            <Divider />
            <ColorPickerField
              label="Link Hover"
              description="Tint applied when hovering your links."
              value={linkHoverColor}
              onChange={setLinkHoverColor}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving !== null}
              onClick={() =>
                save(
                  {
                    accentColor,
                    textColor,
                    borderColor,
                    backgroundColor,
                    badgeColor,
                    socialColor,
                    linkHoverColor,
                  },
                  "colors"
                )
              }
              className={btnGradient}
            >
              {saving === "colors" ? "Saving…" : "Save Colors"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ---------------------------- Enhancements ---------------------------- */}
      <Card>
        <CardHeader
          title="Enhancements"
          description="Extra flair for your profile."
        >
          <svg
            className="text-pink-300 size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            <path d="M20 3v4" />
            <path d="M22 5h-4" />
            <path d="M4 17v2" />
            <path d="M5 18H3" />
          </svg>
        </CardHeader>
        <CardContent>
          {isPremium ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <PremiumButton label="Name Effect" />
                <PremiumButton label="Bio Effect" />
              </div>

              <Divider />

              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Page Overlays
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <PremiumButton label="Shooting Stars" />
                <PremiumButton label="Cursor Trail" />
                <PremiumButton label="Background Effect" />
              </div>

              <Divider />
            </>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <ToggleCard
              label="Animate Views"
              checked={false}
              onCheckedChange={() => {}}
              disabled
              icon={
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
                </svg>
              }
            />
            <ToggleCard
              label="Tilting Card"
              checked={tiltEnabled}
              onCheckedChange={setTiltEnabled}
              icon={
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v18" />
                  <rect width="18" height="18" x="3" y="3" rx="2" transform="rotate(8 12 12)" />
                </svg>
              }
            />
            {isPremium ? (
            <ToggleCard
              label="Glow icons"
              checked={glowEnabled}
              onCheckedChange={setGlowEnabled}
              icon={
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
                </svg>
              }
            />
            ) : null}
            <ToggleCard
              label="Audio Visualizer"
              checked={false}
              onCheckedChange={() => {}}
              disabled
              icon={
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 3v11" />
                  <path d="M12 3v18" />
                  <path d="M18 3v11" />
                  <path d="M6 18a3 3 0 1 0 0-4" />
                  <path d="M18 18a3 3 0 1 0 0-4" />
                </svg>
              }
            />
          </div>

          {isPremium ? (
          <p className="text-muted-foreground -mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            <span title="This feature adds a glowing effect to your username, socials, and badges, making them stand out visually.">
              Glow icons adds a glow effect to your username, socials, and badges on your profile.
            </span>
          </p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving !== null}
              onClick={() =>
                save(
                  {
                    tiltEnabled: tiltEnabled ? 1 : 0,
                    glowEnabled: isPremium ? (glowEnabled ? 1 : 0) : 1,
                  },
                  "enhance"
                )
              }
              className={btnGradient}
            >
              {saving === "enhance" ? "Saving…" : "Save Enhancements"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------ Overlay ------------------------------ */}
      <Card>
        <CardHeader
          title="Overlay"
          description="A spoiler overlay that hides your card until clicked."
        >
          <svg
            className="text-pink-300 size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        </CardHeader>
        <CardContent>
          <ToggleCard
            label="Enable Overlay"
            checked={overlayEnabled}
            onCheckedChange={setOverlayEnabled}
          />

          {overlayEnabled ? (
            <div className="space-y-2">
              <label className={formLabel} htmlFor="overlay-text">
                Overlay Text
              </label>
              <input
                id="overlay-text"
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                placeholder="Click to show"
                className={inputClass}
              />
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving !== null}
              onClick={() =>
                save(
                  {
                    overlayEnabled: overlayEnabled ? 1 : 0,
                    overlayText,
                  },
                  "overlay"
                )
              }
              className={btnGradient}
            >
              {saving === "overlay" ? "Saving…" : "Save Overlay"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ---------------------------- Preview button ---------------------------- */}
      <button
        type="button"
        onClick={openPreview}
        className={`${btnGradient} fixed bottom-3 right-3 z-40 h-10 px-4`}
      >
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Preview
      </button>

      {previewMounted
        ? createPortal(
            <div
              className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-250 ease-out ${
                previewShown ? "opacity-100" : "opacity-0"
              }`}
            >
              <div onClick={closePreview} className="absolute inset-0 bg-black/80" />

              <div
                className={`relative flex h-[85vh] w-full max-w-3xl transform-gpu flex-col overflow-hidden rounded-lg border border-white/[0.03] bg-[#0d0d0d] transition-[transform,opacity] duration-250 ease-out will-change-transform ${
                  previewShown
                    ? "translate-y-0 scale-100 opacity-100"
                    : "translate-y-4 scale-95 opacity-0"
                }`}
              >
                <button
                  type="button"
                  onClick={closePreview}
                  aria-label="Close preview"
                  className="absolute right-3 top-3 z-50 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white/60 backdrop-blur-md transition-colors hover:bg-black/80 hover:text-white"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="min-h-0 flex-1">
                  <ProfilePreview
                    profile={previewProfile}
                    badges={badges}
                    socials={socials}
                    links={links}
                    feedback={feedback}
                    widgets={widgets}
                    minHeight={640}
                    user={username ? { id: userId ?? 0, username } : undefined}
                  />
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
