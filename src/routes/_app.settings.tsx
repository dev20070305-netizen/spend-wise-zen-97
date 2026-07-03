import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFinance } from "@/lib/finance-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Spend Wise" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, updateProfile, theme, setTheme } = useFinance();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and preferences.</p>
      </div>

      <Card className="p-6 shadow-card">
        <h3 className="font-display font-semibold mb-4">Profile</h3>
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="gradient-primary text-white text-lg font-semibold">
              {name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{name}</div>
            <div className="text-sm text-muted-foreground">{email}</div>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile({ name, email });
            toast.success("Profile updated");
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="space-y-2"><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="sm:col-span-2">
            <Button type="submit" className="gradient-primary text-white shadow-glow">Save changes</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 shadow-card">
        <h3 className="font-display font-semibold mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Dark mode</div>
            <div className="text-sm text-muted-foreground">Reduce eye strain with a darker palette.</div>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
        </div>
      </Card>
    </div>
  );
}
