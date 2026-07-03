import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  MinusCircle,
  ListOrdered,
  CalendarRange,
  Wallet,
  BarChart3,
  FileDown,
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
  UserCog,
  Menu,
  X,
  Trash2,
  Check,
  Plus,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useFinance } from "@/lib/finance-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/income", label: "Add Income", icon: PlusCircle },
  { to: "/expense", label: "Add Expense", icon: MinusCircle },
  { to: "/transactions", label: "Transactions", icon: ListOrdered },
  { to: "/summary", label: "Monthly Summary", icon: CalendarRange },
  { to: "/budget", label: "Budget", icon: Wallet },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/export", label: "Export PDF", icon: FileDown },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar (desktop fixed) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r bg-sidebar text-sidebar-foreground no-print">
        <div className="px-6 py-5 border-b">
          <Logo />
        </div>
        <SidebarNav />
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 no-print">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col border-r animate-slide-in-right">
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <Logo />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div onClick={() => setOpen(false)}>
              <SidebarNav />
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <AppHeader onMenu={() => setOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex-1 overflow-y-auto p-3 space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}

function AppHeader({ onMenu }: { onMenu: () => void }) {
  const { theme, toggleTheme, profile } = useFinance();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = NAV.find((n) => n.to === pathname);

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b no-print">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-16 max-w-[1400px] mx-auto">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Spend Wise</div>
          <div className="font-display font-semibold truncate">{current?.label ?? "Dashboard"}</div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <RemindersButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-accent transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="gradient-primary text-white text-xs font-semibold">
                    {profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium leading-tight">{profile.name}</div>
                  <div className="text-xs text-muted-foreground leading-tight">{profile.email}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-medium">{profile.name}</div>
                <div className="text-xs text-muted-foreground font-normal">{profile.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                <UserCog className="mr-2 h-4 w-4" /> Edit profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                Switch theme
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/" })}>
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function RemindersButton() {
  const { reminders, addReminder, updateReminder, deleteReminder } = useFinance();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const pending = reminders.filter((r) => !r.done).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {pending > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full text-[10px] font-bold bg-primary text-primary-foreground grid place-items-center">
              {pending}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <div className="font-semibold">Daily reminders</div>
          <div className="text-xs text-muted-foreground">Stay on top of bills & expenses</div>
        </div>
        <div className="p-3 border-b space-y-2">
          <Input placeholder="Reminder title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Button
              size="icon"
              onClick={() => {
                if (!title.trim()) return;
                addReminder({ title: title.trim(), date: new Date(date).toISOString() });
                setTitle("");
              }}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y">
          {reminders.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No reminders yet. Try "Pay electricity bill" or "Record today's expenses".
            </div>
          )}
          {reminders.map((r) => (
            <div key={r.id} className="p-3 flex items-center gap-2">
              <button
                onClick={() => updateReminder(r.id, { done: !r.done })}
                className={cn(
                  "h-5 w-5 rounded-md border grid place-items-center shrink-0",
                  r.done && "bg-primary border-primary text-primary-foreground"
                )}
              >
                {r.done && <Check className="h-3 w-3" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={cn("text-sm truncate", r.done && "line-through text-muted-foreground")}>{r.title}</div>
                <div className="text-xs text-muted-foreground">{format(new Date(r.date), "MMM d, yyyy")}</div>
              </div>
              <button onClick={() => deleteReminder(r.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
