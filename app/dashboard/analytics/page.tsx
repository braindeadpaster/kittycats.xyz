import { COUNTRY_LATLNG } from "@/lib/analytics";
import { db } from "@/lib/db";
import { ensureAnalyticsSchema, ensureSocialLinksSchema } from "@/lib/db";
import { links, pageViews, socialLinks, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/shell";
import { getSession } from "@/lib/auth";
import AnalyticsClient from "./client";

export const metadata = {
  title: "Account Analytics — egirls.lol",
};

export interface RangeData {
  count: number;
  avg: number;
  /** Views in the window right before this one (for delta chips). */
  prev: number;
  buckets: { label: string; value: number }[];
}

export interface DeviceData {
  device: string;
  count: number;
  pct: number;
}

export interface CountryData {
  country: string;
  count: number;
  pct: number;
}

export interface ReferrerData {
  referrer: string;
  count: number;
  pct: number;
}

export interface ClickData {
  id: string;
  label: string;
  sub: string;
  clicks: number;
}

export interface CityData {
  city: string;
  country: string;
  count: number;
  pct: number;
}

export interface GlobePoint {
  country: string;
  lat: number;
  lng: number;
  count: number;
}

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;

function buildRange(times: number[], days: number, hourly: boolean): RangeData {
  const now = Date.now();
  const bucketCount = hourly ? 24 : days;
  const bucketMs = hourly ? HOUR_MS : DAY_MS;
  const buckets: RangeData["buckets"] = [];
  for (let i = bucketCount - 1; i >= 0; i--) {
    const start = now - (i + 1) * bucketMs;
    const end = start + bucketMs;
    const value = times.filter((t) => t >= start && t < end).length;
    let label = "";
    if (hourly) {
      if (i % 4 === 0) {
        label = new Date(start).toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        });
      }
    } else {
      label = new Date(start).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
    buckets.push({ label, value });
  }
  const count = buckets.reduce((a, b) => a + b.value, 0);
  const prevStart = now - 2 * bucketCount * bucketMs;
  const prevEnd = now - bucketCount * bucketMs;
  const prev = times.filter((t) => t >= prevStart && t < prevEnd).length;
  return { count, avg: Math.round(count / Math.max(1, days)), prev, buckets };
}

function topBy<T extends string>(values: T[], limit = 8) {
  const map = new Map<string, number>();
  for (const v of values) {
    const key = (v || "Unknown").trim() || "Unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const total = Math.max(1, values.length);
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, n]) => ({ key, count: n, pct: Math.round((n / total) * 100) }));
}

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/register");
  const uid = session.id;

  try {
    await ensureAnalyticsSchema();
    await ensureSocialLinksSchema();
  } catch {
    // ignore
  }

  const [user] = await db.select().from(users).where(eq(users.id, uid));
  const views = await db
    .select({
      createdAt: pageViews.createdAt,
      ip: pageViews.ip,
      device: pageViews.device,
      country: pageViews.country,
      city: pageViews.city,
      latitude: pageViews.latitude,
      longitude: pageViews.longitude,
      referrer: pageViews.referrer,
    })
    .from(pageViews)
    .where(eq(pageViews.userId, uid))
    .catch(
      () =>
        [] as Array<{
          createdAt: Date;
          ip: string | null;
          device: string | null;
          country: string | null;
          city: string | null;
          latitude: string | null;
          longitude: string | null;
          referrer: string | null;
        }>
    );
  const userLinks = await db
    .select({ id: links.id, title: links.title, url: links.url, clicks: links.clicks })
    .from(links)
    .where(eq(links.userId, uid))
    .catch(() => [] as Array<{ id: string; title: string; url: string; clicks: number | null }>);
  const userSocials = await db
    .select({
      id: socialLinks.id,
      platform: socialLinks.platform,
      url: socialLinks.url,
      clicks: socialLinks.clicks,
    })
    .from(socialLinks)
    .where(eq(socialLinks.userId, uid))
    .catch(() => [] as Array<{ id: string; platform: string; url: string; clicks: number | null }>);

  const totalViews = views.length;
  const totalClicks = userLinks.reduce((a, l) => a + (l.clicks ?? 0), 0);
  const totalSocialClicks = userSocials.reduce((a, s) => a + (s.clicks ?? 0), 0);
  const clickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  const times = views.map((v) => new Date(v.createdAt).getTime());

  const rangeData: Record<string, RangeData> = {
    "24h": buildRange(times, 1, true),
    "3d": buildRange(times, 3, false),
    "7d": buildRange(times, 7, false),
    "14d": buildRange(times, 14, false),
  };

  const devices: DeviceData[] = topBy(
    views.map((v) => (v.device as string | null) ?? "Unknown")
  ).map((d) => ({ device: d.key, count: d.count, pct: d.pct }));

  const countries: CountryData[] = topBy(
    views.map((v) => ((v.country as string | null) ?? "Unknown").toUpperCase())
  ).map((d) => ({ country: d.key, count: d.count, pct: d.pct }));

  const cities: CityData[] = (() => {
    const map = new Map<string, { count: number; country: string }>();
    for (const v of views) {
      const city = (v.city ?? "").trim();
      if (!city) continue;
      const country = ((v.country as string | null) ?? "Unknown").toUpperCase();
      const key = `${city}||${country}`;
      const cur = map.get(key) ?? { count: 0, country };
      cur.count += 1;
      map.set(key, cur);
    }
    const total = Math.max(1, views.length);
    return [...map.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([key, v]) => ({
        city: key.split("||")[0],
        country: v.country,
        count: v.count,
        pct: Math.round((v.count / total) * 100),
      }));
  })();

  const uniqueVisitors = new Set(
    views.map((v) => (v.ip ?? "").trim()).filter(Boolean)
  ).size;

  // Best day in the last 14 days.
  const range14 = buildRange(times, 14, false);
  let peakDay = "—";
  let peakValue = 0;
  for (const b of range14.buckets) {
    if (b.value > peakValue) {
      peakValue = b.value;
      peakDay = b.label || "—";
    }
  }

  // Globe markers: prefer per-view GPS coords, fall back to country centroids.
  const globePoints: GlobePoint[] = (() => {
    const byCoord = new Map<string, GlobePoint>();
    for (const v of views) {
      const lat = v.latitude != null ? Number.parseFloat(v.latitude) : NaN;
      const lng = v.longitude != null ? Number.parseFloat(v.longitude) : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
      const cur = byCoord.get(key) ?? {
        country: ((v.country as string | null) ?? "Unknown").toUpperCase(),
        lat,
        lng,
        count: 0,
      };
      cur.count += 1;
      byCoord.set(key, cur);
    }
    if (byCoord.size > 0) {
      return [...byCoord.values()].sort((a, b) => b.count - a.count).slice(0, 100);
    }
    return countries
      .filter((c) => c.country !== "UNKNOWN" && COUNTRY_LATLNG[c.country])
      .map((c) => ({
        country: c.country,
        lat: COUNTRY_LATLNG[c.country].lat,
        lng: COUNTRY_LATLNG[c.country].lng,
        count: c.count,
      }));
  })();

  const referrers: ReferrerData[] = topBy(
    views.map((v) => (v.referrer as string | null) ?? "Direct")
  ).map((d) => ({ referrer: d.key, count: d.count, pct: d.pct }));

  const topLinks: ClickData[] = [...userLinks]
    .sort((a, b) => (b.clicks ?? 0) - (a.clicks ?? 0))
    .slice(0, 6)
    .map((l) => ({
      id: l.id,
      label: l.title || "Untitled link",
      sub: l.url,
      clicks: l.clicks ?? 0,
    }));

  const topSocials: ClickData[] = [...userSocials]
    .sort((a, b) => (b.clicks ?? 0) - (a.clicks ?? 0))
    .slice(0, 6)
    .map((s) => ({
      id: s.id,
      label: s.platform.charAt(0).toUpperCase() + s.platform.slice(1),
      sub: s.url,
      clicks: s.clicks ?? 0,
    }));

  return (
    <DashboardShell>
      <AnalyticsClient
        isPremium={user?.premium === 1}
        totalViews={totalViews}
        totalClicks={totalClicks}
        totalSocialClicks={totalSocialClicks}
        clickRate={clickRate}
        uniqueVisitors={uniqueVisitors}
        peakDay={peakDay}
        peakValue={peakValue}
        rangeData={rangeData}
        devices={devices}
        countries={countries}
        cities={cities}
        globePoints={globePoints}
        referrers={referrers}
        topLinks={topLinks}
        topSocials={topSocials}
      />
    </DashboardShell>
  );
}
