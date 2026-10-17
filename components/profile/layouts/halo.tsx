"use client";

/**
 * Halo — the single profile template.
 *
 * Wide glass card with avatar + name/badges on the top row, centered
 * social row below, like/dislike bottom-right, views pill follows
 * profile.viewsPosition.
 *
 * The card paints no background of its own — the page background shows
 * through everywhere (single background across the page).
 */

import { useEffect, useState } from "react";
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
import BadgeIcon from "@/components/badge-icon";
import Tooltip from "@/components/ui/tooltip";
import MarkdownText from "@/components/profile/markdown";
import LinkConfirm from "@/components/profile/link-confirm";
import { useCountUp } from "@/components/profile/use-count-up";
import { resolveColor, withAlpha } from "@/lib/color";
import { avatarStyle, viewsCornerStyle } from "@/lib/profile-layout";
import type {
  ProfileCardBadge,
  ProfileCardLink,
  ProfileCardProfile,
  ProfileCardSocial,
} from "../profile-card";
import type { FeedbackKind, FeedbackState } from "@/lib/feedback";

export const haloMeta = {
  id: "halo",
  label: "Halo",
  description: "Wide glass card — avatar, name, badges and socials.",
  file: "halo.tsx",
  align: "left",
} as const;

export interface HaloCardProps {
  user: { id: number; username: string };
  profile: ProfileCardProfile | null;
  badges?: ProfileCardBadge[];
  socials?: ProfileCardSocial[];
  links?: ProfileCardLink[];
  viewCount?: number;
  /** When true, links/socials render inert (dashboard previews). */
  preview?: boolean;
  /** Server-rendered like/dislike state (null while unknown). */
  feedback?: FeedbackState | null;
}

/* ------------------------------------------------------------------ */
/* Social icons                                                          */
/* ------------------------------------------------------------------ */

const brandIcons: Record<string, typeof faDiscord> = {
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

const socialPaths: Record<string, string> = {
  roblox:
    "M8.3 2.5l13.2 4.2-2.4 8.7L5.9 11.2 8.3 2.5zm4.8 7.6l1.5-5.4 5.4 1.5-1.5 5.4-5.4-1.5zm-6.6 6.7l6.9 2.1-1.6 5.9-6.9-2.1 1.6-5.9z",
  kick:
    "M8.2 3.5h3.1v5.6H8.2V3.5zm4.1 0h3.1v8.5h-3.1V3.5zm-4.1 7.8h10.4v3.1H8.2v-3.1zM3.5 13.5h3.1v4.2h-3.1v-4.2zm13.1 0h3.1v4.2h-3.1v-4.2z",
  solana:
    "M4.6 7.2C5.1 6.7 5.9 6.5 6.6 6.5h11.8c.8 0 1.3.9.8 1.5L18.5 10c-.5.5-1.3.9-2 .7H4.6c-.8 0-1.3-.9-.8-1.5l1.8-2.3zm0 9.6c.5-.5 1.3-.7 2-.7h11.8c.8 0 1.3.9.8 1.5L18.5 20c-.5.5-1.3.7-2 .7H4.6c-.8 0-1.3-.9-.8-1.5l1.8-2.3zm13.9-7.2h2.8c.5 0 .8.4.8.8s-.4.8-.8.8h-2.8c-.4 0-.8-.4-.8-.8s.4-.8.8-.8zm-4.1 0h2.8c.5 0 .8.4.8.8s-.4.8-.8.8h-2.8c-.4 0-.8-.4-.8-.8s.4-.8.8-.8z",
  onlyfans:
    "M12 2.5c-4.1 0-7.5 3.4-7.5 7.5s3.4 7.5 7.5 7.5 7.5-3.4 7.5-7.5-3.4-7.5-7.5-7.5zm-1.1 3.6h2.2v4.3h3.5v2.2h-3.5v4.3h-2.2v-4.3H7.4v-2.2h3.5V6.1z",
};

const platformNames: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  discord: "Discord",
  twitter: "X",
  x: "X",
  github: "GitHub",
  telegram: "Telegram",
  snapchat: "Snapchat",
  reddit: "Reddit",
  twitch: "Twitch",
  lastfm: "Last.fm",
  spotify: "Spotify",
  bitcoin: "Bitcoin",
  ethereum: "Ethereum",
  solana: "Solana",
  paypal: "PayPal",
  steam: "Steam",
  roblox: "Roblox",
  soundcloud: "SoundCloud",
  kick: "Kick",
  onlyfans: "OnlyFans",
  custom: "Custom",
};

function getPlatformName(platform: string) {
  return platformNames[platform.toLowerCase()] ?? platform;
}

const LIKE_PATH =
  "M5 9v12H1V9zm4 12a2 2 0 0 1-2-2V9c0-.55.22-1.05.59-1.41L14.17 1l1.06 1.06c.27.27.44.64.44 1.05l-.03.32L14.69 8H21a2 2 0 0 1 2 2v2c0 .26-.05.5-.14.73l-3.02 7.05C19.54 20.5 18.83 21 18 21zm0-2h9.03L21 12v-2h-8.79l1.13-5.32L9 9.03z";
const DISLIKE_PATH =
  "M19 15V3h4v12zM15 3a2 2 0 0 1 2 2v10c0 .55-.22 1.05-.59 1.41L9.83 23l-1.06-1.06c-.27-.27-.44-.64-.44-1.06l.03-.31l.95-4.57H3a2 2 0 0 1-2-2v-2c0-.26.05-.5.14-.73l3.02-7.05C4.46 3.5 5.17 3 6 3zm0 2H5.97L3 12v2h8.78l-1.13 5.32L15 14.97z";

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

export function HaloCard({
  user,
  profile,
  badges = [],
  socials = [],
  links = [],
  viewCount = 0,
  preview = false,
  feedback = null,
}: HaloCardProps) {
  const [fb, setFb] = useState<FeedbackState>(
    () => feedback ?? { likes: 0, dislikes: 0, mine: null }
  );
  const [voting, setVoting] = useState(false);
  const [pendingLink, setPendingLink] = useState<{
    title: string;
    url: string;
  } | null>(null);

  const ownerId = typeof user?.id === "number" ? user.id : 0;

  useEffect(() => {
    if (feedback) setFb(feedback);
  }, [feedback]);

  useEffect(() => {
    if (preview || feedback || ownerId < 1) return;
    let cancelled = false;
    fetch(`/api/feedback?userId=${ownerId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setFb({
            likes: data.likes ?? 0,
            dislikes: data.dislikes ?? 0,
            mine: data.mine ?? null,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [preview, feedback, ownerId]);

  const vote = async (kind: FeedbackKind) => {
    if (preview || voting || ownerId < 1) return;

    const prev = fb;
    const next: FeedbackState =
      prev.mine === kind
        ? {
            likes: Math.max(0, prev.likes - (kind === "like" ? 1 : 0)),
            dislikes: Math.max(
              0,
              prev.dislikes - (kind === "dislike" ? 1 : 0)
            ),
            mine: null,
          }
        : prev.mine
          ? kind === "like"
            ? {
                likes: prev.likes + 1,
                dislikes: Math.max(0, prev.dislikes - 1),
                mine: kind,
              }
            : {
                likes: Math.max(0, prev.likes - 1),
                dislikes: prev.dislikes + 1,
                mine: kind,
              }
          : kind === "like"
            ? { ...prev, likes: prev.likes + 1, mine: kind }
            : { ...prev, dislikes: prev.dislikes + 1, mine: kind };

    setFb(next);
    setVoting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: ownerId, kind }),
      });
      if (!res.ok) throw new Error("vote failed");
      const data = await res.json();
      setFb({
        likes: data.likes ?? 0,
        dislikes: data.dislikes ?? 0,
        mine: data.mine ?? null,
      });
    } catch {
      setFb(prev);
    } finally {
      setVoting(false);
    }
  };

  const askLink = (
    event: React.MouseEvent,
    title: string,
    url: string
  ) => {
    if (preview) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    setPendingLink({ title, url });
  };

  const openPendingLink = () => {
    if (!pendingLink) return;
    window.open(pendingLink.url, "_blank", "noopener,noreferrer");
    setPendingLink(null);
  };

  /** Fire-and-forget click tracking — the anchor itself points at the destination. */
  const trackClick = (endpoint: string) => {
    try {
      void fetch(endpoint, { method: "POST", keepalive: true, cache: "no-store" });
    } catch {
      /* tracking must never break navigation */
    }
  };

  const textColor = resolveColor(profile?.textColor, "#ffffff");
  const usernameHaloColor = resolveColor(profile?.usernameColor ?? profile?.textColor, "#ffffff");
  const badgeAccent = resolveColor(profile?.badgeColor, "#ffffff");
  const socialAccent = resolveColor(profile?.socialColor, "#ffffff");
  const borderColor = resolveColor(profile?.borderColor, "#ffffff");
  const borderOpacity = profile?.borderOpacity ?? 100;
  const borderWidth = profile?.borderWidth ?? 1;
  const cardBlurEnabled = Number(profile?.cardBlurEnabled ?? 1) !== 0;
  const cardBlur = profile?.cardBlur ?? 2;
  const glowEnabled =
    profile?.glowEnabled == null
      ? true
      : Number(profile.glowEnabled) !== 0;
  const frostPx = cardBlurEnabled
    ? Math.min(Math.max(cardBlur, 0), 60)
    : 0;

  // backdrop-filter can't reach the page background: the parallax wrapper's
  // transform makes it a backdrop root, so the blur had nothing to sample.
  // Instead we paint a blurred copy of the page background inside the card.
  // backgroundUrl can be an empty string in old rows; `??` won't catch that.
  const backgroundUrl = profile?.backgroundUrl || null;

  // The color must live in backgroundColor: a trailing color layer makes
  // the whole backgroundImage value invalid and the browser drops it.
  const gradientOn = Number(profile?.gradientEnabled ?? 0) !== 0;
  const pageBackgroundColor = backgroundUrl
    ? undefined
    : gradientOn
      ? resolveColor(profile?.gradientSecondary, "#0d0d0d")
      : resolveColor(profile?.backgroundColor, "#111111");
  const pageBackgroundGradient = backgroundUrl
    ? undefined
    : gradientOn
    ? `linear-gradient(135deg, ${resolveColor(profile?.gradientPrimary, "#881c9c")}, ${resolveColor(profile?.gradientSecondary, "#0d0d0d")})`
    : ((): string => {
        const primary = resolveColor(
          profile?.primaryColor ?? profile?.accentColor,
          "#ffffff"
        );
        return `radial-gradient(circle at 20% 20%, ${withAlpha(
          primary,
          0.16
        )}, transparent 50%), radial-gradient(circle at 80% 80%, ${withAlpha(
          primary,
          0.1
        )}, transparent 50%)`;
      })();

  // The card paints no background of its own — the page background shows
  // through, so there is a single background across the whole page.

  const borderRadius = profile?.borderRadius ?? 25;
  const cardWidth = profile?.cardWidth ?? 420;
  const avatarShape = profile?.avatarShape ?? "circle";
  const displayName = profile?.displayName || user.username;
  const bio = profile?.bio ?? "";
  const description = profile?.description ?? "";
  const occupation = profile?.occupation ?? "";
  const location = profile?.location ?? "";
  const showViews =
    profile?.showViews == null ? true : Number(profile.showViews) !== 0;
  const viewsPosition = profile?.viewsPosition ?? "top-right";
  const isTopViews = viewsPosition.startsWith("top");
  const needsTopPad = showViews && isTopViews;
  const badgesPlacement = profile?.badgesPosition ?? "auto";
  const badgesBelow = badgesPlacement === "below";

  const animatedViews = useCountUp(showViews ? viewCount : 0);

  const socialGlow = glowEnabled
    ? `drop-shadow(0 0 3.33px ${withAlpha(socialAccent, 0.34)}) drop-shadow(0 0 6.6px ${withAlpha(socialAccent, 0.11)})`
    : "none";

  const badgesRow =
    badges.length > 0 ? (
      <span className="inline-flex shrink-0 flex-nowrap items-center">
        <span className="relative inline-flex flex-wrap items-center justify-start gap-1.5 px-2 py-1">
          {badges.map((badge) => {
            const badgeColor = resolveColor(badge.color, badgeAccent);
            const badgeGlowOn = badge.glow == null ? true : badge.glow !== false;
            const badgeGlow = badgeGlowOn
              ? `drop-shadow(0 0 3px ${withAlpha(badgeColor, 0.58)}) drop-shadow(0 0 5.5px ${withAlpha(badgeColor, 0.22)})`
              : "none";

            return (
              <Tooltip key={badge.id} label={badge.name}>
                <span
                  className="inline-flex h-6 w-6 shrink-0 cursor-default items-center justify-center transition-transform hover:scale-110"
                  style={{ color: badgeColor, filter: badgeGlow }}
                >
                  <BadgeIcon
                    prefix={badge.iconPrefix}
                    name={badge.iconName}
                    url={badge.iconUrl ?? undefined}
                    style={{
                      color: badgeColor,
                      width: "20px",
                      height: "20px",
                    }}
                  />
                </span>
              </Tooltip>
            );
          })}
        </span>
      </span>
    ) : null;

  return (
    <div
      data-card-root
      className="w-full"
      style={{ width: `${cardWidth}px`, maxWidth: "100%" }}
    >
      <div className="relative" style={{ borderRadius: `${borderRadius}px` }}>
        {/* glass panel — transparent, the page background shows through */}
        <div
          className="relative"
          style={{
            border: "none",
            borderRadius: `${borderRadius}px`,
            outline:
              borderWidth > 0
                ? `${borderWidth}px solid ${withAlpha(
                    borderColor,
                    Math.min(Math.max(borderOpacity, 0), 100) / 100
                  )}`
                : undefined,
            boxShadow:
              "0 18px 42px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
            overflow: "visible",
            position: "relative",
            minHeight: "190px",
            paddingBottom: links.length > 0 ? "48px" : "16px",
          }}
        >
          {/* frosted layer — blurred copy of the page background */}
          {frostPx > 0 && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={{ borderRadius: `${borderRadius}px`, zIndex: 0 }}
            >
              <div
                className="absolute"
                style={{
                  inset: "-32px",
                  backgroundImage: backgroundUrl
                    ? `url(${backgroundUrl})`
                    : pageBackgroundGradient,
                  backgroundColor: pageBackgroundColor,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: `blur(${frostPx}px)`,
                  transform: "scale(1.03)",
                }}
              />
              <div className="absolute inset-0 bg-black/25" />
              <div className="absolute inset-0 bg-white/[0.03]" />
            </div>
          )}
          {/* views pill — follows profile.viewsPosition */}
          {showViews && (
            <div
              className="pointer-events-none absolute z-[40]"
              style={viewsCornerStyle(viewsPosition)}
            >
              {/* pointer-events-auto: the wrapper disables pointer events
                  (inherited) so the pill must re-enable them for hover */}
              <Tooltip label="Views" className="pointer-events-auto">
                <span
                  className="inline-flex cursor-default items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
                  style={{
                    borderRadius: "8px",
                    color: withAlpha(textColor, 0.7),
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <svg
                    className="h-3.5 w-3.5 opacity-70"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  {animatedViews.toLocaleString()}
                </span>
              </Tooltip>
            </div>
          )}

          {/* like / dislike — bottom right, number-only tooltips */}
          {profile?.showFeedback == null || Number(profile.showFeedback) !== 0 ? (
          <div
            className="pointer-events-none absolute z-[40] flex items-center gap-0.5"
            style={{ bottom: "12px", right: "12px" }}
          >
            <Tooltip
              key={`like-${fb.likes}-${fb.mine}`}
              label={String(fb.likes)}
            >
              <button
                type="button"
                aria-label="Like profile"
                aria-pressed={fb.mine === "like"}
                disabled={preview}
                onClick={(e) => {
                  e.currentTarget.blur();
                  void vote("like");
                }}
                className={`pointer-events-auto flex items-center justify-center rounded-lg p-1.5 transition-all hover:scale-110 disabled:cursor-default disabled:hover:scale-100 ${
                  fb.mine === "like"
                    ? "text-white/90"
                    : "text-white/55 hover:text-white/90"
                }`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                >
                  <path d={LIKE_PATH} />
                </svg>
              </button>
            </Tooltip>

            <Tooltip
              key={`dislike-${fb.dislikes}-${fb.mine}`}
              label={String(fb.dislikes)}
            >
              <button
                type="button"
                aria-label="Dislike profile"
                aria-pressed={fb.mine === "dislike"}
                disabled={preview}
                onClick={(e) => {
                  e.currentTarget.blur();
                  void vote("dislike");
                }}
                className={`pointer-events-auto flex items-center justify-center rounded-lg p-1.5 transition-all hover:scale-110 disabled:cursor-default disabled:hover:scale-100 ${
                  fb.mine === "dislike"
                    ? "text-white/90"
                    : "text-white/55 hover:text-white/90"
                }`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                >
                  <path d={DISLIKE_PATH} />
                </svg>
              </button>
            </Tooltip>
          </div>
          ) : null}

          {/* content */}
          <div
            className="relative z-10 flex flex-col px-6 pt-5 pb-4 text-left"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              paddingTop: needsTopPad ? "52px" : undefined,
            }}
          >
            {profile?.bannerUrl ? (
              <div
                aria-hidden="true"
                style={{
                  marginLeft: -24,
                  marginRight: -24,
                  marginTop: needsTopPad ? -52 : -20,
                  marginBottom: 12,
                  height: 144,
                  backgroundImage: `url(${profile.bannerUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderTopLeftRadius: `${borderRadius}px`,
                  borderTopRightRadius: `${borderRadius}px`,
                }}
              />
            ) : null}
            <div className="mb-3 flex items-center gap-4">
              {/* avatar */}
              {profile?.avatarHidden == null || Number(profile.avatarHidden) === 0 ? (
              <div className="shrink-0">
                <Tooltip label={`@${user.username}`}>
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={user.username}
                      className="object-cover"
                      style={{
                        ...avatarStyle(avatarShape),
                        width: "104px",
                        height: "104px",
                      }}
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center bg-white/10 text-3xl font-bold"
                      style={{
                        ...avatarStyle(avatarShape),
                        color: textColor,
                        width: "104px",
                        height: "104px",
                      }}
                    >
                      {displayName[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </Tooltip>
              </div>
              ) : null}

              {/* name + badges + bio */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-start gap-3">
                  <Tooltip label={String(user.id)}>
                    <span
                      className="inline-flex shrink-0 cursor-default items-center text-[1.875rem] font-semibold leading-none tracking-tight"
                      style={{
                        color: usernameHaloColor,
                        filter:
                          profile?.usernameGlow == null || Number(profile.usernameGlow) !== 0
                            ? `drop-shadow(0 0 6px ${withAlpha(usernameHaloColor, 0.55)}) drop-shadow(0 0 14px ${withAlpha(usernameHaloColor, 0.25)})`
                            : "none",
                      }}
                    >
                      {displayName}
                    </span>
                  </Tooltip>

                  {!badgesBelow && badgesRow}
                </div>

                {badgesBelow && badgesRow && (
                  <div className="mt-1.5 flex justify-start">{badgesRow}</div>
                )}

                {bio && (
                  <p
                    className="mt-2 w-fit max-w-full whitespace-pre-wrap break-words text-lg leading-relaxed"
                    style={{ color: withAlpha(textColor, 0.84) }}
                  >
                    {bio}
                  </p>
                )}

                {description ? (
                  <MarkdownText
                    text={description}
                    className="mt-1 max-w-full text-base"
                    style={{ color: withAlpha(textColor, 0.6) }}
                  />
                ) : null}

                {(occupation || location) && (
                  <div
                    className="mt-1.5 flex flex-col gap-1 text-sm"
                    style={{ color: withAlpha(textColor, 0.4) }}
                  >
                    {occupation && (
                      <span
                        className="font-medium"
                        style={{ color: withAlpha(textColor, 0.6) }}
                      >
                        {occupation}
                      </span>
                    )}
                    {location && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {location}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* socials */}
            {socials.length > 0 && (
              <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-3">
                {socials.map((social) => {
                  const platform = String(social.platform).trim().toLowerCase();
                  const faIcon = brandIcons[platform];
                  const path = !faIcon ? socialPaths[platform] : undefined;

                  if (
                    !faIcon &&
                    !path &&
                    !(platform === "custom" && social.iconUrl)
                  )
                    return null;

                  return (
                    <Tooltip
                      key={social.id}
                      label={getPlatformName(platform)}
                    >
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={platform}
                        onAuxClick={() => {
                          if (!preview) trackClick(`/api/social-click?id=${social.id}`);
                        }}
                        onClick={(e) => {
                          if (!preview) trackClick(`/api/social-click?id=${social.id}`);
                          if (preview || e.ctrlKey || e.metaKey || e.shiftKey) return;
                          askLink(e, getPlatformName(platform), social.url);
                        }}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-all hover:scale-110"
                        style={{ color: socialAccent }}
                      >
                        {platform === "custom" && social.iconUrl ? (
                          <img
                            src={social.iconUrl}
                            alt={platform}
                            className="h-full w-full object-cover"
                          />
                        ) : faIcon ? (
                          <FontAwesomeIcon
                            icon={faIcon}
                            aria-hidden="true"
                            style={{
                              width: "32px",
                              height: "32px",
                              filter: socialGlow,
                            }}
                          />
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                            className="block h-[32px] w-[32px] shrink-0"
                            style={{ filter: socialGlow }}
                          >
                            <path d={path} />
                          </svg>
                        )}
                      </a>
                    </Tooltip>
                  );
                })}
              </div>
            )}

            {/* content links */}
            {links.length > 0 && (
              <div className="mt-3 flex flex-col gap-3">
                {links.map((link) => (
                  <Tooltip
                    key={link.id}
                    label={link.url || link.title}
                  >
                    <a
                      href={preview ? "#" : (link.url ?? "#")}
                      target={preview ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      onAuxClick={() => {
                        if (!preview) trackClick(`/api/click?id=${link.id}`);
                      }}
                      onClick={(e) => {
                        if (!preview) trackClick(`/api/click?id=${link.id}`);
                        if (preview || e.ctrlKey || e.metaKey || e.shiftKey) return;
                        askLink(e, link.title, link.url ?? "#");
                      }}
                      className="flex items-center justify-center gap-4 border border-white/10 bg-white/[0.06] px-5 py-3.5 font-medium transition hover:bg-white/10"
                      style={{
                        color: textColor,
                        borderRadius: "12px",
                      }}
                    >
                      <span>{link.title}</span>
                      <svg
                        className="h-5 w-5 shrink-0 opacity-40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M7 17L17 7M17 7H7M17 7v10" />
                      </svg>
                    </a>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <LinkConfirm
        pending={pendingLink}
        onCancel={() => setPendingLink(null)}
        onConfirm={openPendingLink}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Picker preview                                                      */
/* ------------------------------------------------------------------ */

export function HaloPreview() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-3/4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 shrink-0 rounded-full bg-pink-400/40" />
          <div className="h-2.5 w-16 rounded-full bg-white/20" />
        </div>
        <div className="h-3.5 rounded bg-white/10" />
        <div className="flex justify-center gap-1.5 pt-1">
          <div className="h-4 w-4 rounded bg-white/15" />
          <div className="h-4 w-4 rounded bg-white/15" />
        </div>
      </div>
    </div>
  );
}
