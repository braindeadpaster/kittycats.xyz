import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/shell";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { profiles, users } from "@/lib/schema";
import SettingsClient from "./client";

export const metadata = {
  title: "Account Settings — egirls.lol",
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/register");

  const [user] = await db.select().from(users).where(eq(users.id, session.id));
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.id));

  return (
    <DashboardShell>
      <SettingsClient
        username={user?.username ?? "user"}
        displayName={profile?.displayName ?? ""}
        email={user?.email ?? ""}
      />
    </DashboardShell>
  );
}
