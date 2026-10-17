import {
  db,
  ensureProfileSchema,
  ensureSocialLinksSchema,
  ensureUserBadgeSchema,
} from "@/lib/db";
import { badges, links, profiles, socialLinks, userBadges } from "@/lib/schema";
import { eq } from "drizzle-orm";
import DashboardShell from "@/components/dashboard/shell";
import CustomizeNav from "@/components/dashboard/customize-nav";
import AppearanceClient from "./client";
import { getSession } from "@/lib/auth";
import { getPremiumStatus } from "@/lib/premium";
import { getFeedback } from "@/lib/feedback";
import { getEnabledWidgets } from "@/lib/widgets";

export const metadata = {
  title: "Appearance — egirls.lol",
};

export default async function CustomizeAppearancePage() {
  const session = await getSession();
  if (!session) return null;

  let profile: typeof profiles.$inferSelect | null = null;
  let socials: Array<{ id: string; platform: string; url: string; iconUrl: string | null }> = [];
  let contentLinks: Array<{ id: string; title: string; url: string | null }> = [];
  let badgeList: Array<{ id: string | number; name: string; iconPrefix: string; iconName: string; iconUrl: string | null; color: string | null; userColor: string | null }> = [];
  let premium = { isPremium: false, plan: null as string | null };
  let feedback = { likes: 0, dislikes: 0, mine: null as null };
  let widgets: Awaited<ReturnType<typeof getEnabledWidgets>> = [];

  try {
    await ensureProfileSchema();
    await ensureSocialLinksSchema();
    await ensureUserBadgeSchema();

    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.id));
    profile = row ?? null;

    socials = (await db
      .select()
      .from(socialLinks)
      .where(eq(socialLinks.userId, session.id))
      .orderBy(socialLinks.order)) as typeof socials;

    contentLinks = (await db
      .select()
      .from(links)
      .where(eq(links.userId, session.id))
      .orderBy(links.createdAt)) as typeof contentLinks;

    badgeList = (await db
      .select({
        id: badges.id,
        name: badges.name,
        iconPrefix: badges.iconPrefix,
        iconName: badges.iconName,
        iconUrl: badges.iconUrl,
        color: badges.color,
        userColor: userBadges.color,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, session.id))
      .orderBy(userBadges.position, badges.name)) as typeof badgeList;

    try {
      premium = await getPremiumStatus(session.id);
    } catch {
      premium = { isPremium: false, plan: null };
    }
    try {
      feedback = (await getFeedback(session.id)) as typeof feedback;
    } catch {
      feedback = { likes: 0, dislikes: 0, mine: null };
    }
    try {
      widgets = await getEnabledWidgets(session.id);
    } catch {
      widgets = [];
    }
  } catch {
    // Render empty appearance editor instead of 500.
  }

  return (
    <DashboardShell
      title="Appearance"
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
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
      }
      subnav={<CustomizeNav />}
      maxWidth="max-w-4xl"
    >
      <AppearanceClient
        profile={
          profile
            ? {
                layout: profile.layout,
                accentColor: profile.accentColor,
                primaryColor: profile.primaryColor,
                textColor: profile.textColor,
                borderColor: profile.borderColor,
                backgroundColor: profile.backgroundColor,
                badgeColor: profile.badgeColor,
                socialColor: profile.socialColor,
                linkHoverColor: profile.linkHoverColor,
                borderRadius: profile.borderRadius,
                borderWidth: profile.borderWidth,
                cardWidth: profile.cardWidth,
                cardOpacity: profile.cardOpacity,
                borderOpacity: profile.borderOpacity,
                cardBlurEnabled: profile.cardBlurEnabled,
                cardBlur: profile.cardBlur,
                tiltEnabled: profile.tiltEnabled,
                tiltMode: profile.tiltMode,
                glowEnabled: profile.glowEnabled,
                overlayEnabled: profile.overlayEnabled,
                overlayText: profile.overlayText,
                avatarUrl: profile.avatarUrl,
                backgroundUrl: profile.backgroundUrl,
                description: profile.description,
                displayName: profile.displayName,
                cursorUrl: profile.cursorUrl,
                blur: profile.blur,
                showViews: profile.showViews,
                customLayout: profile.customLayout,
                avatarShape: profile.avatarShape,
                bio: profile.bio,
                location: profile.location,
                occupation: profile.occupation,
              }
            : null
        }
        socials={socials.map((s) => ({ id: s.id, platform: s.platform, url: s.url, iconUrl: s.iconUrl }))}
        links={contentLinks.map((l) => ({ id: l.id, title: l.title, url: l.url }))}
        badges={badgeList.map((b) => ({
          id: b.id,
          name: b.name,
          iconPrefix: b.iconPrefix,
          iconName: b.iconName,
          iconUrl: b.iconUrl,
          color: b.userColor ?? b.color,
        }))}
        isPremium={premium.isPremium}
        feedback={feedback}
        widgets={widgets}
        username={session.username}
        userId={session.id}
      />
    </DashboardShell>
  );
}
