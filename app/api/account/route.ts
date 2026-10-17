import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, ensureAliasesSchema, ensureProfileSchema } from "@/lib/db";
import { aliases, profiles, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,16}$/;

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { username?: unknown; displayName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.username !== undefined) {
    const next = typeof body.username === "string" ? body.username.trim() : "";
    if (!USERNAME_RE.test(next)) {
      return NextResponse.json(
        { error: "Username must be 3-16 chars: letters, numbers, _ or ." },
        { status: 400 }
      );
    }
    // Unique across users + aliases (case-insensitive via lower()).
    const { sql } = await import("drizzle-orm");
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.username}) = lower(${next})`);
    if (taken && taken.id !== session.id) {
      return NextResponse.json({ error: "Username is taken." }, { status: 409 });
    }
    try {
      await ensureAliasesSchema();
      const [aliasTaken] = await db
        .select({ id: aliases.id })
        .from(aliases)
        .where(sql`lower(${aliases.alias}) = lower(${next})`);
      if (aliasTaken) {
        return NextResponse.json({ error: "Username is taken." }, { status: 409 });
      }
    } catch {
      // ignore
    }
    await db.update(users).set({ username: next }).where(eq(users.id, session.id));
  }

  if (body.displayName !== undefined) {
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim().slice(0, 40) : "";
    await ensureProfileSchema();
    const [existing] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.userId, session.id));
    if (existing) {
      await db
        .update(profiles)
        .set({ displayName: displayName || null })
        .where(eq(profiles.userId, session.id));
    } else {
      await db.insert(profiles).values({ userId: session.id, displayName: displayName || null });
    }
  }

  return NextResponse.json({ ok: true });
}
