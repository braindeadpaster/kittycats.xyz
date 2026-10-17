import { db, ensureProfileSchema } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import DashboardShell from "@/components/dashboard/shell";
import CustomizeNav from "@/components/dashboard/customize-nav";
import ProfileClient from "./client";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "Profile — egirls.lol",
};

export default async function CustomizeProfilePage() {
  const session = await getSession();
  if (!session) return null;

  let profile: typeof profiles.$inferSelect | null = null;
  try {
    await ensureProfileSchema();
    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.id));
    profile = row ?? null;
  } catch {
    profile = null;
  }

  return (
    <DashboardShell
      title="Profile"
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
        </svg>
      }
      subnav={<CustomizeNav />}
      maxWidth="max-w-4xl"
    >
      <ProfileClient
        profile={{
          avatarUrl: profile?.avatarUrl ?? null,
          backgroundUrl: profile?.backgroundUrl ?? null,
          backgroundColor: profile?.backgroundColor ?? "#111111",
          avatarShape: profile?.avatarShape ?? "circle",
          displayName: profile?.displayName ?? "",
          description: profile?.description ?? "",
          bio: profile?.bio ?? "",
          location: profile?.location ?? "",
          occupation: profile?.occupation ?? "",
        }}
      />
    </DashboardShell>
  );
}
