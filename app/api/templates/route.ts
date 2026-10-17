import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, ensureProfileSchema, ensureSocialLinksSchema, ensureTemplatesSchema, ensureUserBadgeSchema, ensureWidgetsSchema } from "@/lib/db";
import { badges, links, profiles, socialLinks, templates, userBadges } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { getPremiumStatus } from "@/lib/premium";
import { snapshotHasPremium } from "@/lib/templates";

const STYLE_KEYS = [
  "layout", "blur", "cardBlur", "overlayEnabled", "overlayText",
  "tiltEnabled", "tiltMode", "borderRadius", "borderWidth",
  "cardOpacity", "borderOpacity", "cardWidth", "cardBlurEnabled",
  "avatarShape", "showViews", "viewsPosition", "badgesPosition",
  "customLayout", "accentColor", "primaryColor", "textColor",
  "borderColor", "backgroundColor", "badgeColor", "socialColor",
  "linkHoverColor", "glowEnabled", "usernameGlow", "usernameColor",
  "gradientEnabled", "gradientPrimary", "gradientSecondary",
  "showFeedback", "avatarHidden",
] as const;

/** Snapshot the requester's current style (never identity, never assets). */
export async function snapshotProfile(userId: number) {
  await ensureProfileSchema();
  await ensureSocialLinksSchema();
  await ensureUserBadgeSchema();
  await ensureWidgetsSchema();

  const { profileWidgets } = await import("@/lib/schema");
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  const socials = await db
    .select({ platform: socialLinks.platform, url: socialLinks.url, iconUrl: socialLinks.iconUrl, order: socialLinks.order })
    .from(socialLinks)
    .where(eq(socialLinks.userId, userId))
    .orderBy(socialLinks.order);
  const contentLinks = await db
    .select({ title: links.title, url: links.url })
    .from(links)
    .where(eq(links.userId, userId))
    .orderBy(links.createdAt);
  const widgets = await db
    .select({ type: profileWidgets.type, enabled: profileWidgets.enabled, position: profileWidgets.position, config: profileWidgets.config })
    .from(profileWidgets)
    .where(eq(profileWidgets.userId, userId));
  const badgeRows = await db
    .select({
      name: badges.name,
      color: userBadges.color,
      position: userBadges.position,
      hidden: userBadges.hidden,
      glow: userBadges.glow,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId));

  const style: Record<string, unknown> = {};
  for (const key of STYLE_KEYS) {
    style[key] = (profile as Record<string, unknown> | undefined)?.[key] ?? null;
  }
  return {
    profile: style,
    socials,
    links: contentLinks,
    widgets,
    badges: badgeRows,
  };
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTemplatesSchema();

  let body: { name?: unknown; tags?: unknown; previewUrl?: unknown; visibility?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 30) : "";
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  const tags = typeof body.tags === "string"
    ? body.tags.split(",").map((t) => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 15)).filter(Boolean).slice(0, 6).join(",")
    : "";
  const previewUrl = typeof body.previewUrl === "string" && body.previewUrl.trim() ? body.previewUrl.trim().slice(0, 2000) : null;
  const visibility = body.visibility === "unlisted" ? "unlisted" : "public";

  const existing = await db.select({ id: templates.id }).from(templates).where(eq(templates.ownerId, session.id));
  if (existing.length >= 12) {
    return NextResponse.json({ error: "You can upload at most 12 templates." }, { status: 400 });
  }

  const snapshot = await snapshotProfile(session.id);

  const [row] = await db
    .insert(templates)
    .values({
      ownerId: session.id,
      name,
      description: null,
      previewUrl,
      tags,
      visibility,
      premiumOnly: snapshotHasPremium({ profile: snapshot.profile, badges: snapshot.badges }) ? 1 : 0,
      snapshot: JSON.stringify(snapshot),
    })
    .returning();

  return NextResponse.json({ template: row });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTemplatesSchema();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Template id required." }, { status: 400 });

  const { templateFavorites, templateUses } = await import("@/lib/schema");
  await db.delete(templates).where(and(eq(templates.id, id), eq(templates.ownerId, session.id)));
  await db.delete(templateFavorites).where(eq(templateFavorites.templateId, id));
  await db.delete(templateUses).where(eq(templateUses.templateId, id));
  return NextResponse.json({ ok: true });
}

/** Apply a template snapshot to the requester's own profile. */
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTemplatesSchema();
  await ensureProfileSchema();
  await ensureSocialLinksSchema();
  await ensureUserBadgeSchema();
  await ensureWidgetsSchema();

  let body: { id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Template id required." }, { status: 400 });

  const [tpl] = await db.select().from(templates).where(eq(templates.id, id));
  if (!tpl) return NextResponse.json({ error: "Template not found." }, { status: 404 });

  let snap: {
    profile?: Record<string, unknown>;
    socials?: Array<{ platform: string; url: string; iconUrl?: string | null; order?: number }>;
    links?: Array<{ title: string; url: string }>;
    widgets?: Array<{ type: string; enabled?: number; position?: number; config?: string | null }>;
    badges?: Array<{ name: string; color?: string | null; position?: number; hidden?: number; glow?: number }>;
  };
  try {
    snap = JSON.parse(tpl.snapshot);
  } catch {
    return NextResponse.json({ error: "Template is corrupted." }, { status: 400 });
  }

  const premium = await getPremiumStatus(session.id).catch(() => ({ isPremium: false }));
  const profileData: Record<string, string | number | null> = {};
  for (const key of STYLE_KEYS) {
    const v = snap.profile?.[key];
    if (v === undefined || v === null) continue;
    if (key === "customLayout") {
      if (!v) {
        profileData.customLayout = null;
        continue;
      }
      try {
        const parsed = typeof v === "string" ? JSON.parse(v) : v;
        if (parsed?.enabled && !premium.isPremium) continue;
        profileData.customLayout = typeof v === "string" ? v : JSON.stringify(v);
      } catch {
        continue;
      }
      continue;
    }
    if (typeof v === "string" || typeof v === "number") profileData[key] = v;
  }
  if (Object.keys(profileData).length > 0) {
    const [existing] = await db.select({ userId: profiles.userId }).from(profiles).where(eq(profiles.userId, session.id));
    if (existing) {
      await db.update(profiles).set(profileData).where(eq(profiles.userId, session.id));
    } else {
      await db.insert(profiles).values({ userId: session.id, ...profileData });
    }
  }

  // Socials + links are replaced by the template's (assets/identity untouched).
  await db.delete(socialLinks).where(eq(socialLinks.userId, session.id));
  if (Array.isArray(snap.socials) && snap.socials.length > 0) {
    await db.insert(socialLinks).values(
      snap.socials.slice(0, 30).map((s, i) => ({
        userId: session.id,
        platform: String(s.platform ?? "custom").slice(0, 40),
        url: String(s.url ?? "").slice(0, 2000),
        iconUrl: s.iconUrl ? String(s.iconUrl).slice(0, 2000) : null,
        order: i,
      }))
    );
  }
  await db.delete(links).where(eq(links.userId, session.id));
  if (Array.isArray(snap.links) && snap.links.length > 0) {
    await db.insert(links).values(
      snap.links.slice(0, 25).map((l) => ({
        userId: session.id,
        title: String(l.title ?? "Link").slice(0, 80),
        url: String(l.url ?? "").slice(0, 2000),
      }))
    );
  }

  // Widgets: enable/config per template.
  const { profileWidgets } = await import("@/lib/schema");
  if (Array.isArray(snap.widgets)) {
    for (const w of snap.widgets.slice(0, 20)) {
      if (!w?.type) continue;
      const [row] = await db
        .select({ id: profileWidgets.id })
        .from(profileWidgets)
        .where(and(eq(profileWidgets.userId, session.id), eq(profileWidgets.type, String(w.type))));
      if (row) {
        await db
          .update(profileWidgets)
          .set({ enabled: w.enabled ? 1 : 0, position: w.position ?? 0, config: w.config ?? null })
          .where(eq(profileWidgets.id, row.id));
      } else {
        await db.insert(profileWidgets).values({
          userId: session.id,
          type: String(w.type),
          enabled: w.enabled ? 1 : 0,
          position: w.position ?? 0,
          config: w.config ?? null,
        });
      }
    }
  }

  // Badge placement/display for badges the user already owns.
  if (Array.isArray(snap.badges)) {
    for (const b of snap.badges.slice(0, 40)) {
      if (!b?.name) continue;
      const [def] = await db.select({ id: badges.id }).from(badges).where(eq(badges.name, String(b.name)));
      if (!def) continue;
      const values: { color?: string; position?: number; hidden?: number; glow?: number } = {};
      if (typeof b.color === "string" && b.color) values.color = b.color.slice(0, 40);
      if (typeof b.position === "number") values.position = b.position;
      if (typeof b.hidden === "number") values.hidden = b.hidden ? 1 : 0;
      if (typeof b.glow === "number" && premium.isPremium) values.glow = b.glow ? 1 : 0;
      if (Object.keys(values).length === 0) continue;
      await db
        .update(userBadges)
        .set(values)
        .where(and(eq(userBadges.userId, session.id), eq(userBadges.badgeId, def.id)));
    }
  }

  const { templateUses } = await import("@/lib/schema");
  try {
    await db.update(templates).set({ useCount: tpl.useCount + 1 }).where(eq(templates.id, id));
  } catch {
    // ignore counter errors
  }
  try {
    await db.insert(templateUses).values({ templateId: id, userId: session.id });
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, premiumStripped: tpl.premiumOnly === 1 && !premium.isPremium });
}
