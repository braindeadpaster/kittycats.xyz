"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColorPickerField } from "@/components/dashboard/appearance/colors-tab";
import { btnGradient, btnNeutral, btnSolid, Divider, formLabel, inputClass } from "@/components/dashboard/ui";
import UploadDialog from "@/components/dashboard/upload-dialog";
import { useToastStack } from "@/components/ui/toast-stack";

interface ProfileData {
  avatarUrl: string | null;
  backgroundUrl: string | null;
  backgroundColor: string;
  avatarShape: string;
  displayName: string;
  description: string;
  bio: string;
  location: string;
  occupation: string;
}

const SHAPES: Array<{ value: string; label: string; radius: string }> = [
  { value: "square", label: "Square", radius: "0px" },
  { value: "squircle", label: "Squircle", radius: "10px" },
  { value: "soft", label: "Soft", radius: "12px" },
  { value: "circle", label: "Circle", radius: "50px" },
];

export default function ProfileClient({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const { pushToast } = useToastStack();

  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [backgroundUrl, setBackgroundUrl] = useState(profile.backgroundUrl);
  const [backgroundColor, setBackgroundColor] = useState(profile.backgroundColor);
  const [avatarShape, setAvatarShape] = useState(profile.avatarShape);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [description, setDescription] = useState(profile.description);
  const [bio, setBio] = useState(profile.bio);
  const [location, setLocation] = useState(profile.location);
  const [occupation, setOccupation] = useState(profile.occupation);
  const [backgroundTab, setBackgroundTab] = useState<"color" | "media">(
    profile.backgroundUrl ? "media" : "color"
  );
  const [avatarDialog, setAvatarDialog] = useState(false);
  const [backgroundDialog, setBackgroundDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const baseline = useMemo(
    () => ({
      avatarUrl: profile.avatarUrl,
      backgroundUrl: profile.backgroundUrl,
      backgroundColor: profile.backgroundColor,
      avatarShape: profile.avatarShape,
      displayName: profile.displayName,
      description: profile.description,
      bio: profile.bio,
      location: profile.location,
      occupation: profile.occupation,
    }),
    [profile]
  );

  const current = {
    avatarUrl,
    backgroundUrl,
    backgroundColor,
    avatarShape,
    displayName,
    description,
    bio,
    location,
    occupation,
  };

  const dirty = useMemo(
    () =>
      (Object.keys(current) as Array<keyof typeof current>).filter(
        (key) => String(current[key] ?? "") !== String(baseline[key] ?? "")
      ).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, baseline]
  );

  const shapeRadius =
    SHAPES.find((shape) => shape.value === avatarShape)?.radius ?? "50px";

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarUrl,
          backgroundUrl: backgroundUrl || null,
          backgroundColor,
          avatarShape,
          displayName,
          description,
          bio,
          location,
          occupation,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not save your profile.");
      }

      pushToast("Profile Saved!");
      router.refresh();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-40">
        <div
          aria-hidden={dirty === 0}
          className={`mx-auto max-w-xl transition-all duration-200 ease-out will-change-transform pointer-events-auto ${
            dirty > 0
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-6 scale-95 opacity-0"
          }`}
        >
          <div className="border border-white/[0.03] from-[#1a1a1a] to-[#131313] bg-gradient-to-br flex items-center justify-between rounded-lg p-2">
            <p className="text-foreground ml-2 text-sm font-medium">
              You have unsaved changes.
            </p>
            <button
              className={`${btnGradient} h-9 px-3 text-sm rounded-xl`}
              type="button"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="space-y-2">
          <label className={formLabel}>Avatar</label>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative size-[90px] shrink-0 self-start md:self-center">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Avatar Image"
                  className="border-foreground/15 absolute inset-0 z-0 h-full w-full border-2 object-cover"
                  src={avatarUrl}
                  style={{ borderRadius: shapeRadius }}
                />
              ) : (
                <div
                  className="border-foreground/15 bg-foreground/5 text-muted-foreground absolute inset-0 z-0 grid place-content-center border-2"
                  style={{ borderRadius: shapeRadius }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <button className={btnSolid} type="button" onClick={() => setAvatarDialog(true)}>
                  Change Avatar
                </button>
                <button
                  className={btnNeutral}
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  disabled={!avatarUrl}
                >
                  Remove Avatar
                </button>
              </div>
              <div className="grid w-full gap-2 self-start">
                <label className="text-muted-foreground text-xs">Avatar Shape</label>
                <div className="flex flex-wrap gap-2">
                  {SHAPES.map((shape) => {
                    const active = avatarShape === shape.value;
                    return (
                      <button
                        key={shape.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setAvatarShape(shape.value)}
                        className={`rounded-xl inline-flex border items-center px-2.5 py-1 gap-x-1.5 transition-colors text-xs ${
                          active
                            ? "border-pink-500/20 bg-pink-600/10 hover:bg-pink-600/15 text-pink-300"
                            : "border-foreground/5 bg-foreground/5 hover:bg-foreground/10 text-foreground"
                        }`}
                      >
                        <span
                          className="bg-pink-300/70 inline-block size-3.5"
                          style={{ borderRadius: shape.radius === "50px" ? "999px" : "3px" }}
                        />
                        {shape.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Divider />

        <div className="space-y-2">
          <label className={formLabel}>Background</label>
          <div className="space-y-3">
            <div
              role="tablist"
              aria-orientation="horizontal"
              className="bg-muted text-muted-foreground items-center justify-center rounded-xl p-1 grid w-fit grid-cols-2"
            >
              {(["color", "media"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={backgroundTab === tab}
                  onClick={() => setBackgroundTab(tab)}
                  className={`ring-offset-background hover:text-foreground focus-visible:ring-ring inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                    backgroundTab === tab
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {tab === "color" ? "Color" : "Media"}
                </button>
              ))}
            </div>

            {backgroundTab === "color" ? (
              <ColorPickerField
                label="Background Color"
                description="Solid color shown behind your profile"
                value={backgroundColor}
                onChange={setBackgroundColor}
                allowTransparent={false}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <button className={btnSolid} type="button" onClick={() => setBackgroundDialog(true)}>
                    Change Image
                  </button>
                  <button
                    className={btnNeutral}
                    type="button"
                    onClick={() => setBackgroundUrl(null)}
                    disabled={!backgroundUrl}
                  >
                    Remove Image
                  </button>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Pick an image background. Color will be removed.
                </p>
                {backgroundUrl ? (
                  <div className="border-foreground/15 relative h-24 w-full max-w-sm overflow-hidden rounded-xl border-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={backgroundUrl} alt="Background" className="absolute inset-0 h-full w-full object-cover" />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <Divider />

        <div className="grid w-full gap-2 self-start">
          <label className={formLabel}>Display Name</label>
          <div className="relative w-full">
            <input
              className={`${inputClass} pl-[34px]`}
              type="text"
              maxLength={40}
              placeholder="Your name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
            <div className="absolute top-1/2 left-3 -translate-y-1/2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground size-4"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid w-full gap-2 self-start">
          <label className={formLabel}>Description</label>
          <textarea
            className={`${inputClass} h-auto min-h-20 resize-none py-2`}
            maxLength={160}
            rows={2}
            placeholder="A short line about yourself"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="grid w-full gap-2 self-start">
          <label className={formLabel}>Bio</label>
          <textarea
            className={`${inputClass} h-auto min-h-24 resize-none py-2`}
            maxLength={400}
            rows={3}
            placeholder="Tell people about yourself"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="grid w-full gap-2 self-start">
            <label className={formLabel}>Occupation</label>
            <input
              className={inputClass}
              type="text"
              maxLength={60}
              placeholder="What you do"
              value={occupation}
              onChange={(event) => setOccupation(event.target.value)}
            />
          </div>
          <div className="grid w-full gap-2 self-start">
            <label className={formLabel}>Location</label>
            <input
              className={inputClass}
              type="text"
              maxLength={60}
              placeholder="Your location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
        </div>

        <button
          className={`${btnGradient} h-10 px-4 w-full rounded-xl`}
          type="submit"
          disabled={saving}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>

      <UploadDialog
        open={avatarDialog}
        title="Edit Avatar"
        type="avatar"
        onClose={() => setAvatarDialog(false)}
        onUploaded={(url) => setAvatarUrl(url)}
      />
      <UploadDialog
        open={backgroundDialog}
        title="Change Background"
        type="background"
        onClose={() => setBackgroundDialog(false)}
        onUploaded={(url) => setBackgroundUrl(url)}
      />
    </>
  );
}
