import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { links } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

const MAX_LINKS = 25;
const URL_RE = /^https?:\/\/.+/i;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(links)
    .where(eq(links.userId, session.id))
    .orderBy(links.createdAt);

  return NextResponse.json({ links: rows });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: unknown; url?: unknown };
  try {
    body = (await req.json()) as { title?: unknown; url?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!title || !url) {
    return NextResponse.json(
      { error: "Title and URL are required." },
      { status: 400 }
    );
  }
  if (!URL_RE.test(url)) {
    return NextResponse.json(
      { error: "URL must start with http:// or https://" },
      { status: 400 }
    );
  }

  const existing = await db
    .select({ id: links.id })
    .from(links)
    .where(eq(links.userId, session.id));
  if (existing.length >= MAX_LINKS) {
    return NextResponse.json(
      { error: `You can have at most ${MAX_LINKS} links.` },
      { status: 400 }
    );
  }

  const [row] = await db
    .insert(links)
    .values({ userId: session.id, title: title.slice(0, 80), url: url.slice(0, 2000) })
    .returning();

  return NextResponse.json({ link: row });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id?: unknown; title?: unknown; url?: unknown };
  try {
    body = (await req.json()) as { id?: unknown; title?: unknown; url?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.id !== "string") {
    return NextResponse.json({ error: "Link id is required." }, { status: 400 });
  }

  const [owned] = await db
    .select({ id: links.id })
    .from(links)
    .where(and(eq(links.id, body.id), eq(links.userId, session.id)));
  if (!owned) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }

  const fields: { title?: string; url?: string } = {};
  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    fields.title = title.slice(0, 80);
  }
  if (typeof body.url === "string") {
    const url = body.url.trim();
    if (!url) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }
    if (!URL_RE.test(url)) {
      return NextResponse.json(
        { error: "URL must start with http:// or https://" },
        { status: 400 }
      );
    }
    fields.url = url.slice(0, 2000);
  }

  const [row] = await db
    .update(links)
    .set(fields)
    .where(and(eq(links.id, body.id), eq(links.userId, session.id)))
    .returning();

  return NextResponse.json({ link: row });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Link id is required." }, { status: 400 });
  }

  await db
    .delete(links)
    .where(and(eq(links.id, id), eq(links.userId, session.id)));

  return NextResponse.json({ ok: true });
}
