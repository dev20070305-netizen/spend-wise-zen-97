import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="grid place-items-center rounded-xl gradient-primary shadow-glow"
        style={{ width: size, height: size }}
      >
        <Wallet className="text-white" style={{ width: size * 0.55, height: size * 0.55 }} />
      </div>
      <span className="font-display text-xl font-bold tracking-tight">
        Spend<span className="text-primary">Wise</span>
      </span>
    </div>
  );
}
