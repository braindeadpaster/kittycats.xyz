"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import ViewsLineChart from "@/components/dashboard/views-line-chart";
import { V3Icon } from "@/components/dashboard/v3-icons";
import type { CityData, ClickData, CountryData, DeviceData, GlobePoint, RangeData, ReferrerData } from "./page";
import { COUNTRY_NAMES } from "@/lib/analytics";
import { v3Flags } from "@/components/dashboard/v3-flags";

const GlobeView = dynamic(() => import("./globe-view"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-[320px] w-full place-items-center rounded-md bg-[#0a0a0a]">
      <p className="m-0 text-[13px] text-[#707070]">Loading earth…</p>
    </div>
  ),
});

function CountryFlag({ code }: { code: string }) {
  const svg = v3Flags[code.toLowerCase()];
  if (!svg) {
    return (
      <span className="grid size-8 shrink-0 place-content-center rounded-md bg-[#1e1e1e] text-[12px] font-bold text-white">
        {code === "UNKNOWN" ? "—" : code}
      </span>
    );
  }
  return (
    <span
      className="block size-8 shrink-0 overflow-hidden rounded-md ring-1 ring-white/10 [&>svg]:block [&>svg]:size-full [&>svg]:object-cover"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

const RANGES = [
  { id: "24h", label: "24H" },
  { id: "3d", label: "3D" },
  { id: "7d", label: "7D" },
  { id: "14d", label: "14D", premium: true },
];

const RANGE_DAYS: Record<string, number> = { "24h": 1, "3d": 3, "7d": 7, "14d": 14 };

const DEVICE_DOT: Record<string, string> = {
  Desktop: "bg-pink-500",
  Mobile: "bg-[#5661f6]",
  Tablet: "bg-[#22d3ee]",
  Bot: "bg-[#525252]",
  Unknown: "bg-[#3a3a3a]",
};

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#1c1c1c]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#db2777] to-[#f472b6] transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mx-auto my-8 max-w-[400px] px-4 text-center">
      <div className="mx-auto mb-3 grid size-11 place-content-center rounded-md bg-[#1a1a1a] text-[#6a6a6a]">
        <V3Icon name="analytics" className="size-5" />
      </div>
      <h1 className="m-0 text-[16px] font-[550] text-[#e6e6e6]">{title}</h1>
      <h3 className="m-0 mt-1 text-[13px] font-[450] leading-relaxed text-[#8a8a8a]">{sub}</h3>
    </div>
  );
}

function deltaChip(count: number, prev: number) {
  if (prev <= 0) {
    return count > 0 ? (
      <span className="rounded border border-pink-500/40 bg-pink-600/15 px-1.5 py-0.5 text-[11px] font-bold text-pink-300">
        NEW
      </span>
    ) : null;
  }
  const pct = Math.round(((count - prev) / prev) * 100);
  if (pct === 0) {
    return (
      <span className="rounded border border-[#2a2a2a] bg-[#1a1a1a] px-1.5 py-0.5 text-[11px] font-bold text-[#8a8a8a]">
        ±0%
      </span>
    );
  }
  const up = pct > 0;
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[11px] font-bold ${
        up
          ? "border-pink-500/40 bg-pink-600/15 text-pink-300"
          : "border-[#2a2a2a] bg-[#1a1a1a] text-[#8a8a8a]"
      }`}
    >
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

export default function AnalyticsClient({
  isPremium,
  totalViews,
  totalClicks,
  totalSocialClicks,
  clickRate,
  uniqueVisitors,
  peakDay,
  peakValue,
  rangeData,
  devices,
  countries,
  cities,
  globePoints,
  referrers,
  topLinks,
  topSocials,
}: {
  isPremium: boolean;
  totalViews: number;
  totalClicks: number;
  totalSocialClicks: number;
  clickRate: number;
  uniqueVisitors: number;
  peakDay: string;
  peakValue: number;
  rangeData: Record<string, RangeData>;
  devices: DeviceData[];
  countries: CountryData[];
  cities: CityData[];
  globePoints: GlobePoint[];
  referrers: ReferrerData[];
  topLinks: ClickData[];
  topSocials: ClickData[];
}) {
  const [range, setRange] = useState("7d");

  const ranges = RANGES.filter((r) => isPremium || !r.premium);
  const activeRange = ranges.some((r) => r.id === range) ? range : "7d";
  const data = rangeData[activeRange] ?? rangeData["7d"];
  const sub = activeRange === "24h" ? "last 24 hours" : `last ${RANGE_DAYS[activeRange] ?? 7} days`;
  const inSub = activeRange === "24h" ? "In the last 24 hours" : `In the last ${RANGE_DAYS[activeRange] ?? 7} days`;
  const emptyHint = "Try sharing your egirls.lol page on social media to get more views!";

  const knownCountries = countries.filter((c) => c.country !== "UNKNOWN");
  const topCountry = knownCountries[0];
  const topReferrer = referrers[0];
  const topDevice = devices.filter((d) => d.device !== "Bot" && d.device !== "Unknown")[0] ?? devices[0];

  const statCards = [
    { label: "Profile Views", value: totalViews.toLocaleString(), sub: `+${data.count} views ${sub}`, icon: "eye", chip: deltaChip(data.count, data.prev) },
    { label: "Unique Visitors", value: uniqueVisitors.toLocaleString(), sub: "Distinct IPs all time", icon: "user", chip: null },
    { label: "Total Link Clicks", value: totalClicks.toLocaleString(), sub: inSub, icon: "bolt", chip: null },
    { label: "Social Clicks", value: totalSocialClicks.toLocaleString(), sub: inSub, icon: "share", chip: null },
    { label: "Click Rate", value: `${clickRate.toFixed(1)}%`, sub: "Clicks ÷ views", icon: "chartColumns", chip: null },
    { label: "Best Day", value: peakValue > 0 ? peakDay : "—", sub: peakValue > 0 ? `${peakValue.toLocaleString()} views (14d)` : "No views yet", icon: "calendar", chip: null },
  ];

  return (
    <div className="flex w-full min-w-0 flex-col">
      {/* header */}
      <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="m-0 flex items-center gap-2 text-[20px] font-semibold text-[#f2f2f2]">
              <V3Icon name="analytics" className="size-5 text-pink-400" />
              Account Analytics
            </h1>
            <p className="m-0 mt-1 text-[14px] text-[#8a8a8a]">
              Track your profile performance — views, visitors, devices, countries, referrers and clicks.
            </p>
          </div>
          <div className="flex shrink-0 gap-1 rounded-md border border-[#222] bg-[#0c0c0c] p-1">
            {ranges.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                aria-pressed={activeRange === r.id}
                className={`cursor-pointer rounded px-3 py-1.5 text-[12px] font-bold transition-colors ${
                  activeRange === r.id
                    ? "bg-pink-600 text-white"
                    : "text-[#8a8a8a] hover:bg-[#1a1a1a] hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        {totalViews > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[#1e1e1e] pt-4">
            {topCountry ? (
              <span className="inline-flex items-center gap-1.5 rounded border border-[#222] bg-[#0c0c0c] px-2.5 py-1.5 text-[12px] text-[#bebebe]">
                <span className="font-semibold text-pink-300">{topCountry.pct}%</span> of views from {COUNTRY_NAMES[topCountry.country] ?? topCountry.country}
              </span>
            ) : null}
            {topReferrer ? (
              <span className="inline-flex items-center gap-1.5 rounded border border-[#222] bg-[#0c0c0c] px-2.5 py-1.5 text-[12px] text-[#bebebe]">
                Top source: <span className="font-semibold text-white">{topReferrer.referrer}</span>
              </span>
            ) : null}
            {topDevice ? (
              <span className="inline-flex items-center gap-1.5 rounded border border-[#222] bg-[#0c0c0c] px-2.5 py-1.5 text-[12px] text-[#bebebe]">
                <span className={`size-2 rounded-full ${DEVICE_DOT[topDevice.device] ?? DEVICE_DOT.Unknown}`} />
                {topDevice.pct}% on {topDevice.device}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* stats */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4 transition-colors hover:border-pink-500/30"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="m-0 text-[13px] font-medium text-[#9a9a9a]">{card.label}</p>
              <span className="grid size-8 place-content-center rounded-md bg-pink-600/15 text-pink-400">
                <V3Icon name={card.icon} className="size-4" />
              </span>
            </div>
            <p className="m-0 mt-2 flex items-center gap-2 text-[26px] font-bold tabular-nums text-white">
              {card.value}
              {card.chip}
            </p>
            <p className="m-0 mt-0.5 truncate text-[12px] text-[#7a7a7a]">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* views + devices */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="m-0 text-[16px] font-semibold text-white">Profile Views</h2>
              <p className="m-0 mt-0.5 text-[13px] text-[#7a7a7a]">Avg {data.avg.toLocaleString()} per day · {sub} · vs prior period {deltaChip(data.count, data.prev)}</p>
            </div>
          </div>
          <div className="mt-3">
            <ViewsLineChart data={data.buckets} height={300} />
          </div>
        </div>
        <div className="min-w-0 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="m-0 text-[16px] font-semibold text-white">Visitor Devices</h2>
          <p className="m-0 mt-0.5 text-[13px] text-[#7a7a7a]">Logged from visitor user-agents</p>
          {devices.length === 0 ? (
            <Empty title="No device data yet" sub={emptyHint} />
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {devices.map((d) => (
                <div key={d.device}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-[14px] font-medium text-[#e6e6e6]">
                      <span className={`size-2.5 shrink-0 rounded-full ${DEVICE_DOT[d.device] ?? DEVICE_DOT.Unknown}`} />
                      <span className="truncate">{d.device}</span>
                    </span>
                    <span className="shrink-0 text-[13px] tabular-nums text-[#8a8a8a]">
                      {d.count.toLocaleString()} · {d.pct}%
                    </span>
                  </div>
                  <Bar pct={d.pct} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* socials + buttons */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="m-0 text-[16px] font-semibold text-white">Most Clicked Socials</h2>
          <p className="m-0 mt-0.5 text-[13px] text-[#7a7a7a]">Clicks per social icon</p>
          {topSocials.length === 0 || topSocials.every((s) => s.clicks === 0) ? (
            <Empty title="No socials clicked yet" sub={emptyHint} />
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {topSocials.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 rounded-md border border-[#1d1d1d] bg-[#141414] p-3">
                  <span className="grid size-8 shrink-0 place-content-center rounded-md bg-pink-600/20 text-[13px] font-bold text-pink-300">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-[14px] font-medium text-white">{s.label}</p>
                    <p className="m-0 truncate text-[12px] text-[#7a7a7a]">{s.sub}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#1e1e1e] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white">
                    {s.clicks.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="m-0 text-[16px] font-semibold text-white">Most Clicked Links</h2>
            {isPremium ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-pink-500/50 bg-pink-600/20 px-2 py-1 text-[11px] font-semibold text-white">
              <V3Icon name="crown" className="size-3" />
              Premium
            </span>
            ) : null}
          </div>
          <p className="m-0 mt-0.5 text-[13px] text-[#7a7a7a]">Clicks per link button</p>
          {topLinks.length === 0 || topLinks.every((l) => l.clicks === 0) ? (
            <Empty title="No links clicked yet" sub={emptyHint} />
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {topLinks.map((l, i) => (
                <div key={l.id} className="flex items-center gap-3 rounded-md border border-[#1d1d1d] bg-[#141414] p-3">
                  <span className="grid size-8 shrink-0 place-content-center rounded-md bg-[#1e1e1e] text-[13px] font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-[14px] font-medium text-white">{l.label}</p>
                    <p className="m-0 truncate text-[12px] text-[#7a7a7a]">{l.sub}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#1e1e1e] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white">
                    {l.clicks.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* globe + countries */}
      <div className="mt-4 min-w-0 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="m-0 flex items-center gap-2 text-[16px] font-semibold text-white">
              <V3Icon name="globe" className="size-4 text-pink-400" />
              Visitor Globe
            </h2>
            <p className="m-0 mt-0.5 text-[13px] text-[#7a7a7a]">Drag to spin · scroll to zoom · pink dots are visits</p>
          </div>
          <span className="rounded-full border border-pink-500/50 bg-pink-600/20 px-2.5 py-1 text-[12px] font-medium tabular-nums text-pink-200">
            {globePoints.length} {globePoints.length === 1 ? "marker" : "markers"}
          </span>
        </div>
        <div className="mt-3">
          <GlobeView points={globePoints} />
        </div>
        <h3 className="m-0 mt-4 text-[14px] font-semibold text-white">Top Countries by Views</h3>
        <p className="m-0 mt-0.5 text-[13px] text-[#7a7a7a]">Logged from visitor IPs</p>
        {knownCountries.length === 0 ? (
          <Empty
            title={totalViews > 0 ? "Views recorded, but no location data" : "No countries data yet"}
            sub={
              totalViews > 0
                ? "Location attaches to new visits only. On Vercel it is automatic; locally set VIEWER_GEO in .env (and restart the dev server), then visit a profile again."
                : emptyHint
            }
          />
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {knownCountries.map((c, i) => (
              <div key={c.country} className="flex items-center gap-3 rounded-md border border-[#1d1d1d] bg-[#141414] p-3">
                <CountryFlag code={c.country} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[14px] font-medium text-white">
                    {COUNTRY_NAMES[c.country] ?? c.country}
                  </p>
                  <div className="mt-1.5">
                    <Bar pct={c.pct} />
                  </div>
                </div>
                <span className="shrink-0 text-[12px] tabular-nums text-[#8a8a8a]">
                  #{i + 1} · {c.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* referrers + cities */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
          <div className="flex items-center gap-1.5">
            <h2 className="m-0 text-[16px] font-semibold text-white">Top Referrers</h2>
            <span className="cursor-help text-[#6a6a6a]" title="Where your visitors come from — e.g. a view from your Instagram bio shows as Instagram">
              <V3Icon name="info" className="size-4" />
            </span>
          </div>
          <p className="m-0 mt-0.5 text-[13px] text-[#7a7a7a]">Instagram, TikTok, Direct…</p>
          {referrers.length === 0 ? (
            <Empty title="No referrers yet" sub={emptyHint} />
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {referrers.map((r) => (
                <div key={r.referrer}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-[14px]">
                    <span className="truncate font-medium text-[#e6e6e6]">{r.referrer}</span>
                    <span className="shrink-0 tabular-nums text-[13px] text-[#8a8a8a]">
                      {r.count.toLocaleString()} · {r.pct}%
                    </span>
                  </div>
                  <Bar pct={r.pct} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="m-0 text-[16px] font-semibold text-white">Top Cities by Views</h2>
          <p className="m-0 mt-0.5 text-[13px] text-[#7a7a7a]">Logged from visitor IPs · needs new visits</p>
          {cities.length === 0 ? (
            <Empty title="No city data yet" sub="Cities are recorded from new visits — share your page to fill this in!" />
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {cities.map((c, i) => (
                <div key={`${c.city}-${c.country}`} className="flex items-center gap-3 rounded-md border border-[#1d1d1d] bg-[#141414] p-3">
                  <CountryFlag code={c.country} />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-[14px] font-medium text-white">
                      {c.city}
                      <span className="ml-1.5 text-[12px] font-normal text-[#7a7a7a]">
                        {COUNTRY_NAMES[c.country] ?? c.country}
                      </span>
                    </p>
                    <div className="mt-1.5">
                      <Bar pct={c.pct} />
                    </div>
                  </div>
                  <span className="shrink-0 text-[12px] tabular-nums text-[#8a8a8a]">
                    #{i + 1} · {c.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
