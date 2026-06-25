import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModuleHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  hue?: string;
}

export function ModuleHeader({ eyebrow, title, description, actions, hue = "ai-purple" }: ModuleHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: `var(--color-${hue})` }}>
            {eyebrow}
          </div>
        )}
        <h1 className="text-display mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[14px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ModulePage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl p-6 lg:p-8 space-y-8", className)}>{children}</div>;
}

interface ComingSoonProps {
  module: string;
  description: string;
  hue?: string;
  features?: string[];
}

export function ComingSoon({ module, description, hue = "ai-purple", features = [] }: ComingSoonProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl glass-strong p-10">
      <div
        className="absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{ background: `var(--color-${hue})` }}
      />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-surface/70 px-2.5 py-0.5 text-[10.5px] font-medium" style={{ color: `var(--color-${hue})` }}>
          ● {module} module
        </div>
        <h2 className="text-display mt-4 text-2xl font-semibold">Wiring up the {module} engine…</h2>
        <p className="mt-2 max-w-xl text-[13.5px] text-muted-foreground">{description}</p>
        {features.length > 0 && (
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13px]">
                <span className="mt-1 h-1.5 w-1.5 rounded-full gradient-signature shrink-0" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
