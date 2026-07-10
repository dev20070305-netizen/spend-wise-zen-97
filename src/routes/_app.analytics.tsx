import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LineChart, Line, PieChart as RPieChart, Pie, Cell,
} from "recharts";
import {
  RefreshCw, Download, FileText, Users, Eye, Activity, Clock, TrendingUp, MousePointerClick,
  Smartphone, Monitor, Tablet, Globe, MapPin, Search, ArrowLeft,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { load, computeSummary, rangeBounds, type RangePreset, type Summary } from "@/lib/analytics-store";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [
      { title: "Viewer Analytics — Spend Wise" },
      { name: "description", content: "Track visitors, sessions, features, devices and more." },
    ],
  }),
  component: AnalyticsPage,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "oklch(0.7 0.15 320)", "oklch(0.65 0.16 100)", "oklch(0.6 0.18 250)"];

function AnalyticsPage() {
  const [preset, setPreset] = useState<RangePreset>("30d");
  const [customFrom, setCustomFrom] = useState<string>(format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd"));
  const [customTo, setCustomTo] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, [nonce, preset, customFrom, customTo]);

  const summary: Summary | null = useMemo(() => {
    if (typeof window === "undefined") return null;
    const bounds =
      preset === "custom"
        ? { from: new Date(customFrom).getTime(), to: new Date(customTo).getTime() + 86400000 - 1 }
        : rangeBounds(preset);
    const data = load();
    return computeSummary(data, bounds.from, bounds.to);
  }, [preset, customFrom, customTo, nonce]);

  const hasData = !!summary && summary.totalVisits > 0;

  const refresh = () => { setNonce((n) => n + 1); toast.success("Analytics refreshed"); };

  const exportCSV = () => {
    if (!summary) return;
    const rows: string[] = [];
    rows.push("Metric,Value");
    rows.push(`Total Visits,${summary.totalVisits}`);
    rows.push(`Active Users,${summary.activeUsers}`);
    rows.push(`Daily Visitors,${summary.daily}`);
    rows.push(`Weekly Visitors,${summary.weekly}`);
    rows.push(`Monthly Visitors,${summary.monthly}`);
    rows.push(`New Users,${summary.newUsers}`);
    rows.push(`Returning Users,${summary.returning}`);
    rows.push(`Total Sessions,${summary.totalSessions}`);
    rows.push(`Avg Session (s),${summary.avgSessionSec}`);
    rows.push(`Bounce Rate (%),${summary.bounceRate.toFixed(1)}`);
    rows.push(`Peak Hour,${summary.peakHour}:00`);
    rows.push("");
    rows.push("Top Pages,Views");
    summary.topPages.forEach((p) => rows.push(`${p.path},${p.count}`));
    rows.push("");
    rows.push("Top Features,Uses");
    summary.topFeatures.forEach((f) => rows.push(`${f.name},${f.count}`));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const exportPDF = () => { window.print(); };

  const filteredPages = summary?.topPages.filter((p) => p.path.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/dashboard" className="hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
          </div>
          <h1 className="font-display text-3xl font-bold">Viewer Analytics</h1>
          <p className="text-muted-foreground mt-1">Understand who's using Spend Wise and how.</p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Select value={preset} onValueChange={(v) => setPreset(v as RangePreset)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          {preset === "custom" && (
            <>
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-40" />
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-40" />
            </>
          )}
          <Button variant="outline" onClick={refresh}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />CSV</Button>
          <Button className="gradient-primary text-white shadow-glow" onClick={exportPDF}>
            <FileText className="mr-2 h-4 w-4" />PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <SkeletonState />
      ) : !hasData ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Total Visits" value={summary!.totalVisits} icon={Eye} gradient="gradient-balance" />
            <Stat label="Active Users" value={summary!.activeUsers} icon={Users} gradient="gradient-income" />
            <Stat label="Total Sessions" value={summary!.totalSessions} icon={Activity} gradient="gradient-savings" />
            <Stat label="Avg Session" value={`${Math.floor(summary!.avgSessionSec / 60)}m ${summary!.avgSessionSec % 60}s`} icon={Clock} gradient="gradient-budget" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat label="Daily Visitors" value={summary!.daily} />
            <MiniStat label="Weekly Visitors" value={summary!.weekly} />
            <MiniStat label="Monthly Visitors" value={summary!.monthly} />
            <MiniStat label="Bounce Rate" value={`${summary!.bounceRate.toFixed(1)}%`} />
            <MiniStat label="New Users" value={summary!.newUsers} />
            <MiniStat label="Returning Users" value={summary!.returning} />
            <MiniStat label="Logins" value={summary!.logins} />
            <MiniStat label="Signups" value={summary!.signups} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold">Visitor Trend</h3>
                  <p className="text-xs text-muted-foreground">Visits, unique visitors & sessions</p>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={summary!.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Legend />
                  <Line type="monotone" dataKey="visits" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="visitors" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="sessions" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 shadow-card">
              <h3 className="font-display font-semibold">New vs Returning</h3>
              <p className="text-xs text-muted-foreground mb-2">User composition</p>
              <ResponsiveContainer width="100%" height={260}>
                <RPieChart>
                  <Pie
                    data={[
                      { name: "New", value: summary!.newUsers },
                      { name: "Returning", value: summary!.returning },
                    ]}
                    dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}
                  >
                    <Cell fill="var(--chart-1)" />
                    <Cell fill="var(--chart-2)" />
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Legend />
                </RPieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-6 shadow-card">
              <h3 className="font-display font-semibold">Most Used Features</h3>
              <p className="text-xs text-muted-foreground mb-2">Feature interactions</p>
              {summary!.topFeatures.length === 0 ? (
                <div className="h-[240px] grid place-items-center text-sm text-muted-foreground">No feature events yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={summary!.topFeatures}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                    <Bar dataKey="count" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-6 shadow-card">
              <h3 className="font-display font-semibold">Device Breakdown</h3>
              <p className="text-xs text-muted-foreground mb-2">Desktop, Mobile, Tablet</p>
              <ResponsiveContainer width="100%" height={240}>
                <RPieChart>
                  <Pie
                    data={Object.entries(summary!.devices).map(([name, value]) => ({ name, value }))}
                    dataKey="value" nameKey="name" outerRadius={95}
                  >
                    {Object.keys(summary!.devices).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Legend />
                </RPieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                <DeviceTile icon={Monitor} label="Desktop" value={summary!.devices.Desktop ?? 0} />
                <DeviceTile icon={Smartphone} label="Mobile" value={summary!.devices.Mobile ?? 0} />
                <DeviceTile icon={Tablet} label="Tablet" value={summary!.devices.Tablet ?? 0} />
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <BreakdownCard title="Browsers" data={summary!.browsers} />
            <BreakdownCard title="Operating Systems" data={summary!.oses} />
            <Card className="p-6 shadow-card">
              <h3 className="font-display font-semibold flex items-center gap-2"><Clock className="h-4 w-4" />Peak Usage</h3>
              <p className="text-xs text-muted-foreground mb-4">Busiest hour in range</p>
              <div className="font-display text-5xl font-bold">{summary!.peakHour.toString().padStart(2, "0")}:00</div>
              <p className="text-sm text-muted-foreground mt-2">Most visitors are active around this time.</p>
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Clicks tracked</span><span className="font-medium"><MousePointerClick className="inline h-3.5 w-3.5 mr-1" />{summary!.topFeatures.reduce((s, f) => s + f.count, 0)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Last 30 days visits</span><span className="font-medium">{summary!.monthly}</span></div>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownCard title="Countries" icon={Globe} data={summary!.countries} />
            <BreakdownCard title="Cities" icon={MapPin} data={summary!.cities} />
          </div>

          <Card className="p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display font-semibold">Most Visited Pages</h3>
                <p className="text-xs text-muted-foreground">Search & filter across the range</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter pages…" className="pl-9" />
              </div>
            </div>
            <div className="divide-y">
              {filteredPages.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">No pages match your filter.</div>
              )}
              {filteredPages.map((p) => {
                const pct = summary!.totalVisits ? (p.count / summary!.totalVisits) * 100 : 0;
                return (
                  <div key={p.path} className="py-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{p.path}</div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="font-display font-semibold shrink-0">{p.count}</div>
                    <div className="text-xs text-muted-foreground w-12 text-right">{pct.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, gradient }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; gradient: string }) {
  return (
    <Card className={`relative overflow-hidden p-5 text-white border-0 shadow-card ${gradient}`}>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="flex items-center justify-between relative">
        <span className="text-xs uppercase tracking-wider text-white/70">{label}</span>
        <Icon className="h-5 w-5 text-white/80" />
      </div>
      <div className="mt-3 font-display text-2xl sm:text-3xl font-bold relative">{value}</div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4 shadow-card">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold mt-1">{value}</div>
    </Card>
  );
}

function DeviceTile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="rounded-lg border p-2">
      <Icon className="h-4 w-4 mx-auto text-muted-foreground" />
      <div className="mt-1 font-semibold">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}

function BreakdownCard({ title, data, icon: Icon }: { title: string; data: Record<string, number>; icon?: React.ComponentType<{ className?: string }> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  return (
    <Card className="p-6 shadow-card">
      <h3 className="font-display font-semibold flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {title}
      </h3>
      <div className="mt-4 space-y-3">
        {entries.length === 0 && <div className="text-sm text-muted-foreground">No data</div>}
        {entries.map(([name, value], i) => {
          const pct = (value / total) * 100;
          return (
            <div key={name}>
              <div className="flex justify-between text-sm mb-1">
                <span>{name}</span>
                <span className="text-muted-foreground">{value} · {pct.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SkeletonState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="lg:col-span-2 h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-12 text-center shadow-card">
      <div className="mx-auto h-14 w-14 rounded-full grid place-items-center gradient-primary text-white mb-4">
        <Activity className="h-6 w-6" />
      </div>
      <h3 className="font-display text-xl font-bold">No analytics yet</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        Start using Spend Wise — visit pages, add income/expenses, set budgets — and this dashboard will populate in real time.
      </p>
      <Button asChild className="mt-6 gradient-primary text-white shadow-glow">
        <Link to="/dashboard">Go to Dashboard</Link>
      </Button>
    </Card>
  );
}
