import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type TxType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  description: string;
  notes?: string;
  date: string;
};

export type Reminder = {
  id: string;
  title: string;
  date: string;
  done: boolean;
};

export type Profile = {
  name: string;
  email: string;
  avatar?: string;
};

export type Theme = "light" | "dark";

export type CurrencyCode =
  | "USD" | "EUR" | "GBP" | "INR" | "JPY" | "AUD" | "CAD" | "SGD"
  | "AED" | "CNY" | "MYR" | "SAR" | "CHF" | "NZD" | "ZAR" | "HKD"
  | "KRW" | "BRL" | "MXN" | "SEK" | "NOK" | "DKK" | "THB" | "IDR"
  | "PHP" | "TRY" | "PLN" | "RUB";

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
};

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", locale: "ar-AE" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", locale: "zh-CN" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", locale: "ms-MY" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", locale: "ar-SA" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", locale: "de-CH" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", locale: "en-NZ" },
  { code: "ZAR", symbol: "R", name: "South African Rand", locale: "en-ZA" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", locale: "en-HK" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", locale: "ko-KR" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", locale: "pt-BR" },
  { code: "MXN", symbol: "Mex$", name: "Mexican Peso", locale: "es-MX" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", locale: "sv-SE" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", locale: "nb-NO" },
  { code: "DKK", symbol: "kr", name: "Danish Krone", locale: "da-DK" },
  { code: "THB", symbol: "฿", name: "Thai Baht", locale: "th-TH" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", locale: "id-ID" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", locale: "en-PH" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", locale: "tr-TR" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty", locale: "pl-PL" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble", locale: "ru-RU" },
];

export function getCurrencyInfo(code: CurrencyCode): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

type State = {
  transactions: Transaction[];
  budget: number;
  reminders: Reminder[];
  profile: Profile;
  theme: Theme;
  currency: CurrencyCode;
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
  setCurrency: (c: CurrencyCode) => void;
  currencyInfo: CurrencyInfo;
};

const FinanceContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "spendwise:state:v1";

const DEFAULT_STATE: State = {
  transactions: [],
  budget: 2000,
  reminders: [],
  profile: { name: "Alex Morgan", email: "alex@spendwise.app" },
  theme: "light",
  currency: "USD",
};

// Module-level active currency, updated by the provider. Kept so the
// existing `formatCurrency(n)` call sites work without threading context.
let ACTIVE_CURRENCY: CurrencyCode = "USD";

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
    ACTIVE_CURRENCY = s.currency;
    setState(s);
    setHydrated(true);
    if (s.theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    ACTIVE_CURRENCY = state.currency;
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
      currencyInfo: getCurrencyInfo(state.currency),
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
      setCurrency: (c) => setState((s) => ({ ...s, currency: c })),
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
  "Food", "Transport", "Shopping", "Bills", "Entertainment",
  "Healthcare", "Education", "Travel", "EMI", "Others",
];

export const INCOME_CATEGORIES = [
  "Salary", "Freelance", "Business", "Investments", "Gifts", "Refund", "Other",
];

export function formatCurrency(n: number, code?: CurrencyCode) {
  const info = getCurrencyInfo(code ?? ACTIVE_CURRENCY);
  try {
    return new Intl.NumberFormat(info.locale, {
      style: "currency",
      currency: info.code,
      maximumFractionDigits: info.code === "JPY" || info.code === "KRW" || info.code === "IDR" ? 0 : 2,
    }).format(n);
  } catch {
    return `${info.symbol}${n.toFixed(2)}`;
  }
}
