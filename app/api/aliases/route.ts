import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, ensureAliasesSchema } from "@/lib/db";
import { aliases, users } from "@/lib/schema";
import { and, eq, sql } from "drizzle-orm";
import { isPremiumUser } from "@/lib/premium";

const ALIAS_RE = /^[a-zA-Z0-9_.]{3,16}$/;
const FREE_SLOTS = 1;
const PREMIUM_SLOTS = 5;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureAliasesSchema();
  const rows = await db.select().from(aliases).where(eq(aliases.userId, session.id));
  const premium = await isPremiumUser(session.id).catch(() => false);
  return NextResponse.json({
    aliases: rows,
    slots: premium ? PREMIUM_SLOTS : FREE_SLOTS,
    isPremium: premium,
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureAliasesSchema();

  let body: { alias?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const alias = typeof body.alias === "string" ? body.alias.trim() : "";
  if (!ALIAS_RE.test(alias)) {
    return NextResponse.json(
      { error: "Alias must be 3-16 chars: letters, numbers, _ or ." },
      { status: 400 }
    );
  }
  const premium = await isPremiumUser(session.id).catch(() => false);
  const slots = premium ? PREMIUM_SLOTS : FREE_SLOTS;
  const rows = await db.select().from(aliases).where(eq(aliases.userId, session.id));
  if (rows.length >= slots) {
    return NextResponse.json(
      { error: premium ? "Alias slots full." : "Upgrade to Premium for more alias slots." },
      { status: 400 }
    );
  }
  const [userTaken] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.username}) = lower(${alias})`);
  if (userTaken) return NextResponse.json({ error: "Alias is taken." }, { status: 409 });
  const [aliasTaken] = await db
    .select({ id: aliases.id })
    .from(aliases)
    .where(sql`lower(${aliases.alias}) = lower(${alias})`);
  if (aliasTaken) return NextResponse.json({ error: "Alias is taken." }, { status: 409 });

  const [row] = await db.insert(aliases).values({ userId: session.id, alias }).returning();
  return NextResponse.json({ alias: row });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureAliasesSchema();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Alias id required." }, { status: 400 });
  await db.delete(aliases).where(and(eq(aliases.id, id), eq(aliases.userId, session.id)));
  return NextResponse.json({ ok: true });
}
