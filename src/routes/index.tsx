import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, TrendingUp, PieChart, Shield } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign In — Spend Wise" },
      { name: "description", content: "Sign in to your Spend Wise account to track your finances." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/dashboard" });
  };
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel */}
      <div className="flex flex-col justify-between p-8 lg:p-12 bg-background">
        <Logo />
        <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">Sign in to manage your money with clarity.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" required placeholder="you@example.com" className="pl-9 h-11" defaultValue="alex@spendwise.app" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={show ? "text" : "password"} required placeholder="••••••••" className="pl-9 pr-10 h-11" defaultValue="password" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="remember" defaultChecked />
              <Label htmlFor="remember" className="text-sm font-normal">Remember me for 30 days</Label>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 gradient-primary text-white shadow-glow hover:opacity-95">
            Sign in <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>
        </form>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Spend Wise. All rights reserved.</p>
      </div>

      {/* Right illustration panel */}
      <div className="hidden lg:flex relative overflow-hidden gradient-balance items-center justify-center p-12">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(600px circle at 30% 20%, oklch(0.72 0.18 162 / .5), transparent), radial-gradient(500px circle at 80% 80%, oklch(0.6 0.2 285 / .4), transparent)" }} />
        <div className="relative w-full max-w-md text-white space-y-8">
          <div className="glass-card rounded-2xl p-6 shadow-glow bg-white/10 border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Current balance</span>
              <TrendingUp className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="mt-2 font-display text-4xl font-bold">$12,438.90</div>
            <div className="mt-1 text-sm text-emerald-300">+ 8.2% this month</div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                <div className="text-xs text-white/60">Income</div>
                <div className="mt-1 font-semibold">$4,550</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                <div className="text-xs text-white/60">Expenses</div>
                <div className="mt-1 font-semibold">$1,832</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: PieChart, title: "Beautiful insights", desc: "Visual breakdowns of every dollar" },
              { icon: Shield, title: "Private by default", desc: "Your data stays on your device" },
              { icon: TrendingUp, title: "Smarter budgets", desc: "Stay ahead with proactive alerts" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-xl bg-white/5 p-3 border border-white/10">
                <f.icon className="h-5 w-5 mt-0.5 text-emerald-300" />
                <div>
                  <div className="font-medium">{f.title}</div>
                  <div className="text-sm text-white/70">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
