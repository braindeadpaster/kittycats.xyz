import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db, ensureUsersSchema } from "@/lib/db";
import { users, badges } from "@/lib/schema";
import { ensureDefaultBadges, canAccessAdminPanel } from "@/lib/badges";
import Sidebar from "@/components/dashboard/sidebar";
import AdminClient from "./admin-client";

export default async function AdminPage() {
  const session = await getSession();

  let canAccess = false;
  try {
    canAccess = await canAccessAdminPanel(session);
  } catch {
    canAccess = false;
  }
  if (!canAccess) {
    redirect("/dashboard");
  }
  if (!session) redirect("/register");

  let allUsers: Array<
    Omit<typeof users.$inferSelect, "isAdmin" | "premium"> & {
      isAdmin: boolean;
      premium: boolean;
    }
  > = [];
  let allBadges: Array<typeof badges.$inferSelect> = [];
  try {
    await ensureDefaultBadges();
    await ensureUsersSchema();

    const rows = await db.select().from(users);
    allUsers = rows.map((user) => ({
      ...user,
      isAdmin: !!(user as { isAdmin?: unknown }).isAdmin,
      premium: !!(user as { premium?: unknown }).premium,
    }));
    allBadges = await db.select().from(badges);
  } catch {
    allUsers = [];
    allBadges = [];
  }

  return (
    <div className="relative min-h-screen font-sans text-white flex">
      <Sidebar session={session} />
      <main className="flex-1 px-8 py-10 overflow-y-auto">
        <div className="w-full max-w-6xl">
          <AdminClient allUsers={allUsers} allBadges={allBadges} />
        </div>
      </main>
    </div>
  );
}
