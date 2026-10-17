import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/shell";
import { getSession } from "@/lib/auth";
import { db, ensureTemplatesSchema } from "@/lib/db";
import { profiles, templateFavorites, templateUses, templates, users } from "@/lib/schema";
import { desc, eq, or } from "drizzle-orm";
import { getPremiumStatus } from "@/lib/premium";
import { getTemplateFavCounts, snapshotHasPremium } from "@/lib/templates";
import DiscoverClient, { type DiscoverTemplate } from "./client";

export const metadata = {
  title: "Templates — egirls.lol",
};

export default async function DiscoverPage() {
  const session = await getSession();
  if (!session) redirect("/register");

  let isPremium = false;
  try {
    isPremium = (await getPremiumStatus(session.id)).isPremium;
  } catch {
    isPremium = false;
  }

  let items: DiscoverTemplate[] = [];
  let myFavs: string[] = [];
  let lastUsedIds: string[] = [];

  try {
    await ensureTemplatesSchema();
    const rows = await db
      .select({
        id: templates.id,
        ownerId: templates.ownerId,
        name: templates.name,
        previewUrl: templates.previewUrl,
        tags: templates.tags,
        visibility: templates.visibility,
        premiumOnly: templates.premiumOnly,
        snapshot: templates.snapshot,
        useCount: templates.useCount,
        createdAt: templates.createdAt,
        ownerUsername: users.username,
        ownerDisplayName: profiles.displayName,
        ownerAvatarUrl: profiles.avatarUrl,
      })
      .from(templates)
      .leftJoin(users, eq(users.id, templates.ownerId))
      .leftJoin(profiles, eq(profiles.userId, templates.ownerId))
      .where(or(eq(templates.visibility, "public"), eq(templates.ownerId, session.id)))
      .orderBy(desc(templates.createdAt));

    const favCounts = await getTemplateFavCounts();
    const favRows = await db
      .select({ templateId: templateFavorites.templateId })
      .from(templateFavorites)
      .where(eq(templateFavorites.userId, session.id));
    myFavs = favRows.map((r) => r.templateId);
    const useRows = await db
      .select({ templateId: templateUses.templateId })
      .from(templateUses)
      .where(eq(templateUses.userId, session.id))
      .orderBy(desc(templateUses.usedAt));
    const seen = new Set<string>();
    for (const r of useRows) {
      if (!seen.has(r.templateId)) {
        seen.add(r.templateId);
        lastUsedIds.push(r.templateId);
      }
    }

    items = rows.map((r) => ({
      id: r.id,
      name: r.name,
      previewUrl: r.previewUrl,
      tags: (r.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      premiumOnly: (r.premiumOnly ?? 0) === 1 || snapshotHasPremium(r.snapshot),
      useCount: r.useCount ?? 0,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      ownerUsername: r.ownerUsername ?? "egirls",
      ownerDisplayName: r.ownerDisplayName ?? null,
      ownerAvatarUrl: r.ownerAvatarUrl ?? null,
      mine: r.ownerId === session.id,
      favCount: favCounts[r.id] ?? 0,
    }));
  } catch {
    // render empty instead of 500
  }

  return (
    <DashboardShell>
      <DiscoverClient
        templates={items}
        myFavs={myFavs}
        lastUsedIds={lastUsedIds}
        username={session.username}
        isPremium={isPremium}
      />
    </DashboardShell>
  );
}
