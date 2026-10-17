import { db, ensureUsersSchema } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import DashboardShell from "@/components/dashboard/shell";
import { Card, CardContent, CardHeader, Divider } from "@/components/dashboard/ui";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/dashboard/logout-button";

export const metadata = {
  title: "Settings — egirls.lol",
};

export default async function SettingsAccountPage() {
  const session = await getSession();
  if (!session) return null;

  let email: string | null = null;
  let joinedAt: Date | null = null;
  try {
    await ensureUsersSchema();
    const [row] = await db
      .select({ email: users.email, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, session.id));
    email = row?.email ?? null;
    joinedAt = row?.createdAt ?? null;
  } catch {
    // Show session-only info on DB errors.
  }

  return (
    <DashboardShell
      title="Settings"
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
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      }
      maxWidth="max-w-4xl"
    >
      <Card>
        <CardHeader title="Account" description="Your account details.">
          <svg
            className="text-pink-300 size-6"
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
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Username
              </p>
              <p className="text-foreground mt-1 text-sm font-medium">{session.username}</p>
            </div>
            <Divider />
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                User ID
              </p>
              <p className="text-foreground mt-1 text-sm font-medium">
                {session.id.toLocaleString()}
              </p>
            </div>
            <Divider />
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Email
              </p>
              <p className="text-foreground mt-1 text-sm font-medium">{email ?? "—"}</p>
            </div>
            {joinedAt ? (
              <>
                <Divider />
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                    Joined
                  </p>
                  <p className="text-foreground mt-1 text-sm font-medium">
                    {joinedAt.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </>
            ) : null}
            <Divider />
            <div className="flex justify-end">
              <LogoutButton />
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
