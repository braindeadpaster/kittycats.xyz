import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { links } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

async function trackClick(id: string): Promise<boolean> {
  if (!id) return false;
  const [link] = await db
    .select({ id: links.id })
    .from(links)
    .where(eq(links.id, id));
  if (!link) return false;
  await db
    .update(links)
    .set({ clicks: sql`${links.clicks} + 1` })
    .where(eq(links.id, id));
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

  const [link] = await db
    .select({ url: links.url })
    .from(links)
    .where(eq(links.id, id));

  if (!link) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  await db
    .update(links)
    .set({ clicks: sql`${links.clicks} + 1` })
    .where(eq(links.id, id));

  return NextResponse.redirect(link.url);
}
