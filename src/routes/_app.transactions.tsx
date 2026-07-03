import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Search, Pencil, Trash2, Filter, ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatCurrency, useFinance, type Transaction } from "@/lib/finance-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Spend Wise" }] }),
  component: TransactionsPage,
});

const PAGE_SIZE = 10;

function TransactionsPage() {
  const { transactions, updateTransaction, deleteTransaction } = useFinance();
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [category, setCategory] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<Transaction | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions
      .filter((t) => (type === "all" ? true : t.type === type))
      .filter((t) => (category === "all" ? true : t.category === category))
      .filter((t) => {
        const d = new Date(t.date);
        if (dateFilter === "today") return d >= startOfDay;
        if (dateFilter === "week") return d >= startOfWeek;
        if (dateFilter === "month") return d >= startOfMonth;
        return true;
      })
      .filter((t) => {
        if (!q.trim()) return true;
        const s = q.toLowerCase();
        return [t.category, t.description, t.notes, String(t.amount), format(new Date(t.date), "MMM d yyyy")]
          .join(" ").toLowerCase().includes(s);
      })
      .sort((a, b) => {
        const da = new Date(a.date).getTime(); const db = new Date(b.date).getTime();
        return sortDesc ? db - da : da - db;
      });
  }, [transactions, q, type, category, dateFilter, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allCategories = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground mt-1">All your income and expenses in one place.</p>
      </div>

      <Card className="p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search category, merchant, notes…" className="pl-9" />
          </div>
          <Select value={type} onValueChange={(v: "all" | "income" | "expense") => { setType(v); setPage(1); }}>
            <SelectTrigger className="min-w-[130px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="min-w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={(v: "all" | "today" | "week" | "month") => { setDateFilter(v); setPage(1); }}>
            <SelectTrigger className="min-w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setSortDesc((s) => !s)}>
            <ArrowUpDown className="h-4 w-4 mr-1" /> {sortDesc ? "Newest" : "Oldest"}
          </Button>
        </div>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap">{format(new Date(tx.date), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      tx.type === "income" ? "bg-income/10 text-income border-income/30" : "bg-expense/10 text-expense border-expense/30"
                    )}>
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{tx.category}</TableCell>
                  <TableCell className="max-w-[240px] truncate">{tx.description}</TableCell>
                  <TableCell className={cn("text-right font-semibold whitespace-nowrap", tx.type === "income" ? "text-income" : "text-expense")}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell><Badge variant="secondary">Completed</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEdit(tx)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(tx.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No transactions match your filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">{filtered.length} transactions</div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit transaction</DialogTitle></DialogHeader>
          {edit && <EditForm tx={edit} onSave={(patch) => { updateTransaction(edit.id, patch); toast.success("Updated"); setEdit(null); }} onCancel={() => setEdit(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete this transaction?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (confirmDelete) { deleteTransaction(confirmDelete); toast.success("Deleted"); }
              setConfirmDelete(null);
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditForm({ tx, onSave, onCancel }: { tx: Transaction; onSave: (p: Partial<Transaction>) => void; onCancel: () => void }) {
  const [amount, setAmount] = useState(String(tx.amount));
  const [category, setCategory] = useState(tx.category);
  const [description, setDescription] = useState(tx.description);
  const [date, setDate] = useState(format(new Date(tx.date), "yyyy-MM-dd"));
  const [notes, setNotes] = useState(tx.notes ?? "");
  const cats = tx.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = parseFloat(amount);
        if (!n || n <= 0) return;
        onSave({ amount: n, category, description, notes, date: new Date(date).toISOString() });
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Amount</Label><Input value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      </div>
      <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </form>
  );
}
