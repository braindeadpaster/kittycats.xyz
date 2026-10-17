import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/shell";
import { getSession } from "@/lib/auth";
import { db, ensureSocialLinksSchema } from "@/lib/db";
import { socialLinks } from "@/lib/schema";
import { asc, eq } from "drizzle-orm";
import SocialsClient from "./client";

export const metadata = {
  title: "Links — egirls.lol",
};

export interface SocialRow {
  id: string;
  platform: string;
  url: string;
  iconUrl: string | null;
  clicks: number;
}

export default async function LinksPage() {
  const session = await getSession();
  if (!session) redirect("/register");

  let socials: SocialRow[] = [];
  try {
    await ensureSocialLinksSchema();
    const rows = await db
      .select()
      .from(socialLinks)
      .where(eq(socialLinks.userId, session.id))
      .orderBy(asc(socialLinks.order));
    socials = rows.map((r) => ({
      id: r.id,
      platform: r.platform,
      url: r.url,
      iconUrl: r.iconUrl,
      clicks: r.clicks ?? 0,
    }));
  } catch {
    // render empty
  }

  return (
    <DashboardShell>
      <SocialsClient initial={socials} />
    </DashboardShell>
  );
}
