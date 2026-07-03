import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { format, subMonths, startOfMonth } from "date-fns";
import { Card } from "@/components/ui/card";
import { formatCurrency, useFinance, useTotals } from "@/lib/finance-store";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area,
} from "recharts";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — Spend Wise" }] }),
  component: ReportsPage,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "oklch(0.7 0.15 320)", "oklch(0.65 0.16 100)", "oklch(0.6 0.18 250)", "oklch(0.65 0.2 40)", "oklch(0.55 0.12 180)"];

function ReportsPage() {
  const { transactions } = useFinance();
  const t = useTotals();

  const monthly = useMemo(() => {
    const arr = [];
    for (let i = 11; i >= 0; i--) {
      const s = startOfMonth(subMonths(new Date(), i));
      const e = startOfMonth(subMonths(new Date(), i - 1));
      let inc = 0, exp = 0;
      for (const tx of transactions) {
        const d = new Date(tx.date);
        if (d >= s && d < e) tx.type === "income" ? (inc += tx.amount) : (exp += tx.amount);
      }
      arr.push({ month: format(s, "MMM"), income: inc, expense: exp, savings: inc - exp });
    }
    return arr;
  }, [transactions]);

  const catData = Object.entries(t.byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const total = catData.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-1">Deep dive into your financial patterns.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">Monthly income vs expense</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="income" fill="var(--income)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="var(--expense)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">Expense trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Line type="monotone" dataKey="expense" stroke="var(--expense)" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">Category-wise spending (this month)</h3>
          {catData.length === 0 ? (
            <div className="h-[280px] grid place-items-center text-muted-foreground text-sm">No expenses yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">Savings trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="sv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="savings" stroke="var(--primary)" strokeWidth={2.5} fill="url(#sv)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6 shadow-card">
        <h3 className="font-display font-semibold mb-4">Category breakdown</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catData.map((c, i) => (
            <div key={c.name} className="rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="font-medium">{c.name}</span>
              </div>
              <div className="font-display text-xl font-bold">{formatCurrency(c.value)}</div>
              <div className="text-xs text-muted-foreground">{total > 0 ? ((c.value / total) * 100).toFixed(1) : 0}% of spending</div>
            </div>
          ))}
          {catData.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
        </div>
      </Card>
    </div>
  );
}
