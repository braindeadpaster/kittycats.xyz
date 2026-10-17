export interface VisitorInfo {
  ip: string;
  device: string;
  country: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  referrer: string;
  userAgent: string;
}

/** Cooldown between two counted views from the same IP on the same profile. */
export const VIEW_COOLDOWN_MINUTES = 10;

/**
 * Cooldown in seconds. Override with VIEW_COOLDOWN_SECONDS —
 * use 1 while testing locally, 600 (10 min) in production.
 */
export function viewCooldownSeconds(): number {
  const raw = process.env.VIEW_COOLDOWN_SECONDS;
  if (raw !== undefined) {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  return VIEW_COOLDOWN_MINUTES * 60;
}

/** Oldest timestamp that still counts as "within the cooldown window". */
export function viewCooldownCutoff(): Date {
  return new Date(Date.now() - viewCooldownSeconds() * 1000);
}

function parseDevice(ua: string): string {
  const s = ua.toLowerCase();
  if (/bot|crawler|spider|crawl|slurp|mediapartners|baidu|yandex|sogou|exabot|facebot|ia_archiver/i.test(s)) {
    return "Bot";
  }
  if (/tablet|ipad|playbook|silk(?!.*mobile)/i.test(s)) return "Tablet";
  if (/mobi|android|iphone|ipod|blackberry|iemobile|opera mini|mobile/i.test(s)) return "Mobile";
  return "Desktop";
}

function parseReferrer(referer: string | null): string {
  if (!referer) return "Direct";
  try {
    const u = new URL(referer);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("tiktok.com")) return "TikTok";
    if (host.includes("twitter.com") || host.includes("x.com")) return "X / Twitter";
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("discord.com") || host.includes("discord.gg")) return "Discord";
    if (host.includes("facebook.com") || host.includes("fb.com")) return "Facebook";
    if (host.includes("reddit.com")) return "Reddit";
    if (host.includes("twitch.tv")) return "Twitch";
    if (host.includes("snapchat.com")) return "Snapchat";
    if (host.includes("linkedin.com")) return "LinkedIn";
    if (host.includes("google.")) return "Google";
    if (host.includes("bing.com")) return "Bing";
    if (host.includes("f9ed.lol") || host.includes("egirls.lol")) return "Direct";
    return host;
  } catch {
    return "Direct";
  }
}

function parseCountry(headers: Headers): string {
  const candidates = [
    headers.get("x-vercel-ip-country"),
    headers.get("cf-ipcountry"),
    headers.get("x-country-code"),
    headers.get("cloudfront-viewer-country"),
  ];
  for (const c of candidates) {
    if (c && c.trim() && c.trim().toUpperCase() !== "XX") return c.trim().toUpperCase();
  }
  return "Unknown";
}

function parseIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  const cf = headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf.slice(0, 64);
  return "unknown";
}

function parseCity(headers: Headers): string | null {
  const raw =
    headers.get("x-vercel-ip-city") ??
    headers.get("x-city") ??
    headers.get("cloudfront-viewer-city");
  if (!raw) return null;
  try {
    const city = decodeURIComponent(raw.replace(/\+/g, " ")).trim();
    return city ? city.slice(0, 120) : null;
  } catch {
    const city = raw.trim();
    return city ? city.slice(0, 120) : null;
  }
}

function parseCoord(value: string | null): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value.trim());
  return Number.isFinite(n) ? n : null;
}

function parseLatLng(headers: Headers): { latitude: number | null; longitude: number | null } {
  const latitude = parseCoord(
    headers.get("x-vercel-ip-latitude") ?? headers.get("cloudfront-viewer-latitude")
  );
  const longitude = parseCoord(
    headers.get("x-vercel-ip-longitude") ?? headers.get("cloudfront-viewer-longitude")
  );
  return { latitude, longitude };
}

export function getVisitorInfo(headers: Headers): VisitorInfo {
  const userAgent = (headers.get("user-agent") ?? "").slice(0, 500);
  const { latitude, longitude } = parseLatLng(headers);
  return {
    ip: parseIp(headers),
    device: parseDevice(userAgent),
    country: parseCountry(headers),
    city: parseCity(headers),
    latitude,
    longitude,
    referrer: parseReferrer(headers.get("referer") ?? headers.get("referrer")),
    userAgent,
  };
}

interface IpGeo {
  country: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

function isPublicIp(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  if (!v || v === "unknown") return false;
  if (v === "localhost" || v === "::1" || v === "::") return false;
  if (v.startsWith("127.") || v.startsWith("10.") || v.startsWith("192.168.")) return false;
  if (v === "::ffff:127.0.0.1") return false;
  const m172 = v.match(/^172\.(\d+)\./);
  if (m172) {
    const second = Number(m172[1]);
    if (second >= 16 && second <= 31) return false;
  }
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return false;
  return true;
}

function numOrNull(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : null;
}

const geoCache = new Map<string, IpGeo | null>();

/** Free IP lookup for hosts without geo headers (non-Vercel, local network). */
async function lookupIpGeo(ip: string): Promise<IpGeo | null> {
  const hit = geoCache.get(ip);
  if (hit !== undefined) return hit;
  let out: IpGeo | null = null;
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const j = (await res.json()) as Record<string, unknown>;
      if (!j?.error && typeof j.country_code === "string" && j.country_code) {
        out = {
          country: String(j.country_code).toUpperCase(),
          city: typeof j.city === "string" && j.city ? j.city.slice(0, 120) : null,
          latitude: numOrNull(j.latitude),
          longitude: numOrNull(j.longitude),
        };
      }
    }
  } catch {
    out = null;
  }
  if (geoCache.size > 2000) geoCache.clear();
  geoCache.set(ip, out);
  return out;
}

/**
 * Manual geo override for local testing, e.g. VIEWER_GEO="US:New York:40.71:-74.0".
 * Format: COUNTRY[:CITY[:LAT:LNG]].
 */
function debugGeoOverride(): IpGeo | null {
  const raw = (process.env.VIEWER_GEO ?? "").trim();
  if (!raw) return null;
  const [country = "", city = "", lat = "", lng = ""] = raw.split(":");
  if (!country) return null;
  return {
    country: country.toUpperCase(),
    city: city || null,
    latitude: lat ? numOrNull(lat) : null,
    longitude: lng ? numOrNull(lng) : null,
  };
}

/**
 * Fill in geo the CDN headers didn't provide.
 * Order: VIEWER_GEO override → Vercel/Cloudflare headers → ipapi.co → Unknown.
 */
export async function enrichVisitorGeo(visitor: VisitorInfo): Promise<VisitorInfo> {
  const override = debugGeoOverride();
  if (override) return { ...visitor, ...override };
  if (visitor.country !== "Unknown" && visitor.city && visitor.latitude != null) return visitor;
  if (!isPublicIp(visitor.ip)) return visitor;
  const geo = await lookupIpGeo(visitor.ip);
  if (!geo) return visitor;
  return {
    ...visitor,
    country: visitor.country !== "Unknown" ? visitor.country : geo.country,
    city: visitor.city ?? geo.city,
    latitude: visitor.latitude ?? geo.latitude,
    longitude: visitor.longitude ?? geo.longitude,
  };
}

export const DEVICE_COLORS: Record<string, string> = {
  Desktop: "#b35fce",
  Mobile: "#5661f6",
  Tablet: "#22d3ee",
  Bot: "#525252",
};

export const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  ES: "Spain",
  BR: "Brazil",
  TR: "Turkey",
  RU: "Russia",
  SA: "Saudi Arabia",
  CA: "Canada",
  AU: "Australia",
  NL: "Netherlands",
  IT: "Italy",
  PL: "Poland",
  SE: "Sweden",
  NO: "Norway",
  IN: "India",
  JP: "Japan",
  KR: "South Korea",
  MX: "Mexico",
  PH: "Philippines",
  ID: "Indonesia",
  TH: "Thailand",
  VN: "Vietnam",
  MY: "Malaysia",
  SG: "Singapore",
  AE: "United Arab Emirates",
  QA: "Qatar",
  EG: "Egypt",
  ZA: "South Africa",
  NG: "Nigeria",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  PE: "Peru",
  VE: "Venezuela",
  UA: "Ukraine",
  RO: "Romania",
  GR: "Greece",
  PT: "Portugal",
  BE: "Belgium",
  AT: "Austria",
  CH: "Switzerland",
  DK: "Denmark",
  FI: "Finland",
  IE: "Ireland",
  NZ: "New Zealand",
  IL: "Israel",
  PK: "Pakistan",
  BD: "Bangladesh",
  TW: "Taiwan",
  HK: "Hong Kong",
  CN: "China",
};

/** Approximate country centroids for the analytics globe markers. */
export const COUNTRY_LATLNG: Record<string, { lat: number; lng: number }> = {
  US: { lat: 39.8, lng: -98.5 },
  GB: { lat: 54, lng: -2 },
  DE: { lat: 51.1, lng: 10.4 },
  FR: { lat: 46.6, lng: 2.4 },
  ES: { lat: 40.4, lng: -3.7 },
  BR: { lat: -14.2, lng: -51.9 },
  TR: { lat: 38.9, lng: 35.2 },
  RU: { lat: 61.5, lng: 90 },
  SA: { lat: 23.9, lng: 45.1 },
  CA: { lat: 56.1, lng: -106.3 },
  AU: { lat: -25.3, lng: 133.8 },
  NL: { lat: 52.1, lng: 5.3 },
  IT: { lat: 41.9, lng: 12.6 },
  PL: { lat: 51.9, lng: 19.1 },
  SE: { lat: 60.1, lng: 18.6 },
  NO: { lat: 60.5, lng: 8.5 },
  IN: { lat: 21, lng: 78 },
  JP: { lat: 36.2, lng: 138.3 },
  KR: { lat: 35.9, lng: 127.8 },
  MX: { lat: 23.6, lng: -102.5 },
  PH: { lat: 12.9, lng: 121.8 },
  ID: { lat: -0.8, lng: 113.9 },
  TH: { lat: 15.9, lng: 100.8 },
  VN: { lat: 14.1, lng: 108.3 },
  MY: { lat: 4.2, lng: 101.9 },
  SG: { lat: 1.35, lng: 103.8 },
  AE: { lat: 24.2, lng: 54 },
  QA: { lat: 25.3, lng: 51.2 },
  EG: { lat: 26.8, lng: 30.8 },
  ZA: { lat: -30.6, lng: 22.9 },
  NG: { lat: 9.1, lng: 8.7 },
  AR: { lat: -38.4, lng: -63.6 },
  CL: { lat: -31.8, lng: -71 },
  CO: { lat: 4.6, lng: -74.1 },
  PE: { lat: -9.2, lng: -75 },
  VE: { lat: 6.4, lng: -66.6 },
  UA: { lat: 48.4, lng: 31.2 },
  RO: { lat: 45.9, lng: 24.9 },
  GR: { lat: 39.1, lng: 22 },
  PT: { lat: 39.4, lng: -8 },
  BE: { lat: 50.5, lng: 4.5 },
  AT: { lat: 47.5, lng: 14.5 },
  CH: { lat: 46.8, lng: 8.2 },
  DK: { lat: 56.3, lng: 9.5 },
  FI: { lat: 61.9, lng: 25.7 },
  IE: { lat: 53.4, lng: -8.1 },
  NZ: { lat: -40.9, lng: 174.9 },
  IL: { lat: 31, lng: 34.8 },
  PK: { lat: 30.4, lng: 69.3 },
  BD: { lat: 23.7, lng: 90.4 },
  TW: { lat: 23.7, lng: 121 },
  HK: { lat: 22.3, lng: 114.2 },
  CN: { lat: 35.9, lng: 104.2 },
};
