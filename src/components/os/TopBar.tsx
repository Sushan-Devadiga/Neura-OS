import { Search, Bell, Plus, Command as CmdIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommandPalette } from "@/components/os/CommandPalette";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function TopBar() {
  const { open } = useCommandPalette();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const initials = email ? email[0]?.toUpperCase() : "N";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-2xl">
      <button
        onClick={open}
        className="group flex h-9 flex-1 max-w-xl items-center gap-2.5 rounded-xl border border-border/60 bg-surface/60 px-3 text-[13px] text-muted-foreground transition-all hover:border-primary/40 hover:bg-surface"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search anything, or ask NeuraOS…</span>
        <kbd className="flex items-center gap-0.5 rounded-md border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          <CmdIcon className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="sm" className="gap-1.5 text-[12px]">
          <Sparkles className="h-3.5 w-3.5 text-ai-purple" />
          <span className="hidden lg:inline">Ask AI</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-ai-pink" />
        </Button>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
          className="ml-1 grid h-8 w-8 place-items-center rounded-full gradient-signature text-[12px] font-semibold text-white shadow-[0_0_16px_-4px_rgba(122,90,248,0.6)]"
          title={email || "Account"}
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
