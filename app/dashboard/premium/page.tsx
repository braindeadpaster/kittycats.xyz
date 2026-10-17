import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPremiumStatus } from "@/lib/premium";
import DashboardShell from "@/components/dashboard/shell";
import PremiumClient from "./premium-client";

export const metadata = {
  title: "Premium — egirls.lol",
};

export default async function PremiumPage() {
  const session = await getSession();
  if (!session) redirect("/register");

  let premium = { isPremium: false, plan: null as string | null, expiresAt: null as Date | null };
  try {
    premium = await getPremiumStatus(session.id);
  } catch {
    premium = { isPremium: false, plan: null, expiresAt: null };
  }

  return (
    <DashboardShell>
      <div className="fixed inset-0 z-40 bg-black/70" aria-hidden="true" />
      <div className="relative z-40 flex w-full justify-center px-4 py-10">
        <PremiumClient
          initialIsPremium={premium.isPremium}
          initialPlan={premium.plan}
          initialExpiresAt={premium.expiresAt ? premium.expiresAt.toISOString() : null}
        />
      </div>
    </DashboardShell>
  );
}
