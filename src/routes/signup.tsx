import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/lib/finance-store";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Spend Wise" },
      { name: "description", content: "Create your Spend Wise account and start managing your finances." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { updateProfile } = useFinance();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    updateProfile({ name: form.name || "Alex Morgan", email: form.email || "alex@spendwise.app" });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden gradient-balance items-center justify-center p-12">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(600px circle at 70% 20%, oklch(0.72 0.18 162 / .5), transparent), radial-gradient(500px circle at 20% 80%, oklch(0.7 0.2 25 / .35), transparent)" }} />
        <div className="relative max-w-md text-white space-y-6">
          <h2 className="font-display text-4xl font-bold leading-tight">Take control of every dollar.</h2>
          <p className="text-white/80">Join thousands who use Spend Wise to plan smarter, save more, and stay on budget — beautifully.</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { k: "12k+", v: "Active users" },
              { k: "$4.2M", v: "Tracked monthly" },
              { k: "4.9★", v: "User rating" },
            ].map((s) => (
              <div key={s.v} className="rounded-xl bg-white/10 border border-white/15 p-4">
                <div className="font-display text-2xl font-bold">{s.k}</div>
                <div className="text-xs text-white/70">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between p-8 lg:p-12 bg-background">
        <Logo />
        <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold">Create account</h1>
            <p className="mt-2 text-muted-foreground">Start your journey to financial clarity.</p>
          </div>
          <div className="space-y-4">
            <Field label="Full name" icon={User}>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" className="pl-9 h-11" />
            </Field>
            <Field label="Email" icon={Mail}>
              <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="pl-9 h-11" />
            </Field>
            <Field label="Password" icon={Lock}>
              <Input required type={show ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="pl-9 pr-10 h-11" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>
            <Field label="Confirm password" icon={Lock}>
              <Input required type={show ? "text" : "password"} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="••••••••" className="pl-9 h-11" />
            </Field>
          </div>
          <Button type="submit" className="w-full h-11 gradient-primary text-white shadow-glow hover:opacity-95">
            Create account <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </form>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Spend Wise.</p>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        {children}
      </div>
    </div>
  );
}
