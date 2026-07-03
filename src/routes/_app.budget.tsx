import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wallet, AlertTriangle, TriangleAlert, Save, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, useFinance, useTotals } from "@/lib/finance-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/budget")({
  head: () => ({ meta: [{ title: "Budget — Spend Wise" }] }),
  component: BudgetPage,
});

function BudgetPage() {
  const { budget, setBudget, resetBudget } = useFinance();
  const t = useTotals();
  const [value, setValue] = useState(String(budget || ""));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(value);
    if (isNaN(n) || n < 0) { toast.error("Enter a valid amount"); return; }
    setBudget(n);
    toast.success("Budget updated");
  };

  const warn = budget > 0 && t.budgetUsedPct >= 80 && t.budgetUsedPct < 100;
  const over = budget > 0 && t.budgetUsedPct >= 100;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Monthly Budget</h1>
        <p className="text-muted-foreground mt-1">Set a budget and track how you're doing this month.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-2xl gradient-budget grid place-items-center text-white"><Wallet className="h-5 w-5" /></div>
            <div>
              <h3 className="font-display font-semibold">Set your budget</h3>
              <p className="text-xs text-muted-foreground">Applies to the current calendar month.</p>
            </div>
          </div>
          <form onSubmit={save} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="sr-only">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" className="pl-7 h-12 text-lg font-semibold" />
              </div>
            </div>
            <Button type="submit" className="h-12 gradient-primary text-white shadow-glow"><Save className="mr-2 h-4 w-4" />Save</Button>
            <Button type="button" variant="outline" className="h-12" onClick={() => { resetBudget(); setValue(""); toast.success("Budget reset"); }}>
              <RotateCcw className="mr-2 h-4 w-4" />Reset
            </Button>
          </form>
        </Card>

        <Card className="p-6 shadow-card gradient-budget text-white border-0 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 h-32 w-32 bg-white/10 blur-2xl rounded-full" />
          <div className="text-xs uppercase tracking-wider text-white/70">Remaining</div>
          <div className="mt-2 font-display text-3xl font-bold">{formatCurrency(t.remainingBudget)}</div>
          <div className="text-sm text-white/80 mt-1">of {formatCurrency(budget)}</div>
        </Card>
      </div>

      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold">This month's usage</h3>
          <span className="text-sm font-medium">{formatCurrency(t.monthExpenses)} / {formatCurrency(budget)}</span>
        </div>
        <Progress
          value={t.budgetUsedPct}
          className={cn(
            "h-3",
            over && "[&>div]:bg-destructive",
            warn && "[&>div]:bg-warning"
          )}
        />
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t.budgetUsedPct.toFixed(1)}% used</span>
          <span className="text-muted-foreground">{Math.max(0, 100 - t.budgetUsedPct).toFixed(1)}% remaining</span>
        </div>
        {warn && (
          <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4 flex gap-3">
            <TriangleAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Approaching your limit</div>
              <div className="text-sm text-muted-foreground">You've used over 80% of your budget. Consider slowing down non-essential spending.</div>
            </div>
          </div>
        )}
        {over && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-destructive">Budget exceeded</div>
              <div className="text-sm text-muted-foreground">You've spent more than your monthly budget. Review your recent expenses.</div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 shadow-card">
        <h3 className="font-display font-semibold mb-4">By category</h3>
        <div className="space-y-3">
          {Object.entries(t.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
            const pct = budget > 0 ? (amt / budget) * 100 : 0;
            return (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{cat}</span>
                  <span className="text-muted-foreground">{formatCurrency(amt)} · {pct.toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(pct, 100)} className="h-2" />
              </div>
            );
          })}
          {Object.keys(t.byCategory).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No expenses tracked this month.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
