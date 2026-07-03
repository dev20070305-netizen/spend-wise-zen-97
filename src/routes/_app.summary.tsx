import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, PiggyBank, Award, Hash, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, useFinance, useTotals } from "@/lib/finance-store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_app/summary")({
  head: () => ({ meta: [{ title: "Monthly Summary — Spend Wise" }] }),
  component: SummaryPage,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "oklch(0.7 0.15 320)", "oklch(0.65 0.16 100)", "oklch(0.6 0.18 250)", "oklch(0.65 0.2 40)", "oklch(0.55 0.12 180)"];

function SummaryPage() {
  const { transactions, budget } = useFinance();
  const t = useTotals();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTxs = transactions.filter((tx) => new Date(tx.date) >= monthStart);

  const catData = Object.entries(t.byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const highest = catData[0];

  const dailyData = useMemo(() => {
    const days = now.getDate();
    const arr: { day: string; income: number; expense: number }[] = [];
    for (let i = 1; i <= days; i++) {
      arr.push({ day: String(i), income: 0, expense: 0 });
    }
    for (const tx of monthTxs) {
      const d = new Date(tx.date).getDate();
      if (tx.type === "income") arr[d - 1].income += tx.amount;
      else arr[d - 1].expense += tx.amount;
    }
    return arr;
  }, [monthTxs, now]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{format(now, "MMMM yyyy")} Summary</h1>
        <p className="text-muted-foreground mt-1">A snapshot of this month's financial activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat icon={TrendingUp} label="Income" value={formatCurrency(t.monthIncome)} tone="income" />
        <Stat icon={TrendingDown} label="Expenses" value={formatCurrency(t.monthExpenses)} tone="expense" />
        <Stat icon={PiggyBank} label="Savings" value={formatCurrency(t.savings)} tone={t.savings >= 0 ? "income" : "expense"} />
        <Stat icon={Award} label="Top category" value={highest?.name ?? "—"} sub={highest ? formatCurrency(highest.value) : ""} />
        <Stat icon={Hash} label="Transactions" value={String(monthTxs.length)} />
        <Stat icon={Target} label="Budget left" value={formatCurrency(t.remainingBudget)} sub={budget > 0 ? `of ${formatCurrency(budget)}` : ""} />
      </div>

      {budget > 0 && (
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold">Budget progress</h3>
            <span className="text-sm text-muted-foreground">{t.budgetUsedPct.toFixed(0)}% used</span>
          </div>
          <Progress value={t.budgetUsedPct} />
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">Daily activity</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="income" stackId="a" fill="var(--income)" />
              <Bar dataKey="expense" stackId="a" fill="var(--expense)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">Spending mix</h3>
          {catData.length === 0 ? (
            <div className="h-[280px] grid place-items-center text-sm text-muted-foreground">No expenses yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" outerRadius={100}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; tone?: "income" | "expense" }) {
  return (
    <Card className="p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className={`h-4 w-4 ${tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-muted-foreground"}`} />
      </div>
      <div className={`mt-2 font-display text-xl font-bold ${tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : ""}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </Card>
  );
}
