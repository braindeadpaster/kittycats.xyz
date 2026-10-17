import { db, ensureTemplatesSchema } from "@/lib/db";
import { templates } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

/** Dynamically detects premium features inside a template snapshot. */
export function snapshotHasPremium(snapshot: unknown): boolean {
  try {
    const s = typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot;
    if (!s || typeof s !== "object") return false;
    const custom = (s as Record<string, unknown>).profile as Record<string, unknown> | undefined;
    const layout = custom?.customLayout;
    if (typeof layout === "string" && layout) {
      try {
        const parsed = JSON.parse(layout);
        if (parsed?.enabled) return true;
      } catch {
        // not JSON — ignore
      }
    } else if (layout && typeof layout === "object" && (layout as { enabled?: unknown }).enabled) {
      return true;
    }
    const badges = (s as Record<string, unknown>).badges;
    if (Array.isArray(badges) && badges.some((b) => b && typeof b === "object" && (b as { glow?: unknown }).glow === 0)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function getTemplateFavCounts(): Promise<Record<string, number>> {
  const { templateFavorites } = await import("@/lib/schema");
  try {
    const rows = await db
      .select({ templateId: templateFavorites.templateId, count: sql<number>`count(*)::int` })
      .from(templateFavorites)
      .groupBy(templateFavorites.templateId);
    const out: Record<string, number> = {};
    for (const r of rows) out[r.templateId] = r.count;
    return out;
  } catch {
    return {};
  }
}
