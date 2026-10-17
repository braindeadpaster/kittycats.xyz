import { db } from "@/lib/db";
import { aliases, links, pageViews, profiles, socialLinks, users } from "@/lib/schema";
import { count, eq, lte } from "drizzle-orm";
import DashboardShell from "@/components/dashboard/shell";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ViewsLineChart from "@/components/dashboard/views-line-chart";
import { V3Icon } from "@/components/dashboard/v3-icons";
import CompletionCard from "./completion-card";

export const metadata = {
  title: "Account Overview — egirls.lol",
};

function dayBuckets(days: number) {
  const out: { start: Date; label: string }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - i);
    start.setUTCHours(0, 0, 0, 0);
    out.push({
      start,
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  return out;
}

export default async function OverviewPage() {
  const session = await getSession();
  if (!session) redirect("/register");
  const uid = session.id;

  const [user] = await db.select().from(users).where(eq(users.id, uid));
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, uid));
  const socials = await db
    .select({ id: socialLinks.id })
    .from(socialLinks)
    .where(eq(socialLinks.userId, uid));
  const userLinks = await db
    .select({ id: links.id })
    .from(links)
    .where(eq(links.userId, uid));
  const userAliases = await db
    .select({ id: aliases.id })
    .from(aliases)
    .where(eq(aliases.userId, uid))
    .catch(() => [] as Array<{ id: string }>);

  const [{ total }] = await db.select({ total: count() }).from(users);
  const [{ rank }] = await db
    .select({ rank: count() })
    .from(users)
    .where(lte(users.id, uid));
  // "Among the first X%" — rank by join order (serial id).
  const percentile =
    total > 0 ? Math.min(99, Math.max(1, Math.round((rank / total) * 100))) : 1;

  const views = await db
    .select({ createdAt: pageViews.createdAt, device: pageViews.device })
    .from(pageViews)
    .where(eq(pageViews.userId, uid));

  const viewCount = views.length;
  const buckets = dayBuckets(7);
  const perDay = buckets.map((b) => {
    const end = new Date(b.start);
    end.setUTCDate(b.start.getUTCDate() + 1);
    return views.filter((v) => {
      const t = new Date(v.createdAt).getTime();
      return t >= b.start.getTime() && t < end.getTime();
    }).length;
  });
  const last7 = perDay.reduce((a, b) => a + b, 0);

  const deviceCounts: Record<string, number> = {};
  for (const v of views) {
    const d = (v.device as string | null) ?? "Unknown";
    deviceCounts[d] = (deviceCounts[d] ?? 0) + 1;
  }
  const topDevices = Object.entries(deviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const deviceTotal = Math.max(1, views.length);

  const completed = [
    !!profile?.avatarUrl,
    !!(profile?.description || profile?.bio),
    userLinks.length > 0,
    socials.length > 0,
    viewCount >= 10,
  ];
  const completionPct = Math.round((completed.filter(Boolean).length / completed.length) * 100);

  const statCards = [
    { label: "Username", value: user?.username ?? "—", sub: "Change available now", icon: "pencil" },
    {
      label: "Alias",
      value: `${userAliases.length} alias${userAliases.length === 1 ? "" : "es"} used`,
      sub: `${Math.max(0, 1 - userAliases.length)} alias slots remaining`,
      icon: "user",
    },
    { label: "UID", value: uid.toLocaleString(), sub: `Among the first ${percentile}%`, icon: "hash" },
    { label: "Profile Views", value: viewCount.toLocaleString(), sub: `+${last7} views since last 7 days`, icon: "eye" },
  ];

  const completionItems = [
    { label: "Upload An Avatar", icon: "camera", href: "/dashboard/customize/profile", done: completed[0] },
    { label: "Add A Description", icon: "align-left", href: "/dashboard/customize/profile", done: completed[1] },
    { label: "Add A Link", icon: "link", href: "/dashboard/links", done: completed[2] },
    { label: "Add Socials", icon: "share", href: "/dashboard/links", done: completed[3] },
    { label: "Reach 10 profile views", icon: "eye", href: "/dashboard/analytics", done: completed[4] },
  ];

  return (
    <DashboardShell>
      <div className="flex flex-col gap-[35px]">
        <div className="flex flex-col">
          <h1 className="mx-0 mt-0 mb-[15px] ml-[5px] text-[21px] font-medium text-[#e9e9e9]">
            Account Overview
          </h1>
          <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="flex flex-col gap-3 rounded-lg border border-pink-500/25 bg-pink-600/[0.07] p-5 transition-colors hover:border-pink-500/45"
              >
                <div className="flex items-center justify-between">
                  <h1 className="m-0 text-[15px] font-[550] text-[#cfcfcf]">{card.label}</h1>
                  <V3Icon name={card.icon} className="size-[22px] text-pink-400" />
                </div>
                <div>
                  <h1 className="m-0 truncate text-[24px] font-bold text-[#fafafa]">{card.value}</h1>
                  <h3 className="m-0 mt-1 text-[13px] font-[450] text-[#a1a1a1]">{card.sub}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="mx-0 mt-0 mb-[15px] ml-[5px] text-[21px] font-medium text-[#e9e9e9]">
            Account Statistics
          </h1>
          <div className="flex gap-[25px] max-[1240px]:flex-col">
            <CompletionCard completionPct={completionPct} items={completionItems} />
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="mx-0 mt-0 mb-[15px] ml-[5px] flex flex-wrap items-center gap-[10px] text-[21px] font-medium text-[#e9e9e9]">
            Account Analytics{" "}
            <a
              href="/dashboard/analytics"
              className="rounded-md border border-pink-500/50 bg-pink-600 px-[11px] py-[6px] text-[13px] font-semibold text-white no-underline transition-colors hover:bg-pink-500"
            >
              View More
            </a>
          </h1>
          <div className="flex gap-[25px] max-[1240px]:flex-col">
            <div className="w-full min-w-0 flex-1 rounded-lg border border-[#1e1e1e] bg-[#111111] p-[15px]">
              <h1 className="m-0 text-[17px] text-[#fafafa]">
                Profile Views in the last{" "}
                <span className="bg-[linear-gradient(90deg,#f472b6,#fbcfe8)] bg-clip-text font-bold text-transparent">
                  7 days
                </span>
              </h1>
              <div className="mt-2">
                <ViewsLineChart
                  data={buckets.map((b, i) => ({ label: b.label, value: perDay[i] }))}
                  height={300}
                />
              </div>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-4 rounded-lg border border-[#1e1e1e] bg-[#111111] p-5 lg:max-w-[340px]">
              <h1 className="m-0 text-[17px] text-[#fafafa]">
                Visitor Devices in the last{" "}
                <span className="bg-[linear-gradient(90deg,#f472b6,#fbcfe8)] bg-clip-text font-bold text-transparent">
                  7 days
                </span>
              </h1>
              {views.length === 0 ? (
                <div className="mx-auto my-[30px] max-w-[400px] text-center">
                  <h1 className="m-0 text-[17px] font-medium text-[#fafafa]">No device data yet</h1>
                  <h3 className="m-0 mt-1 text-[14px] font-[450] text-[#a1a1a1]">
                    Try sharing your egirls.lol page on social media to get more clicks!
                  </h3>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {topDevices.map(([device, n]) => (
                    <div key={device}>
                      <div className="mb-1 flex items-center justify-between text-[13px]">
                        <span className="font-medium text-[#e6e6e6]">{device}</span>
                        <span className="tabular-nums text-[#8a8a8a]">
                          {n} · {Math.round((n / deviceTotal) * 100)}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#1b1b1b]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#db2777] to-[#f472b6]"
                          style={{ width: `${Math.round((n / deviceTotal) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
