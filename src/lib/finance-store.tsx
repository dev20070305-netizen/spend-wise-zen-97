import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type TxType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  description: string; // merchant or source
  notes?: string;
  date: string; // ISO
};

export type Reminder = {
  id: string;
  title: string;
  date: string; // ISO
  done: boolean;
};

export type Profile = {
  name: string;
  email: string;
  avatar?: string;
};

export type Theme = "light" | "dark";

type State = {
  transactions: Transaction[];
  budget: number;
  reminders: Reminder[];
  profile: Profile;
  theme: Theme;
};

type Ctx = State & {
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (n: number) => void;
  resetBudget: () => void;
  addReminder: (r: Omit<Reminder, "id" | "done">) => void;
  updateReminder: (id: string, r: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  updateProfile: (p: Partial<Profile>) => void;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
};

const FinanceContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "spendwise:state:v1";

const DEFAULT_STATE: State = {
  transactions: [],
  budget: 2000,
  reminders: [],
  profile: { name: "Alex Morgan", email: "alex@spendwise.app" },
  theme: "light",
};

function seedIfEmpty(state: State): State {
  if (state.transactions.length > 0) return state;
  const now = new Date();
  const iso = (d: number) => {
    const dt = new Date(now);
    dt.setDate(now.getDate() - d);
    return dt.toISOString();
  };
  return {
    ...state,
    transactions: [
      { id: "s1", type: "income", amount: 4200, category: "Salary", description: "Monthly salary", date: iso(20) },
      { id: "s2", type: "income", amount: 350, category: "Freelance", description: "Design gig", date: iso(12) },
      { id: "s3", type: "expense", amount: 68.5, category: "Food", description: "Whole Foods", date: iso(2) },
      { id: "s4", type: "expense", amount: 22, category: "Transport", description: "Uber", date: iso(1) },
      { id: "s5", type: "expense", amount: 129, category: "Bills", description: "Electricity", date: iso(5) },
      { id: "s6", type: "expense", amount: 45, category: "Entertainment", description: "Netflix + Spotify", date: iso(7) },
      { id: "s7", type: "expense", amount: 210, category: "Shopping", description: "Zara", date: iso(9) },
      { id: "s8", type: "expense", amount: 89, category: "Healthcare", description: "Pharmacy", date: iso(15) },
    ],
  };
}

function load(): State {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedIfEmpty(DEFAULT_STATE);
    const parsed = JSON.parse(raw) as State;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = load();
    setState(s);
    setHydrated(true);
    if (s.theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (state.theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [state.theme, hydrated]);

  const value: Ctx = useMemo(
    () => ({
      ...state,
      addTransaction: (t) =>
        setState((s) => ({
          ...s,
          transactions: [{ ...t, id: crypto.randomUUID() }, ...s.transactions],
        })),
      updateTransaction: (id, t) =>
        setState((s) => ({
          ...s,
          transactions: s.transactions.map((x) => (x.id === id ? { ...x, ...t } : x)),
        })),
      deleteTransaction: (id) =>
        setState((s) => ({ ...s, transactions: s.transactions.filter((x) => x.id !== id) })),
      setBudget: (n) => setState((s) => ({ ...s, budget: n })),
      resetBudget: () => setState((s) => ({ ...s, budget: 0 })),
      addReminder: (r) =>
        setState((s) => ({
          ...s,
          reminders: [{ ...r, id: crypto.randomUUID(), done: false }, ...s.reminders],
        })),
      updateReminder: (id, r) =>
        setState((s) => ({
          ...s,
          reminders: s.reminders.map((x) => (x.id === id ? { ...x, ...r } : x)),
        })),
      deleteReminder: (id) =>
        setState((s) => ({ ...s, reminders: s.reminders.filter((x) => x.id !== id) })),
      updateProfile: (p) => setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
      toggleTheme: () =>
        setState((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" })),
      setTheme: (t) => setState((s) => ({ ...s, theme: t })),
    }),
    [state]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}

// Derived selectors
export function useTotals() {
  const { transactions, budget } = useFinance();
  return useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let totalIncome = 0;
    let totalExpenses = 0;
    let monthIncome = 0;
    let monthExpenses = 0;
    const byCategory: Record<string, number> = {};
    for (const t of transactions) {
      const d = new Date(t.date);
      const inMonth = d >= monthStart;
      if (t.type === "income") {
        totalIncome += t.amount;
        if (inMonth) monthIncome += t.amount;
      } else {
        totalExpenses += t.amount;
        if (inMonth) {
          monthExpenses += t.amount;
          byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        }
      }
    }
    const balance = totalIncome - totalExpenses;
    const savings = monthIncome - monthExpenses;
    const remainingBudget = Math.max(budget - monthExpenses, 0);
    const budgetUsedPct = budget > 0 ? Math.min((monthExpenses / budget) * 100, 100) : 0;
    return {
      totalIncome,
      totalExpenses,
      balance,
      monthIncome,
      monthExpenses,
      savings,
      remainingBudget,
      budgetUsedPct,
      byCategory,
    };
  }, [transactions, budget]);
}

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Healthcare",
  "Education",
  "Travel",
  "EMI",
  "Others",
];

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investments",
  "Gifts",
  "Refund",
  "Other",
];

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}
