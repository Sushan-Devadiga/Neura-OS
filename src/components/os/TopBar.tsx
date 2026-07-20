import { Search, Bell, Plus, Command as CmdIcon, Sparkles, User, Settings, HelpCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCommandPalette } from "@/components/os/CommandPalette";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function TopBar() {
  const { open } = useCommandPalette();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const email = user?.email ?? "";
  const name = user?.user_metadata?.name ?? "";
  const initials = name ? name[0].toUpperCase() : (email ? email[0].toUpperCase() : "N");

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-1 grid h-8 w-8 place-items-center rounded-full gradient-signature text-[12px] font-semibold text-white shadow-[0_0_16px_-4px_rgba(122,90,248,0.6)] cursor-pointer outline-none hover:opacity-90 transition-opacity"
              title={name || email || "Account"}
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass border-border/50">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate({ to: "/profile" })}>
              <User className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate({ to: "/settings" })}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => toast.info("Help & Support coming soon!")}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Support</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10"
              onClick={async () => {
                try {
                  const { error } = await supabase.auth.signOut();
                  if (error) throw error;
                  navigate({ to: "/auth" });
                } catch (err: any) {
                  console.error("Sign out error:", err);
                  toast.error(err.message || "Failed to sign out");
                }
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
