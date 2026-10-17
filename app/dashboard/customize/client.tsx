"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal, { modalPrimaryBtn } from "@/components/dashboard/modal";
import SliderRow from "@/components/dashboard/slider-row";
import ToggleChip from "@/components/dashboard/toggle-chip";
import Tooltip from "@/components/ui/tooltip";
import { PickerBody } from "@/components/dashboard/appearance/colors-tab";
import UploadDialog from "@/components/dashboard/upload-dialog";
import MarkdownField from "@/components/dashboard/markdown-field";
import { useToastStack } from "@/components/ui/toast-stack";

export interface CustomizeInitial {
  avatarUrl: string | null;
  backgroundUrl: string | null;
  bannerUrl: string | null;
  cursorUrl: string | null;
  backgroundColor: string;
  avatarShape: string;
  displayName: string;
  description: string;
  bio: string;
  location: string;
  occupation: string;
  accentColor: string;
  textColor: string;
  usernameColor: string | null;
  iconColor: string;
  blur: number;
  cardOpacity: number;
  tiltEnabled: boolean;
  glowEnabled: boolean;
  usernameGlow: boolean;
  gradientEnabled: boolean;
  gradientPrimary: string;
  gradientSecondary: string;
  overlayEnabled: boolean;
  overlayText: string;
  showViews: boolean;
  hideAvatar: boolean;
  viewsPosition: string;
  showFeedback: boolean;
  layout: string;
  customActive: boolean;
}

const iconSvg = {
  upload:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="#ffffff" d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm2-4h10q.3 0 .45-.275t-.05-.525l-2.75-3.675q-.15-.2-.4-.2t-.4.2L11.25 16L9.4 13.525q-.15-.2-.4-.2t-.4.2l-2 2.675q-.2.25-.05.525T7 17"></path></svg>',
  audio:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="#ffffff" d="M14 22v-3.075l5.525-5.5q.225-.225.5-.325t.55-.1q.3 0 .575.113t.5.337l.925.925q.2.225.313.5t.112.55t-.1.563t-.325.512l-5.5 5.5zm6.575-5.6l.925-.975l-.925-.925l-.95.95zM4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h6l2 2h8q.825 0 1.413.588T22 8v3.3q-.35-.15-.725-.225t-.75-.075q-.7 0-1.312.25T18.1 12L12 18.1V20z"></path></svg>',
  crown:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 512 512"><path fill="currentColor" d="M121.72 32a4 4 0 0 0-3.72 5.56l2.3 5.43l40.7 94.9a4 4 0 0 0 6.88.82L243 38.4a4 4 0 0 0-3.2-6.4Zm298.21 26.06l-41.28 96.37a4 4 0 0 0 3.68 5.57h101a4 4 0 0 0 3.4-6.11L427 57.53a4 4 0 0 0-7.07.53M85 57.57l-59.71 96.32a4 4 0 0 0 3.4 6.11h101a4 4 0 0 0 3.67-5.58L92 58.1a4 4 0 0 0-7-.53M393.27 32H267.82a1.94 1.94 0 0 0-1.56 3.11l79.92 106.46a1.94 1.94 0 0 0 3.34-.4L391.6 43l3.4-8.34a1.92 1.92 0 0 0-1.7-2.66ZM239 448l-89.43-253.49A3.78 3.78 0 0 0 146 192H25.7a3.72 3.72 0 0 0-2.95 6l216 279.81a5.06 5.06 0 0 0 6.39 1.37a5 5 0 0 0 2.39-6.08Zm247.3-256H366a3.75 3.75 0 0 0-3.54 2.51l-98.2 278.16a5.21 5.21 0 0 0 2.42 6.31a5.22 5.22 0 0 0 6.61-1.39L489.25 198a3.72 3.72 0 0 0-2.95-6M259.2 78.93l56 74.67a4 4 0 0 1-3.2 6.4H200a4 4 0 0 1-3.2-6.4l56-74.67a4 4 0 0 1 6.4 0m-7 310.31l-67.7-191.91a4 4 0 0 1 3.77-5.33h135.46a4 4 0 0 1 3.77 5.33l-67.73 191.91a4 4 0 0 1-7.54 0Z"></path></svg>',
  text:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M5 17v2h14v-2zm4.5-4.2h5l.9 2.2h2.1L12.75 4h-1.5L6.5 15h2.1zM12 5.98L13.87 11h-3.74z"></path></svg>',
  pin:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="4 2 16 20"><path fill="currentColor" d="M12 12q.825 0 1.413-.587T14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12m0 10q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 2.5-1.987 5.438T12 22"></path></svg>',
  job:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M10 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm2 0h4V5h-4z"></path></svg>',
  user:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8m0 2c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6"></path></svg>',
  bio:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M4 5h16v2H4zm0 4h16v2H4zm0 4h10v2H4zm0 4h10v2H4z"></path></svg>',
  glow:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32"><g fill="currentColor"><path d="m17.565 3.324l1.726 3.72c.326.694.967 1.18 1.717 1.29l4.056.624c1.835.278 2.575 2.53 1.293 3.859L23.268 16a2.28 2.28 0 0 0-.612 1.964l.71 4.374c.307 1.885-1.687 3.293-3.354 2.37l-3.405-1.894a2.25 2.25 0 0 0-2.21 0l-3.404 1.895c-1.668.922-3.661-.486-3.355-2.37l.71-4.375A2.28 2.28 0 0 0 7.736 16l-3.088-3.184c-1.293-1.34-.543-3.581 1.293-3.859l4.055-.625a2.3 2.3 0 0 0 1.717-1.29l1.727-3.719c.819-1.765 3.306-1.765 4.124 0"></path></g></svg>',
  picker:
    '<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24"><path fill="currentColor" d="M19.5 3.56a2.26 2.26 0 0 0-3.18 0l-2.05 2.05l-.48-.48a.75.75 0 0 0-1.06 0l-1 1a.75.75 0 0 0 0 1.06l.48.48l-6.8 6.8a2.5 2.5 0 0 0-.66 1.15l-.54 2.06a1 1 0 0 0 1.21 1.21l2.06-.54a2.5 2.5 0 0 0 1.15-.66l6.8-6.8l.48.48a.75.75 0 0 0 1.06 0l1-1a.75.75 0 0 0 0-1.06l-.48-.48l2.05-2.05a2.26 2.26 0 0 0 0-3.18Z"></path></svg>',
  cursor:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M5 3l14 7l-6.5 1.5L9 18z"></path></svg>',
};

function Icon({ svg, className }: { svg: string; className?: string }) {
  return (
    <span
      className={`inline-flex [&>svg]:block ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function InfoPop({ title }: { title: string }) {
  return (
    <Tooltip label={title}>
      <span className="inline-flex cursor-help items-center justify-center text-[18px] text-[#bdbdbd]">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256">
          <path fill="#ffffff" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 168a12 12 0 1 1 12-12a12 12 0 0 1-12 12m8-48.72v.72a8 8 0 0 1-16 0v-8a8 8 0 0 1 8-8c13.23 0 24-9 24-20s-10.77-20-24-20s-24 9-24 20v4a8 8 0 0 1-16 0v-4c0-19.85 17.94-36 40-36s40 16.15 40 36c0 17.38-13.76 31.93-32 35.28"></path>
        </svg>
      </span>
    </Tooltip>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[26px] w-[56px] shrink-0 cursor-pointer items-center rounded-[32px] border-2 transition-colors duration-200 ${
        checked ? "border-pink-600 bg-pink-600" : "border-[#2a2a2a] bg-[#181818] hover:border-[#3a3a3a]"
      }`}
    >
      <span
        className={`absolute top-1/2 size-[19px] -translate-y-1/2 rounded-full transition-all duration-200 ${
          checked ? "left-[calc(100%-22px)] bg-white" : "left-[3px] bg-[#666]"
        }`}
      />
    </button>
  );
}

const SECTION_LABEL = "ml-[5px] text-[22.5px] font-[600] text-[#bebebe]";
const CARD = "mt-[15px] flex flex-wrap justify-around gap-[15px] rounded-lg border border-[#1e1e1e] bg-[#111111] p-[15px]";
const ROW = "flex w-full items-start gap-[15px] max-[900px]:flex-col";
const FIELD_LABEL = "m-0 mb-[5.5px] ml-[3px] text-[16px] font-[500] text-[#dddddd]";
const INPUT = "w-full rounded-md border-2 border-transparent bg-[#0c0c0c] p-[10px_12px_10px_40px] text-[15px] text-[#eee] outline-none transition-[0.3s] select-text hover:border-[#191919] focus:border-pink-500/60";
const INPUT_WRAP = "relative flex w-full items-center rounded-lg";
const INPUT_ICON = "absolute left-[8px] z-10 flex items-center text-[25px] text-[#666666]";

function ColorRow({
  label,
  value,
  onChange,
  glow,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  glow?: { label: string; value: boolean; onChange: (v: boolean) => void } | null;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  useEffect(() => {
    setText(value);
  }, [value]);
  const swatch = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
  return (
    <div className="w-full">
      <h1 className={FIELD_LABEL}>{label}</h1>
      <div className={INPUT_WRAP}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Pick ${label}`}
          className="absolute left-[7px] top-1/2 inline-flex size-[28px] shrink-0 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 p-0 transition-[0.15s] hover:border-[#2a2a2a] active:scale-[0.96]"
          style={{ backgroundColor: swatch }}
        />
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          placeholder="Pick a color"
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
          }}
          className="w-full rounded-md border-2 border-transparent bg-[#0c0c0c] p-[10px_12px_10px_40px] text-[15px] tracking-[0.5px] text-[#eee] caret-[#f7f7f7] outline-none transition-[0.3s] select-text hover:border-[#191919] focus:border-pink-500/60"
        />
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        maxWidth="max-w-sm"
      >
        <PickerBody
          label={label}
          description="Applies instantly."
          value={swatch}
          onChange={onChange}
          onClose={() => setOpen(false)}
          showHeader={false}
        />
        {glow ? (
          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-[14px] font-[500] text-[#dddddd]">{glow.label}</span>
            <ToggleChip label="Glow effect" active={glow.value} onToggle={() => glow.onChange(!glow.value)} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function AssetTile({
  label,
  src,
  onChange,
}: {
  label: string;
  src: string;
  onChange: () => void;
}) {
  return (
    <div className="flex min-w-[210px] flex-1 flex-col gap-[6px]">
      <span className="text-center text-[14px] font-[500] text-[#c9c9c9]">{label}</span>
      <div className="relative overflow-hidden rounded-lg border-2 border-[#202020] bg-[#0d0d0d]">
        <div onClick={onChange} className="cursor-pointer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} className="h-[120px] w-full object-cover" />
        </div>
      </div>
    </div>
  );
}

function UploadBox({
  label,
  text,
  icon,
  onClick,
}: {
  label: string;
  text: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <div className="flex min-w-[210px] flex-1 flex-col gap-[6px]">
      <span className="text-center text-[14px] font-[500] text-[#c9c9c9]">{label}</span>
      <button
        type="button"
        onClick={onClick}
        className="relative flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-[#202020] bg-[#0d0d0d] p-[16px] transition-[0.2s] hover:border-[#2e2e2e] hover:bg-[#101010] active:translate-y-[2px]"
      >
        <div className="flex flex-col items-center gap-[8px]">
          <Icon svg={icon} className="text-[30px] text-[#8a8a8a]" />
          <h1 className="m-0 text-[14px] font-[500] text-[#909090]">{text}</h1>
        </div>
      </button>
    </div>
  );
}

export default function CustomizeClient({
  initial,
  isPremium,
}: {
  initial: CustomizeInitial;
  isPremium: boolean;
}) {
  const router = useRouter();
  const { pushToast } = useToastStack();

  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [backgroundUrl, setBackgroundUrl] = useState(initial.backgroundUrl);
  const [bannerUrl, setBannerUrl] = useState(initial.bannerUrl);
  const [cursorUrl, setCursorUrl] = useState(initial.cursorUrl);
  const [backgroundColor, setBackgroundColor] = useState(initial.backgroundColor);
  const [avatarShape, setAvatarShape] = useState(initial.avatarShape);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [description, setDescription] = useState(initial.description);
  const [bio, setBio] = useState(initial.bio);
  const [location, setLocation] = useState(initial.location);
  const [occupation, setOccupation] = useState(initial.occupation);
  const [accent, setAccent] = useState(initial.accentColor);
  const [textColor, setTextColor] = useState(initial.textColor);
  const [usernameColor, setUsernameColor] = useState(initial.usernameColor ?? "");
  const [iconColor, setIconColor] = useState(initial.iconColor);
  const [blur, setBlur] = useState(initial.blur);
  const [cardOpacity, setCardOpacity] = useState(initial.cardOpacity);
  const [tiltEnabled, setTiltEnabled] = useState(initial.tiltEnabled);
  const [glowEnabled, setGlowEnabled] = useState(initial.glowEnabled);
  const [usernameGlow, setUsernameGlow] = useState(initial.usernameGlow);
  const [gradientEnabled, setGradientEnabled] = useState(initial.gradientEnabled);
  const [gradientPrimary, setGradientPrimary] = useState(initial.gradientPrimary);
  const [gradientSecondary, setGradientSecondary] = useState(initial.gradientSecondary);
  const [overlayEnabled, setOverlayEnabled] = useState(initial.overlayEnabled);
  const [overlayText, setOverlayText] = useState(initial.overlayText);
  const [showViews, setShowViews] = useState(initial.showViews);
  const [hideAvatar, setHideAvatar] = useState(initial.hideAvatar);
  const [viewsPosition, setViewsPosition] = useState(initial.viewsPosition);
  const [showFeedback, setShowFeedback] = useState(initial.showFeedback);
  const [layout, setLayout] = useState(initial.layout);
  const [customActive, setCustomActive] = useState(initial.customActive);

  const [avatarDialog, setAvatarDialog] = useState(false);
  const [backgroundDialog, setBackgroundDialog] = useState(false);
  const [bannerDialog, setBannerDialog] = useState(false);
  const [cursorDialog, setCursorDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = {
    avatarUrl, backgroundUrl, bannerUrl, cursorUrl, backgroundColor, avatarShape,
    displayName, description, bio, location, occupation, accent,
    textColor, usernameColor: usernameColor || null, iconColor, blur, cardOpacity, tiltEnabled,
    glowEnabled: isPremium ? glowEnabled : true,
    usernameGlow: isPremium ? usernameGlow : true,
    gradientEnabled, gradientPrimary, gradientSecondary,
    overlayEnabled, overlayText, showViews, hideAvatar, viewsPosition, showFeedback, layout,
  };
  const [baseline, setBaseline] = useState(current);
  const dirty = JSON.stringify(current) !== JSON.stringify(baseline);

  function reset() {
    setAvatarUrl(baseline.avatarUrl);
    setBackgroundUrl(baseline.backgroundUrl);
    setBannerUrl(baseline.bannerUrl);
    setCursorUrl(baseline.cursorUrl);
    setBackgroundColor(baseline.backgroundColor);
    setAvatarShape(baseline.avatarShape);
    setDisplayName(baseline.displayName);
    setDescription(baseline.description);
    setBio(baseline.bio);
    setLocation(baseline.location);
    setOccupation(baseline.occupation);
    setAccent(baseline.accent);
    setTextColor(baseline.textColor);
    setUsernameColor(baseline.usernameColor ?? "");
    setIconColor(baseline.iconColor);
    setBlur(baseline.blur);
    setCardOpacity(baseline.cardOpacity);
    setTiltEnabled(baseline.tiltEnabled);
    setGlowEnabled(baseline.glowEnabled);
    setUsernameGlow(baseline.usernameGlow);
    setGradientEnabled(baseline.gradientEnabled);
    setGradientPrimary(baseline.gradientPrimary);
    setGradientSecondary(baseline.gradientSecondary);
    setOverlayEnabled(baseline.overlayEnabled);
    setOverlayText(baseline.overlayText);
    setShowViews(baseline.showViews);
    setHideAvatar(baseline.hideAvatar);
    setViewsPosition(baseline.viewsPosition);
    setShowFeedback(baseline.showFeedback);
    setLayout(baseline.layout);
  }

  useEffect(() => {
    setGlowEnabled(initial.glowEnabled);
    setUsernameGlow(initial.usernameGlow);
    setLayout(initial.layout);
    setCustomActive(initial.customActive);
  }, [initial.glowEnabled, initial.usernameGlow, initial.layout, initial.customActive]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarUrl,
          backgroundUrl,
          bannerUrl,
          cursorUrl,
          backgroundColor,
          avatarShape,
          displayName,
          description,
          bio,
          location,
          occupation,
          accentColor: accent,
          textColor,
          usernameColor: usernameColor || null,
          socialColor: iconColor,
          blur: Number(blur),
          cardOpacity: Number(cardOpacity),
          tiltEnabled,
          glowEnabled: isPremium ? glowEnabled : true,
          usernameGlow: isPremium ? usernameGlow : true,
          gradientEnabled,
          gradientPrimary,
          gradientSecondary,
          overlayEnabled,
          overlayText,
          showViews,
          avatarHidden: hideAvatar,
          viewsPosition,
          showFeedback,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Could not save.");
      }
      pushToast("Customization saved — it is live on your profile!");
      setBaseline({ ...current });
      router.refresh();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function saveLayout() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: "halo", customLayout: null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Could not save.");
      }
      setLayout("halo");
      setCustomActive(false);
      setBaseline((b) => ({ ...b, layout: "halo" }));
      pushToast("Halo layout restored — it is live on your profile!");
      router.refresh();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex w-full flex-col">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <span className={SECTION_LABEL}>Customize</span>
      </div>

      <section>
        <span className={SECTION_LABEL}>Assets Uploader</span>
        <div className={CARD}>
          {backgroundUrl ? (
            <AssetTile label="Background" src={backgroundUrl} onChange={() => setBackgroundDialog(true)} />
          ) : (
            <UploadBox
              label="Background"
              icon={iconSvg.upload}
              text="Click to upload a file"
              onClick={() => setBackgroundDialog(true)}
            />
          )}
          {bannerUrl ? (
            <AssetTile label="Profile Banner" src={bannerUrl} onChange={() => setBannerDialog(true)} />
          ) : (
            <UploadBox
              label="Profile Banner"
              icon={iconSvg.upload}
              text="Click to upload a file"
              onClick={() => setBannerDialog(true)}
            />
          )}
          {avatarUrl ? (
            <AssetTile label="Profile Avatar" src={avatarUrl} onChange={() => setAvatarDialog(true)} />
          ) : (
            <UploadBox
              label="Profile Avatar"
              icon={iconSvg.upload}
              text="Click to upload a file"
              onClick={() => setAvatarDialog(true)}
            />
          )}
          {cursorUrl ? (
            <div className="flex min-w-[210px] flex-1 flex-col gap-[6px]">
              <span className="text-center text-[14px] font-[500] text-[#c9c9c9]">Custom Cursor</span>
              <div className="group relative rounded-lg border-2 border-[#202020] bg-[#0d0d0d]">
                <div onClick={() => setCursorDialog(true)} className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center p-[16px]">
                  <span className="w-full truncate px-8 text-center text-[12px] text-[#8a8a8a]">
                    {cursorUrl}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <UploadBox
              label="Custom Cursor"
              icon={iconSvg.upload}
              text="Click to upload a file"
              onClick={() => setCursorDialog(true)}
            />
          )}
          <a href="/dashboard/customize/tracks" className="flex min-w-[210px] flex-1 flex-col gap-[6px] no-underline">
            <span className="text-center text-[14px] font-[500] text-[#c9c9c9]">Audio</span>
            <div className="relative flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-[#202020] bg-[#0d0d0d] p-[16px] transition-[0.2s] hover:border-[#2e2e2e] hover:bg-[#101010] active:translate-y-[2px]">
              <div className="flex flex-col items-center gap-[8px]">
                <Icon svg={iconSvg.audio} className="text-[30px] text-[#8a8a8a]" />
                <h1 className="m-0 text-[14px] font-[500] text-[#909090]">Open audio manager</h1>
              </div>
            </div>
          </a>
        </div>
      </section>

      <a href="/dashboard/premium" className="no-underline">
        <div className="mt-[15px] flex w-full cursor-pointer items-center gap-3 rounded-md border border-pink-500/30 bg-pink-600/10 p-3 text-white transition-[0.2s] hover:border-pink-500/50 hover:bg-pink-600/20 active:translate-y-[2px]">
          <span className="grid size-10 shrink-0 place-content-center rounded-md bg-pink-600/25 text-pink-300">
            <Icon svg={iconSvg.crown} className="text-[20px]" />
          </span>
          <span className="min-w-0 text-[14.5px] font-[600] leading-snug">
            Want exclusive features?
            <span className="block text-[13px] font-[500] text-white/60">Unlock more with Premium</span>
          </span>
        </div>
      </a>

      <section className="mt-[25px]">
        <span className={SECTION_LABEL}>Profile Info</span>
        <div className={CARD}>
          <div className="flex w-full flex-col gap-[15px]">
            <div className={ROW}>
              <div className="min-w-0 flex-1">
                <h1 className={FIELD_LABEL}>Display Name</h1>
                <div className={INPUT_WRAP}>
                  <span className={INPUT_ICON}><Icon svg={iconSvg.user} /></span>
                  <input type="text" autoCorrect="off" maxLength={40} placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={INPUT} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className={FIELD_LABEL}>Bio</h1>
                <div className={INPUT_WRAP}>
                  <span className={INPUT_ICON}><Icon svg={iconSvg.bio} /></span>
                  <input type="text" autoCorrect="off" maxLength={160} placeholder="A short line about yourself" value={bio} onChange={(e) => setBio(e.target.value)} className={INPUT} />
                </div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={FIELD_LABEL}>
                Description{" "}
                <span className="text-[12px] font-normal text-[#7a7a7a]">(markdown supported)</span>
              </h1>
              <MarkdownField
                value={description}
                onChange={setDescription}
                maxLength={400}
                rows={3}
                placeholder="Tell people about yourself — **bold**, # heading, ==highlight== …"
              />
            </div>
            <div className={ROW}>
              <div className="min-w-0 flex-1">
                <h1 className={FIELD_LABEL}>Occupation</h1>
                <div className={INPUT_WRAP}>
                  <span className={INPUT_ICON}><Icon svg={iconSvg.job} /></span>
                  <input type="text" autoCorrect="off" maxLength={60} placeholder="What you do" value={occupation} onChange={(e) => setOccupation(e.target.value)} className={INPUT} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className={FIELD_LABEL}>Location</h1>
                <div className={INPUT_WRAP}>
                  <span className={INPUT_ICON}><Icon svg={iconSvg.pin} /></span>
                  <input type="text" autoCorrect="off" maxLength={60} placeholder="My Location" value={location} onChange={(e) => setLocation(e.target.value)} className={INPUT} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-[25px]">
        <span className={SECTION_LABEL}>General Customization</span>
        <div className={CARD}>
          <div className="flex w-full flex-col gap-[15px]">
            <div className={ROW}>
              <div className="min-w-0 flex-1">
                <SliderRow label="Profile Opacity" info="Controls how transparent your profile card is." min={10} max={100} step={1} value={cardOpacity} onChange={setCardOpacity} unit="%" />
              </div>
              <div className="min-w-0 flex-1">
                <SliderRow label="Profile Blur" info="Controls how blurred your profile background is." min={0} max={100} step={1} value={blur} onChange={setBlur} unit="px" />
              </div>
            </div>
            {isPremium ? (
            <div className="min-w-0 flex-1">
              <h1 className="m-0 mb-[6px] flex items-center gap-[4px] text-[16px] font-[500] text-[#dddddd]">
                Glow Settings
                <InfoPop title="This feature adds a glowing effect to your username, socials, and badges, making them stand out visually." />
              </h1>
              <div className="flex flex-wrap gap-[8px]">
                <ToggleChip
                  label="Username"
                  active={usernameGlow}
                  onToggle={() => setUsernameGlow((v) => !v)}
                />
                <ToggleChip
                  label="Socials"
                  active={glowEnabled}
                  onToggle={() => setGlowEnabled((v) => !v)}
                />
                <a href="/dashboard/badges" className="no-underline">
                  <ToggleChip label="Badges" active={true} onToggle={() => {}} />
                </a>
              </div>
            </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <h1 className="m-0 mb-[6px] flex items-center gap-[4px] text-[16px] font-[500] text-[#dddddd]">
                Bonus Customization
              </h1>
              <div className="flex flex-wrap gap-[8px]">
                <ToggleChip label="Tilting Card" active={tiltEnabled} onToggle={() => setTiltEnabled((v) => !v)} />
                <ToggleChip label={showViews ? "Hide Views" : "Show Views"} active={showViews} onToggle={() => setShowViews((v) => !v)} />
                <ToggleChip label={hideAvatar ? "Show Avatar" : "Hide Profile Avatar"} active={!hideAvatar} onToggle={() => setHideAvatar((v) => !v)} />
                <ToggleChip label="Profile Overlay" active={overlayEnabled} onToggle={() => setOverlayEnabled((v) => !v)} />
                <ToggleChip label={showFeedback ? "Hide Like & Dislike" : "Show Like & Dislike"} active={showFeedback} onToggle={() => setShowFeedback((v) => !v)} />
              </div>
              {showViews && (
                <div className="mt-3">
                  <h1 className="m-0 mb-[6px] ml-[3px] text-[14px] font-[500] text-[#bdbdbd]">
                    Views Position
                  </h1>
                  <div className="flex flex-wrap gap-[8px]">
                    {[
                      { value: "top-left", label: "Top Left" },
                      { value: "top-right", label: "Top Right" },
                      { value: "bottom-left", label: "Bottom Left" },
                      { value: "bottom-right", label: "Bottom Right" },
                    ].map((p) => (
                      <ToggleChip
                        key={p.value}
                        label={p.label}
                        active={viewsPosition === p.value}
                        onToggle={() => setViewsPosition(p.value)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {overlayEnabled && (
                <div className={`${INPUT_WRAP} mt-3`}>
                  <input type="text" maxLength={60} placeholder="Click to show" value={overlayText} onChange={(e) => setOverlayText(e.target.value)} className="w-full rounded-md border-2 border-transparent bg-[#0c0c0c] p-[10px_12px] text-[15px] text-[#eee] outline-none transition-[0.3s] hover:border-[#191919] focus:border-pink-500/60" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-[25px]">
        <span className={SECTION_LABEL}>Layout</span>
        <div className={CARD}>
          <div className={`grid w-full gap-[12px] ${isPremium ? "sm:grid-cols-2" : ""}`}>
            <button
              type="button"
              onClick={() => setLayout("halo")}
              className={`flex w-full cursor-pointer items-center gap-[10px] rounded-md border-2 p-[12px] text-left transition-[0.2s] active:translate-y-[2px] ${
                layout === "halo" && !customActive
                  ? "border-pink-500/70 bg-pink-600/20"
                  : "border-transparent bg-[#0c0c0c] hover:border-[#2a2a2a]"
              }`}
            >
              <span className="grid size-10 shrink-0 place-content-center rounded-md bg-pink-600/20">
                <span className="size-5 rounded-full bg-pink-500" />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-[500] text-[#f0f0f0]">Halo</span>
                <span className="block truncate text-[13px] text-[#8a8a8a]">Classic centered card with halo glow.</span>
              </span>
            </button>
            {isPremium ? (
            <button
              type="button"
              onClick={() => router.push("/dashboard/customize/edit")}
              className={`flex w-full cursor-pointer items-center gap-[10px] rounded-md border-2 p-[12px] text-left transition-[0.2s] active:translate-y-[2px] ${
                customActive
                  ? "border-pink-500/70 bg-pink-600/20"
                  : "border-transparent bg-[#0c0c0c] hover:border-[#2a2a2a]"
              }`}
            >
              <span className="grid size-10 shrink-0 grid-cols-2 place-content-center gap-0.5 rounded-md bg-[#0c0c0c] p-2">
                <span className="rounded-sm bg-pink-500/80" />
                <span className="rounded-sm border border-pink-500/60" />
                <span className="rounded-sm border border-pink-500/60" />
                <span className="rounded-sm bg-pink-500/80" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[15px] font-[500] text-[#f0f0f0]">
                  Custom
                </span>
                <span className="block truncate text-[13px] text-[#8a8a8a]">Free-move canvas — drag, resize and style everything.</span>
              </span>
            </button>
            ) : null}
          </div>
          {(!customActive || layout === "halo") && (
            <button
              type="button"
              onClick={saveLayout}
              disabled={saving}
              className={`${modalPrimaryBtn} mt-3 w-full`}
            >
              {saving ? "Saving…" : customActive ? "Switch Back to Halo" : "Save Layout"}
            </button>
          )}
        </div>
      </section>

      <section className="mt-[25px]">
        <span className={SECTION_LABEL}>Color Customization</span>
        <div className={CARD}>
          <div className="flex w-full flex-col gap-[15px]">
            <div className="flex w-full items-center justify-between gap-[10px]">
              <span className="ml-[3px] text-[16px] font-[500] text-[#dddddd]">
                {gradientEnabled ? "Disable Profile Gradient" : "Enable Profile Gradient"}
              </span>
              <Toggle checked={gradientEnabled} onChange={setGradientEnabled} />
            </div>
            {gradientEnabled && (
              <>
                <div className={ROW}>
                  <div className="min-w-0 flex-1">
                    <ColorRow label="Primary Color" value={gradientPrimary} onChange={setGradientPrimary} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <ColorRow label="Secondary Color" value={gradientSecondary} onChange={setGradientSecondary} />
                  </div>
                </div>
                <div
                  className="h-[54px] w-full rounded-md border-2 border-[#222]"
                  style={{ background: `linear-gradient(135deg, ${gradientPrimary}, ${gradientSecondary})` }}
                />
              </>
            )}
            <div className={ROW}>
              <div className="min-w-0 flex-1">
                <ColorRow label="Accent Color" value={accent} onChange={setAccent} />
              </div>
              <div className="min-w-0 flex-1">
                <ColorRow label="Text Color" value={textColor} onChange={setTextColor} />
              </div>
            </div>
            <div className={ROW}>
              <div className="min-w-0 flex-1">
                <ColorRow
                  label="Username Color"
                  value={usernameColor || textColor}
                  onChange={(v) => setUsernameColor(v)}
                  glow={
                    isPremium
                      ? { label: "Glow effect", value: usernameGlow, onChange: (v) => setUsernameGlow(v) }
                      : null
                  }
                />
              </div>
              <div className="min-w-0 flex-1">
                <ColorRow
                  label="Icon Color"
                  value={iconColor}
                  onChange={setIconColor}
                  glow={
                    isPremium
                      ? { label: "Glow effect", value: glowEnabled, onChange: (v) => setGlowEnabled(v) }
                      : null
                  }
                />
              </div>
            </div>
            <div className={ROW}>
              <div className="min-w-0 flex-1">
                <ColorRow label="Background Color" value={backgroundColor} onChange={setBackgroundColor} />
              </div>
              <div className="min-w-0 flex-1" />
            </div>
          </div>
        </div>
      </section>

      <div
        aria-hidden={!dirty}
        className={`pointer-events-none fixed inset-x-3 bottom-3 z-40 transition-all duration-200 ${
          dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <div className="pointer-events-auto mx-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-[999px] border-2 border-[#232323] bg-[#141414] py-2 pl-5 pr-2">
          <h1 className="m-0 min-w-0 flex-1 truncate text-[15px] font-semibold text-white">You have unsaved changes!</h1>
          <button type="button" onClick={reset} className="shrink-0 cursor-pointer whitespace-nowrap bg-transparent px-3 py-2.5 text-[15px] text-[#8a8a8a] transition hover:text-white" style={{ fontWeight: 300 }}>
            Reset
          </button>
          <button type="button" onClick={save} disabled={saving} className={`${modalPrimaryBtn} shrink-0 whitespace-nowrap`} style={{ borderRadius: 999, fontWeight: 300 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <UploadDialog open={avatarDialog} title="Edit Avatar" type="avatar" onClose={() => setAvatarDialog(false)} onUploaded={(url) => setAvatarUrl(url)} />
      <UploadDialog open={backgroundDialog} title="Change Background" type="background" onClose={() => setBackgroundDialog(false)} onUploaded={(url) => setBackgroundUrl(url)} />
      <UploadDialog open={bannerDialog} title="Change Profile Banner" type="banner" onClose={() => setBannerDialog(false)} onUploaded={(url) => setBannerUrl(url)} />
      <UploadDialog open={cursorDialog} title="Change Custom Cursor" type="cursor" onClose={() => setCursorDialog(false)} onUploaded={(url) => setCursorUrl(url)} />
    </div>
  );
}
