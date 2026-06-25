import type { ReactNode } from "react";
import { OSSidebar } from "@/components/os/Sidebar";
import { TopBar } from "@/components/os/TopBar";
import { CommandPaletteProvider } from "@/components/os/CommandPalette";
import { AIDock } from "@/components/os/AIDock";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <CommandPaletteProvider>
      <div className="relative flex h-screen w-full overflow-hidden bg-background">
        {/* Ambient aurora */}
        <div className="pointer-events-none absolute inset-0 aurora-bg opacity-[0.35]" />
        <div className="pointer-events-none absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full gradient-glow opacity-30 blur-3xl animate-float" />

        <OSSidebar />
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        <AIDock />
      </div>
    </CommandPaletteProvider>
  );
}
