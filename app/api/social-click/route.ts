import { NextResponse } from "next/server";
import { db, ensureSocialLinksSchema } from "@/lib/db";
import { socialLinks } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

async function trackClick(id: string): Promise<boolean> {
  if (!id) return false;
  try {
    await ensureSocialLinksSchema();
  } catch {
    // ignore
  }
  const [social] = await db
    .select({ id: socialLinks.id })
    .from(socialLinks)
    .where(eq(socialLinks.id, id));
  if (!social) return false;
  await db
    .update(socialLinks)
    .set({ clicks: sql`${socialLinks.clicks} + 1` })
    .where(eq(socialLinks.id, id));
  return true;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const id = (url.searchParams.get("id") ?? "").trim();
  const ok = await trackClick(id);
  return NextResponse.json({ ok });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = (url.searchParams.get("id") ?? "").trim();

  if (!id) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  try {
    await ensureSocialLinksSchema();
  } catch {
    // ignore
  }

  const [social] = await db
    .select({ url: socialLinks.url })
    .from(socialLinks)
    .where(eq(socialLinks.id, id));

  if (!social) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  await db
    .update(socialLinks)
    .set({ clicks: sql`${socialLinks.clicks} + 1` })
    .where(eq(socialLinks.id, id));

  return NextResponse.redirect(social.url);
}
