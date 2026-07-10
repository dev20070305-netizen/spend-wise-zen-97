// Client-side viewer analytics store. Persists in localStorage so counts survive
// refreshes and future backend integration can replace this module without UI changes.

const KEY = "spendwise:analytics:v1";
const VISITOR_KEY = "spendwise:visitor-id";
const SESSION_KEY = "spendwise:session-id";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min inactivity ends session

export type PageVisit = { path: string; ts: number; sessionId: string; visitorId: string; durationMs?: number };
export type FeatureEvent = { feature: string; ts: number };
export type SessionRow = { id: string; visitorId: string; start: number; end: number; pages: number };
export type VisitorRow = { id: string; first: number; last: number; sessions: number; ua: string };

export type AnalyticsData = {
  visits: PageVisit[];
  features: FeatureEvent[];
  sessions: Record<string, SessionRow>;
  visitors: Record<string, VisitorRow>;
  logins: number;
  signups: number;
  clicks: Record<string, number>;
};

const empty = (): AnalyticsData => ({
  visits: [], features: [], sessions: {}, visitors: {}, logins: 0, signups: 0, clicks: {},
});

function safeGet(k: string) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k: string, v: string) { try { localStorage.setItem(k, v); } catch {} }

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function load(): AnalyticsData {
  if (typeof window === "undefined") return empty();
  const raw = safeGet(KEY);
  if (!raw) {
    const seeded = seed();
    safeSet(KEY, JSON.stringify(seeded));
    return seeded;
  }
  try { return { ...empty(), ...JSON.parse(raw) } as AnalyticsData; } catch { return empty(); }
}

export function save(d: AnalyticsData) { safeSet(KEY, JSON.stringify(d)); }

function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = safeGet(VISITOR_KEY);
  if (!id) { id = uid(); safeSet(VISITOR_KEY, id); }
  return id;
}

function getSessionId(): { id: string; isNew: boolean } {
  if (typeof window === "undefined") return { id: "ssr", isNew: false };
  const raw = safeGet(SESSION_KEY);
  const now = Date.now();
  if (raw) {
    try {
      const s = JSON.parse(raw) as { id: string; last: number };
      if (now - s.last < SESSION_TTL_MS) {
        safeSet(SESSION_KEY, JSON.stringify({ id: s.id, last: now }));
        return { id: s.id, isNew: false };
      }
    } catch {}
  }
  const id = uid();
  safeSet(SESSION_KEY, JSON.stringify({ id, last: now }));
  return { id, isNew: true };
}

export function trackPageview(path: string) {
  if (typeof window === "undefined") return;
  const d = load();
  const visitorId = getVisitorId();
  const { id: sessionId, isNew } = getSessionId();
  const now = Date.now();

  // update visitor
  const v = d.visitors[visitorId] ?? { id: visitorId, first: now, last: now, sessions: 0, ua: navigator.userAgent };
  v.last = now;
  if (isNew) v.sessions += 1;
  d.visitors[visitorId] = v;

  // update session
  const s = d.sessions[sessionId] ?? { id: sessionId, visitorId, start: now, end: now, pages: 0 };
  s.end = now;
  s.pages += 1;
  d.sessions[sessionId] = s;

  // record visit
  d.visits.push({ path, ts: now, sessionId, visitorId });
  // cap for storage
  if (d.visits.length > 2000) d.visits = d.visits.slice(-2000);

  save(d);
}

export function trackFeature(feature: string) {
  if (typeof window === "undefined") return;
  const d = load();
  d.features.push({ feature, ts: Date.now() });
  if (d.features.length > 2000) d.features = d.features.slice(-2000);
  save(d);
}

export function trackClick(name: string) {
  if (typeof window === "undefined") return;
  const d = load();
  d.clicks[name] = (d.clicks[name] ?? 0) + 1;
  save(d);
}

export function trackLogin() { const d = load(); d.logins += 1; save(d); }
export function trackSignup() { const d = load(); d.signups += 1; save(d); }

export function resetAnalytics() { if (typeof window !== "undefined") localStorage.removeItem(KEY); }

// ------------ Device / UA parsing ------------
export function parseUA(ua: string): { device: "Desktop" | "Mobile" | "Tablet"; browser: string; os: string } {
  const u = ua || "";
  const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(u) || (/Android/i.test(u) && !/Mobile/i.test(u));
  const isMobile = !isTablet && /Mobi|iPhone|iPod|Android|BlackBerry|Opera Mini|IEMobile/i.test(u);
  const device = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";
  let browser = "Other";
  if (/Edg\//i.test(u)) browser = "Edge";
  else if (/OPR\//i.test(u)) browser = "Opera";
  else if (/Chrome\//i.test(u) && !/Chromium/i.test(u)) browser = "Chrome";
  else if (/Firefox\//i.test(u)) browser = "Firefox";
  else if (/Safari\//i.test(u) && !/Chrome/i.test(u)) browser = "Safari";
  let os = "Other";
  if (/Windows/i.test(u)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(u)) os = "macOS";
  else if (/Android/i.test(u)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(u)) os = "iOS";
  else if (/Linux/i.test(u)) os = "Linux";
  return { device, browser, os };
}

// ------------ Seeding for demo/empty state ------------
function seed(): AnalyticsData {
  const d = empty();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const paths = ["/dashboard", "/income", "/expense", "/transactions", "/budget", "/reports", "/summary", "/settings"];
  const features = ["Income", "Expense", "Budget", "Reports", "Transactions", "Export"];
  const uas = [
    "Mozilla/5.0 (Windows NT 10.0; Win64) Chrome/120.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/17.0",
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) Chrome/120.0 Mobile",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/17.0 Mobile",
    "Mozilla/5.0 (iPad; CPU OS 17_0) Safari/17.0",
    "Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0",
  ];
  const countries = ["India", "United States", "United Kingdom", "Germany", "Australia", "Canada", "Japan", "Singapore"];
  const cities: Record<string, string[]> = {
    India: ["Mumbai", "Bengaluru", "Delhi"],
    "United States": ["New York", "San Francisco", "Austin"],
    "United Kingdom": ["London", "Manchester"],
    Germany: ["Berlin", "Munich"],
    Australia: ["Sydney", "Melbourne"],
    Canada: ["Toronto", "Vancouver"],
    Japan: ["Tokyo", "Osaka"],
    Singapore: ["Singapore"],
  };
  // 40 seeded visitors over last 30 days
  for (let i = 0; i < 40; i++) {
    const id = "seed-v-" + i;
    const first = now - Math.floor(Math.random() * 30) * day;
    const ua = uas[i % uas.length];
    d.visitors[id] = { id, first, last: first, sessions: 0, ua };
    const country = countries[i % countries.length];
    const city = cities[country][i % cities[country].length];
    (d.visitors[id] as any).country = country;
    (d.visitors[id] as any).city = city;
  }
  // sessions & visits
  for (let day_i = 30; day_i >= 0; day_i--) {
    const dayStart = now - day_i * day;
    const sessionsToday = 8 + Math.floor(Math.random() * 14);
    for (let s = 0; s < sessionsToday; s++) {
      const visitor = d.visitors["seed-v-" + Math.floor(Math.random() * 40)];
      const sid = "seed-s-" + day_i + "-" + s;
      const start = dayStart + Math.floor(Math.random() * day);
      const pageCount = 1 + Math.floor(Math.random() * 6);
      const end = start + pageCount * (30_000 + Math.floor(Math.random() * 120_000));
      d.sessions[sid] = { id: sid, visitorId: visitor.id, start, end, pages: pageCount };
      visitor.sessions += 1;
      visitor.last = Math.max(visitor.last, end);
      for (let p = 0; p < pageCount; p++) {
        const path = paths[Math.floor(Math.random() * paths.length)];
        d.visits.push({ path, ts: start + p * 45_000, sessionId: sid, visitorId: visitor.id });
      }
      // features
      const fCount = Math.floor(Math.random() * 3);
      for (let f = 0; f < fCount; f++) {
        d.features.push({ feature: features[Math.floor(Math.random() * features.length)], ts: start + Math.random() * 60_000 });
      }
    }
  }
  d.logins = 120 + Math.floor(Math.random() * 40);
  d.signups = 40 + Math.floor(Math.random() * 20);
  return d;
}

// ------------ Summary computations ------------
export type RangePreset = "today" | "7d" | "30d" | "90d" | "custom";

export function rangeBounds(preset: RangePreset, custom?: { from: number; to: number }): { from: number; to: number } {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (preset === "custom" && custom) return custom;
  if (preset === "today") {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    return { from: d.getTime(), to: now };
  }
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  return { from: now - days * day, to: now };
}

export function computeSummary(d: AnalyticsData, from: number, to: number) {
  const visits = d.visits.filter((v) => v.ts >= from && v.ts <= to);
  const sessions = Object.values(d.sessions).filter((s) => s.end >= from && s.start <= to);
  const visitorIds = new Set(visits.map((v) => v.visitorId));
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const daily = visits.filter((v) => v.ts >= now - day).length;
  const weekly = visits.filter((v) => v.ts >= now - 7 * day).length;
  const monthly = visits.filter((v) => v.ts >= now - 30 * day).length;

  const newUsers = Object.values(d.visitors).filter((v) => v.first >= from && v.first <= to).length;
  const returning = [...visitorIds].filter((id) => {
    const v = d.visitors[id];
    return v && v.first < from;
  }).length;

  const totalSessionMs = sessions.reduce((s, x) => s + (x.end - x.start), 0);
  const avgSessionSec = sessions.length ? Math.round(totalSessionMs / sessions.length / 1000) : 0;
  const bounced = sessions.filter((s) => s.pages <= 1).length;
  const bounceRate = sessions.length ? (bounced / sessions.length) * 100 : 0;

  const pageCounts: Record<string, number> = {};
  visits.forEach((v) => { pageCounts[v.path] = (pageCounts[v.path] ?? 0) + 1; });
  const topPages = Object.entries(pageCounts).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count);

  const featureCounts: Record<string, number> = {};
  d.features.filter((f) => f.ts >= from && f.ts <= to).forEach((f) => { featureCounts[f.feature] = (featureCounts[f.feature] ?? 0) + 1; });
  const topFeatures = Object.entries(featureCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const devices: Record<string, number> = {};
  const browsers: Record<string, number> = {};
  const oses: Record<string, number> = {};
  const countries: Record<string, number> = {};
  const cities: Record<string, number> = {};
  for (const id of visitorIds) {
    const v = d.visitors[id]; if (!v) continue;
    const p = parseUA(v.ua);
    devices[p.device] = (devices[p.device] ?? 0) + 1;
    browsers[p.browser] = (browsers[p.browser] ?? 0) + 1;
    oses[p.os] = (oses[p.os] ?? 0) + 1;
    const c = (v as any).country as string | undefined;
    const city = (v as any).city as string | undefined;
    if (c) countries[c] = (countries[c] ?? 0) + 1;
    if (city) cities[city] = (cities[city] ?? 0) + 1;
  }

  // daily trend series
  const days = Math.max(1, Math.ceil((to - from) / day));
  const dayStart = new Date(from); dayStart.setHours(0, 0, 0, 0);
  const trend: { label: string; visits: number; visitors: number; sessions: number }[] = [];
  for (let i = 0; i < days; i++) {
    const s = dayStart.getTime() + i * day;
    const e = s + day;
    const dv = visits.filter((v) => v.ts >= s && v.ts < e);
    trend.push({
      label: new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      visits: dv.length,
      visitors: new Set(dv.map((v) => v.visitorId)).size,
      sessions: sessions.filter((x) => x.start >= s && x.start < e).length,
    });
  }

  // peak hour
  const hours = Array(24).fill(0) as number[];
  visits.forEach((v) => { hours[new Date(v.ts).getHours()] += 1; });
  const peakHour = hours.indexOf(Math.max(...hours));

  return {
    totalVisits: visits.length,
    activeUsers: visitorIds.size,
    daily, weekly, monthly,
    newUsers, returning,
    totalSessions: sessions.length,
    avgSessionSec,
    bounceRate,
    topPages, topFeatures,
    devices, browsers, oses, countries, cities,
    trend, peakHour,
    logins: d.logins,
    signups: d.signups,
  };
}

export type Summary = ReturnType<typeof computeSummary>;
