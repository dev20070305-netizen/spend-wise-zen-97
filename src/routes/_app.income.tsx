import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { PlusCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INCOME_CATEGORIES, useFinance } from "@/lib/finance-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/income")({
  head: () => ({ meta: [{ title: "Add Income — Spend Wise" }] }),
  component: AddIncomePage,
});

function AddIncomePage() {
  const { addTransaction } = useFinance();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("Salary");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) { toast.error("Enter a valid amount"); return; }
    addTransaction({
      type: "income",
      amount: n,
      category,
      description: source || category,
      notes,
      date: new Date(date).toISOString(),
    });
    toast.success("Income added");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="max-w-2xl">
      <Card className="p-6 sm:p-8 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl gradient-income grid place-items-center text-white">
            <PlusCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Add Income</h1>
            <p className="text-sm text-muted-foreground">Record money coming in.</p>
          </div>
        </div>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="pl-7 h-12 text-lg font-semibold" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Employer, Client name" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INCOME_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional details" />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" className="flex-1 h-11 gradient-income text-white shadow-glow">Add Income</Button>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })} className="h-11">Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
