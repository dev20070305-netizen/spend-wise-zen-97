import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Target, ArrowUpRight, ArrowDownRight, PlusCircle, MinusCircle, LineChart as LineChartIcon,
} from "lucide-react";
import { useFinance, useTotals, formatCurrency } from "@/lib/finance-store";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format, subMonths, startOfMonth } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Spend Wise" },
      { name: "description", content: "Your financial overview at a glance." },
    ],
  }),
  component: DashboardPage,
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "oklch(0.7 0.15 320)", "oklch(0.65 0.16 100)", "oklch(0.6 0.18 250)", "oklch(0.65 0.2 40)", "oklch(0.55 0.12 180)"];

function DashboardPage() {
  const { transactions, budget, profile } = useFinance();
  const t = useTotals();

  const monthlyData = useMemo(() => {
    const arr: { month: string; income: number; expense: number; savings: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = startOfMonth(subMonths(new Date(), i));
      const end = startOfMonth(subMonths(new Date(), i - 1));
      let inc = 0, exp = 0;
      for (const tx of transactions) {
        const d = new Date(tx.date);
        if (d >= start && d < end) {
          if (tx.type === "income") inc += tx.amount;
          else exp += tx.amount;
        }
      }
      arr.push({ month: format(start, "MMM"), income: inc, expense: exp, savings: inc - exp });
    }
    return arr;
  }, [transactions]);

  const categoryData = useMemo(
    () => Object.entries(t.byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    [t.byCategory]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Hi, {profile.name.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your money this month.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/income"><PlusCircle className="mr-2 h-4 w-4" />Add income</Link>
          </Button>
          <Button asChild className="gradient-primary text-white shadow-glow">
            <Link to="/expense"><MinusCircle className="mr-2 h-4 w-4" />Add expense</Link>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Current Balance" value={t.balance} gradient="gradient-balance" icon={Wallet} />
        <StatCard label="Total Income" value={t.totalIncome} gradient="gradient-income" icon={TrendingUp} trend="+8.2%" />
        <StatCard label="Total Expenses" value={t.totalExpenses} gradient="gradient-expense" icon={TrendingDown} trend="-3.1%" />
        <StatCard label="Remaining Budget" value={t.remainingBudget} gradient="gradient-budget" icon={Target} sub={budget > 0 ? `${t.budgetUsedPct.toFixed(0)}% used` : "No budget set"} />
        <StatCard label="Monthly Savings" value={t.savings} gradient="gradient-savings" icon={PiggyBank} />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">Income vs Expenses</h3>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}>
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
          <h3 className="font-display font-semibold">Spending by Category</h3>
          <p className="text-xs text-muted-foreground mb-2">This month</p>
          {categoryData.length === 0 ? (
            <div className="h-[260px] grid place-items-center text-sm text-muted-foreground">No expenses yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <RPieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v: number) => formatCurrency(v)} />
              </RPieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">Savings Trend</h3>
              <p className="text-xs text-muted-foreground">Net savings over time</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Line type="monotone" dataKey="savings" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="font-display font-semibold">Budget Usage</h3>
          <p className="text-xs text-muted-foreground mb-4">This month</p>
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl font-bold">{t.budgetUsedPct.toFixed(0)}%</span>
              <span className="text-sm text-muted-foreground">{formatCurrency(t.monthExpenses)} / {formatCurrency(budget)}</span>
            </div>
            <Progress value={t.budgetUsedPct} className={cn(
              t.budgetUsedPct >= 100 && "[&>div]:bg-destructive",
              t.budgetUsedPct >= 80 && t.budgetUsedPct < 100 && "[&>div]:bg-warning"
            )} />
            {budget > 0 && t.budgetUsedPct >= 100 && (
              <p className="text-sm text-destructive font-medium">⚠️ You've exceeded your monthly budget.</p>
            )}
            {budget > 0 && t.budgetUsedPct >= 80 && t.budgetUsedPct < 100 && (
              <p className="text-sm text-warning font-medium">You're close to your budget limit.</p>
            )}
            <Button asChild variant="outline" className="w-full mt-2">
              <Link to="/budget">Manage budget</Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">Recent transactions</h3>
          <Button variant="ghost" size="sm" asChild><Link to="/transactions">View all</Link></Button>
        </div>
        <div className="divide-y">
          {transactions.slice(0, 6).map((tx) => (
            <div key={tx.id} className="py-3 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-full grid place-items-center shrink-0",
                tx.type === "income" ? "bg-income/15 text-income" : "bg-expense/15 text-expense"
              )}>
                {tx.type === "income" ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{tx.description || tx.category}</div>
                <div className="text-xs text-muted-foreground">{tx.category} · {format(new Date(tx.date), "MMM d, yyyy")}</div>
              </div>
              <div className={cn("font-display font-semibold shrink-0", tx.type === "income" ? "text-income" : "text-expense")}>
                {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">No transactions yet.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label, value, gradient, icon: Icon, trend, sub,
}: {
  label: string; value: number; gradient: string; icon: React.ComponentType<{ className?: string }>; trend?: string; sub?: string;
}) {
  const anim = useAnimatedNumber(value);
  return (
    <Card className={cn("relative overflow-hidden p-5 text-white border-0 shadow-card", gradient)}>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="flex items-center justify-between relative">
        <span className="text-xs uppercase tracking-wider text-white/70">{label}</span>
        <Icon className="h-5 w-5 text-white/80" />
      </div>
      <div className="mt-3 font-display text-2xl sm:text-3xl font-bold relative">
        {formatCurrency(anim)}
      </div>
      <div className="mt-1 text-xs text-white/70 relative">
        {trend ? <span>{trend} vs last month</span> : sub ? <span>{sub}</span> : <span>&nbsp;</span>}
      </div>
    </Card>
  );
}
