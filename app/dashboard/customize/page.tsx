import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/shell";
import { getSession } from "@/lib/auth";
import { db, ensureProfileSchema } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getPremiumStatus } from "@/lib/premium";
import CustomizeClient from "./client";

export const metadata = {
  title: "Customize — egirls.lol",
};

export default async function CustomizePage() {
  const session = await getSession();
  if (!session) redirect("/register");

  let isPremium = false;
  try {
    isPremium = (await getPremiumStatus(session.id)).isPremium;
  } catch {
    isPremium = false;
  }

  let initial = {
    avatarUrl: null as string | null,
    backgroundUrl: null as string | null,
    bannerUrl: null as string | null,
    cursorUrl: null as string | null,
    backgroundColor: "#111111",
    avatarShape: "circle",
    displayName: "",
    description: "",
    bio: "",
    location: "",
    occupation: "",
    accentColor: "#ffffff",
    textColor: "#ffffff",
    usernameColor: null as string | null,
    iconColor: "#ffffff",
    blur: 0,
    cardOpacity: 100,
    tiltEnabled: false,
    glowEnabled: true,
    usernameGlow: true,
    gradientEnabled: false,
    gradientPrimary: "#881c9c",
    gradientSecondary: "#0d0d0d",
    overlayEnabled: false,
    overlayText: "Click to show",
    showViews: true,
    hideAvatar: false,
    viewsPosition: "top-right",
    showFeedback: true,
    layout: "halo",
    customActive: false,
  };

  try {
    await ensureProfileSchema();
    const [p] = await db.select().from(profiles).where(eq(profiles.userId, session.id));
    if (p) {
      initial = {
        avatarUrl: p.avatarUrl,
        backgroundUrl: p.backgroundUrl,
        bannerUrl: p.bannerUrl,
        cursorUrl: p.cursorUrl,
        backgroundColor: p.backgroundColor ?? "#111111",
        avatarShape: p.avatarShape ?? "circle",
        displayName: p.displayName ?? "",
        description: p.description ?? "",
        bio: p.bio ?? "",
        location: p.location ?? "",
        occupation: p.occupation ?? "",
        accentColor: p.accentColor ?? "#ffffff",
        textColor: p.textColor ?? "#ffffff",
        usernameColor: p.usernameColor ?? null,
        iconColor: p.socialColor ?? "#ffffff",
        blur: p.blur ?? 0,
        cardOpacity: p.cardOpacity ?? 100,
        tiltEnabled: Number(p.tiltEnabled ?? 0) !== 0,
        glowEnabled: p.glowEnabled == null ? true : Number(p.glowEnabled) !== 0,
        usernameGlow: p.usernameGlow == null ? true : Number(p.usernameGlow) !== 0,
        gradientEnabled: Number(p.gradientEnabled ?? 0) !== 0,
        gradientPrimary: p.gradientPrimary ?? "#881c9c",
        gradientSecondary: p.gradientSecondary ?? "#0d0d0d",
        overlayEnabled: Number(p.overlayEnabled ?? 0) !== 0,
        overlayText: p.overlayText ?? "Click to show",
        showViews: p.showViews == null ? true : Number(p.showViews) !== 0,
        hideAvatar: p.avatarHidden == null ? false : Number(p.avatarHidden) !== 0,
        viewsPosition: p.viewsPosition ?? "top-right",
        showFeedback: p.showFeedback == null ? true : Number(p.showFeedback) !== 0,
        layout: p.layout ?? "halo",
        customActive: (() => {
          try {
            const parsed = p.customLayout ? JSON.parse(p.customLayout) : null;
            return !!parsed?.enabled;
          } catch {
            return false;
          }
        })(),
      };
    }
  } catch {
    // render defaults instead of 500
  }

  return (
    <DashboardShell>
      <CustomizeClient
        isPremium={isPremium}
        initial={initial}
      />
    </DashboardShell>
  );
}
