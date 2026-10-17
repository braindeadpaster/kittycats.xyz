import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, ensureUserBadgeSchema } from "@/lib/db";
import { badges, userBadges } from "@/lib/schema";
import { isPremiumUser } from "@/lib/premium";
import { and, asc, eq } from "drizzle-orm";

/** Safe CSS color: #hex(3/6/8), rgb()/rgba()/hsl()/hsla(), or a color name. */
function isValidColor(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 40) return false;
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) return true;
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return true;
  if (/^#[0-9a-f]{8}$/i.test(trimmed)) return true;
  if (/^(rgb|rgba|hsl|hsla)\(/i.test(trimmed)) return true;
  if (/^[a-z]+$/i.test(trimmed)) return true;
  return false;
}

export async function GET() {
  const session = await getSession();

  await ensureUserBadgeSchema();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: badges.id,
      name: badges.name,
      iconPrefix: badges.iconPrefix,
      iconName: badges.iconName,
      iconUrl: badges.iconUrl,
      color: badges.color,
      userColor: userBadges.color,
      position: userBadges.position,
      hidden: userBadges.hidden,
      userGlow: userBadges.glow,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, session.id))
    .orderBy(asc(userBadges.position), asc(badges.name));

  const all = await db
    .select({
      id: badges.id,
      name: badges.name,
      iconPrefix: badges.iconPrefix,
      iconName: badges.iconName,
      iconUrl: badges.iconUrl,
      color: badges.color,
    })
    .from(badges)
    .orderBy(badges.name);

  const ownedIds = new Set(rows.map((row) => row.id));

  return NextResponse.json({
    badges: rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      iconPrefix: row.iconPrefix,
      iconName: row.iconName,
      iconUrl: row.iconUrl,
      color: row.userColor ?? row.color,
      position: row.position ?? 0,
      hidden: !!row.hidden,
      glow: row.userGlow == null ? true : row.userGlow !== 0,
    })),
    others: all
      .filter((badge) => !ownedIds.has(badge.id))
      .map((badge) => ({
        id: String(badge.id),
        name: badge.name,
        iconPrefix: badge.iconPrefix,
        iconName: badge.iconName,
        iconUrl: badge.iconUrl,
        color: badge.color,
      })),
  });
}

export async function PATCH(req: Request) {
  const session = await getSession();

  await ensureUserBadgeSchema();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    updates?: Array<Record<string, unknown>>;
    badgeId?: unknown;
    hidden?: unknown;
    color?: unknown;
    position?: unknown;
    glow?: unknown;
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates = Array.isArray(payload?.updates)
    ? payload.updates
    : payload?.badgeId !== undefined
      ? [
          {
            badgeId: payload.badgeId,
            hidden: payload.hidden,
            color: payload.color,
            position: payload.position,
            glow: payload.glow,
          },
        ]
      : [];

  if (updates.length === 0) {
    return NextResponse.json({ error: "No badge updates provided" }, { status: 400 });
  }

  const normalized = updates
    .map((entry) => {
      const badgeId =
        typeof entry?.badgeId === "string"
          ? entry.badgeId
          : String(entry?.badgeId ?? "");
      if (!badgeId) return null;

      const update: {
        badgeId: string;
        hidden?: number;
        color?: string;
        position?: number;
        glow?: number;
      } = {
        badgeId,
      };

      const hidden =
        entry?.hidden === true ||
        entry?.hidden === 1 ||
        entry?.hidden === "true" ||
        entry?.hidden === "1";
      const show =
        entry?.hidden === false ||
        entry?.hidden === 0 ||
        entry?.hidden === "false" ||
        entry?.hidden === "0";

      if (hidden || show) update.hidden = hidden ? 1 : 0;

      if (isValidColor(entry?.color)) update.color = (entry.color as string).trim();
      if (typeof entry?.position === "number" && Number.isInteger(entry.position)) {
        update.position = Math.min(Math.max(entry.position, 0), 10000);
      }

      if (
        entry?.glow === true ||
        entry?.glow === 1 ||
        entry?.glow === "1" ||
        entry?.glow === false ||
        entry?.glow === 0 ||
        entry?.glow === "0"
      ) {
        update.glow =
          entry?.glow === false || entry?.glow === 0 || entry?.glow === "0"
            ? 0
            : 1;
      }

      if (Object.keys(update).length === 1) return null;
      return update;
    })
    .filter(Boolean) as Array<{
    badgeId: string;
    hidden?: number;
    color?: string;
    position?: number;
    glow?: number;
  }>;

  if (normalized.length === 0) {
    return NextResponse.json({ error: "No valid badge updates provided" }, { status: 400 });
  }

  // Badge glow off is Premium-only. Non-premium users always keep glow on.
  let premium = true;
  try {
    premium = await isPremiumUser(session.id);
  } catch {
    premium = false;
  }

  for (const update of normalized) {
    const values: { hidden?: number; color?: string; position?: number; glow?: number } = {};
    if (update.hidden !== undefined) values.hidden = update.hidden;
    if (update.color !== undefined) values.color = update.color;
    if (update.position !== undefined) values.position = update.position;
    if (update.glow !== undefined) values.glow = premium ? update.glow : 1;

    await db
      .update(userBadges)
      .set(values)
      .where(and(eq(userBadges.userId, session.id), eq(userBadges.badgeId, update.badgeId)));
  }

  return NextResponse.json({ ok: true, updated: normalized.length });
}
