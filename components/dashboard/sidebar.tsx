import React from "react";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import SidebarClient from "./sidebar-client";

export interface SidebarSession {
  id: number;
  username: string;
  isAdmin: boolean;
}

export default async function Sidebar({ session }: { session: SidebarSession }) {
  let avatarUrl: string | null = null;
  if (session?.id) {
    try {
      const [profile] = await db
        .select({ avatarUrl: profiles.avatarUrl })
        .from(profiles)
        .where(eq(profiles.userId, session.id));
      avatarUrl = profile?.avatarUrl ?? null;
    } catch {
      avatarUrl = null;
    }
  }

  return (
    <SidebarClient
      username={session.username ?? ""}
      uid={session.id ?? null}
      avatarUrl={avatarUrl}
      isAdmin={!!session.isAdmin}
    />
  );
}
