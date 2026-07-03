import { createFileRoute } from "@tanstack/react-router";
import { FileDown, Printer } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { formatCurrency, useFinance, useTotals } from "@/lib/finance-store";

export const Route = createFileRoute("/_app/export")({
  head: () => ({ meta: [{ title: "Export PDF — Spend Wise" }] }),
  component: ExportPage,
});

function ExportPage() {
  const { transactions, profile, budget } = useFinance();
  const t = useTotals();
  const incomes = transactions.filter((x) => x.type === "income");
  const expenses = transactions.filter((x) => x.type === "expense");
  const cats = Object.entries(t.byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 no-print">
        <div>
          <h1 className="font-display text-3xl font-bold">Export report</h1>
          <p className="text-muted-foreground mt-1">Generate a printable PDF summary of your finances.</p>
        </div>
        <Button onClick={() => window.print()} className="gradient-primary text-white shadow-glow">
          <Printer className="mr-2 h-4 w-4" />Print / Save as PDF
        </Button>
      </div>

      <Card className="p-8 shadow-card max-w-4xl mx-auto">
        <div className="flex items-center justify-between border-b pb-6 mb-6">
          <Logo />
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Report generated</div>
            <div className="font-semibold">{format(new Date(), "MMMM d, yyyy")}</div>
          </div>
        </div>

        <section className="mb-6">
          <h2 className="font-display text-xl font-bold mb-3">User</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{profile.name}</span></div>
            <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{profile.email}</span></div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-display text-xl font-bold mb-3">Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Row label="Total balance" value={formatCurrency(t.balance)} />
            <Row label="Total income" value={formatCurrency(t.totalIncome)} />
            <Row label="Total expenses" value={formatCurrency(t.totalExpenses)} />
            <Row label="Monthly savings" value={formatCurrency(t.savings)} />
            <Row label="Month income" value={formatCurrency(t.monthIncome)} />
            <Row label="Month expenses" value={formatCurrency(t.monthExpenses)} />
            <Row label="Budget" value={formatCurrency(budget)} />
            <Row label="Budget used" value={`${t.budgetUsedPct.toFixed(1)}%`} />
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-display text-xl font-bold mb-3">Category-wise expenses</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Category</th><th className="py-2 text-right">Amount</th><th className="py-2 text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {cats.map(([c, v]) => (
                <tr key={c} className="border-b">
                  <td className="py-2">{c}</td>
                  <td className="py-2 text-right">{formatCurrency(v)}</td>
                  <td className="py-2 text-right">{t.monthExpenses ? ((v / t.monthExpenses) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
              {cats.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">No data</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="mb-6">
          <h2 className="font-display text-xl font-bold mb-3">Income</h2>
          <TxTable items={incomes} />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-3">Expenses</h2>
          <TxTable items={expenses} />
        </section>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function TxTable({ items }: { items: { id: string; date: string; category: string; description: string; amount: number }[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="py-2">Date</th><th className="py-2">Category</th><th className="py-2">Description</th><th className="py-2 text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {items.slice(0, 100).map((tx) => (
          <tr key={tx.id} className="border-b">
            <td className="py-2 whitespace-nowrap">{format(new Date(tx.date), "MMM d, yyyy")}</td>
            <td className="py-2">{tx.category}</td>
            <td className="py-2">{tx.description}</td>
            <td className="py-2 text-right font-medium">{formatCurrency(tx.amount)}</td>
          </tr>
        ))}
        {items.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No entries</td></tr>}
      </tbody>
    </table>
  );
}
