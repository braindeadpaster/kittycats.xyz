import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, ensureTemplatesSchema } from "@/lib/db";
import { templateFavorites, templates } from "@/lib/schema";
import { and, eq, sql } from "drizzle-orm";

/** Toggle favorite. POST /api/templates/favorite { id } */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTemplatesSchema();

  let body: { id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Template id required." }, { status: 400 });

  const [tpl] = await db.select({ id: templates.id }).from(templates).where(eq(templates.id, id));
  if (!tpl) return NextResponse.json({ error: "Template not found." }, { status: 404 });

  const [existing] = await db
    .select({ id: templateFavorites.id })
    .from(templateFavorites)
    .where(and(eq(templateFavorites.templateId, id), eq(templateFavorites.userId, session.id)));

  if (existing) {
    await db.delete(templateFavorites).where(eq(templateFavorites.id, existing.id));
    return NextResponse.json({ favorited: false });
  }
  await db.insert(templateFavorites).values({ templateId: id, userId: session.id });
  return NextResponse.json({ favorited: true });
}

/** Favorite counts per template. GET /api/templates/favorite?ids=a,b,c */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTemplatesSchema();

  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100);
  if (ids.length === 0) return NextResponse.json({ counts: {}, mine: [] });

  const rows = await db
    .select({ templateId: templateFavorites.templateId, count: sql<number>`count(*)::int` })
    .from(templateFavorites)
    .where(sql`${templateFavorites.templateId} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`)
    .groupBy(templateFavorites.templateId);
  const mine = await db
    .select({ templateId: templateFavorites.templateId })
    .from(templateFavorites)
    .where(
      and(
        eq(templateFavorites.userId, session.id),
        sql`${templateFavorites.templateId} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`
      )
    );
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.templateId] = r.count;
  return NextResponse.json({ counts, mine: mine.map((m) => m.templateId) });
}
