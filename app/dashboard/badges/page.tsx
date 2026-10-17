import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/shell";
import { getSession } from "@/lib/auth";
import { getPremiumStatus } from "@/lib/premium";
import { V3Icon } from "@/components/dashboard/v3-icons";
import BadgesManager from "./manager-client";

export const metadata = {
  title: "Badges — egirls.lol",
};

export default async function BadgesPage() {
  const session = await getSession();
  if (!session) redirect("/register");

  let isPremium = false;
  try {
    isPremium = (await getPremiumStatus(session.id)).isPremium;
  } catch {
    isPremium = false;
  }

  return (
    <DashboardShell>
      <div className="flex w-full min-w-0 flex-col gap-6">
        <BadgesManager isPremium={isPremium} />

        {!isPremium ? (
          <div
            className="flex flex-col gap-[20px] rounded-lg border-2 border-pink-500/25 bg-cover bg-center p-[20px]"
            style={{ backgroundImage: "url(/gradient-background.png)" }}
          >
            <div className="flex min-w-0 flex-col gap-[7px]">
              <h1 className="m-0 flex items-center gap-[7px] text-[23px] font-[500] text-[#fafafa]">
                <V3Icon name="crown" className="size-[1em] shrink-0" />
                Upgrade to Premium
              </h1>
              <h3 className="m-0 text-[18px] font-[450] break-words text-[#a5a5a5]">
                With egirls.lol Premium you can reorder, recolor, and toggle each badge individually.
              </h3>
            </div>
            <a
              href="/dashboard/premium"
              className="flex w-fit cursor-pointer items-center justify-center gap-[5px] rounded-md border-2 border-[#212121] bg-[#1a1a1a] px-[15px] py-[9px] text-center text-[17.5px] text-[#fafafa] no-underline transition-all duration-250 hover:bg-[#202020] active:translate-y-1"
            >
              Upgrade Now
            </a>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
