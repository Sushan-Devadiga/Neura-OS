import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { User, LogOut, Brain, Sparkles, Moon, Sun, ChevronRight, Mail, Calendar, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({ component: Page });

function Page() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const email = user?.email ?? "";
  const initials = email ? email[0].toUpperCase() : "N";
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "—";
  const provider = user?.app_metadata?.provider ?? "email";

  return (
    <ModulePage>
      <ModuleHeader eyebrow="Settings" title="Your workspace." description="Manage your account, appearance, and AI preferences." />

      <div className="max-w-4xl space-y-6 mt-8 pb-12">
        {/* Account Section */}
        <div className="bg-surface/40 border border-border/40 rounded-xl overflow-hidden backdrop-blur-sm transition-all hover:bg-surface/60 hover:border-border/60 shadow-sm">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-xl font-semibold text-white shadow-lg ring-4 ring-background/50">
                  {initials}
                </div>
                <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-background"></div>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-foreground tracking-tight">{user?.user_metadata?.full_name || "Workspace User"}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Mail className="h-3.5 w-3.5" />
                  {email || "—"}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
               <Button 
                variant="outline" 
                className="w-full sm:w-auto bg-background/50 hover:bg-destructive hover:text-destructive-foreground transition-colors group border-border/50" 
                onClick={async () => {
                  try {
                    const { error } = await supabase.auth.signOut();
                    if (error) throw error;
                    toast.success("Signed out successfully");
                    navigate({ to: "/auth" });
                  } catch (err: any) {
                    console.error("Sign out error:", err);
                    toast.error(err.message || "Failed to sign out");
                  }
                }}
               >
                 <LogOut className="h-4 w-4 mr-2 opacity-70 group-hover:opacity-100" />
                 Sign Out
               </Button>
            </div>
          </div>
          
          <div className="bg-black/20 border-t border-border/40 p-6 sm:px-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Calendar className="h-3 w-3"/> Member Since</p>
              <p className="text-sm font-medium">{createdAt}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><User className="h-3 w-3"/> Provider</p>
              <p className="text-sm font-medium capitalize">{provider}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><SettingsIcon className="h-3 w-3"/> Role</p>
              <p className="text-sm font-medium capitalize">Admin</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="h-3 w-3"/> Status</p>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500 border border-green-500/20">
                Active
              </div>
            </div>
          </div>
        </div>

        {/* AI Preferences Section */}
        <div className="bg-surface/40 border border-border/40 rounded-xl p-6 sm:p-8 backdrop-blur-sm transition-all hover:bg-surface/60 hover:border-border/60 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-lg flex items-center gap-2 tracking-tight">
                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20"><Brain className="h-4 w-4" /></div>
                AI Preferences
              </h3>
              <p className="text-sm text-muted-foreground max-w-lg">Customize your AI assistant's behavior, default models, and memory scope across your workspace.</p>
            </div>
            <Button variant="outline" size="sm" disabled className="border-border/50 bg-background/50">Coming Soon</Button>
          </div>
          
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border/40 bg-background/40 flex items-center justify-between opacity-70 group cursor-not-allowed">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-surface border border-border/50 shadow-sm"><Sparkles className="h-4 w-4 text-ai-cyan" /></div>
                <div>
                  <p className="text-sm font-medium text-foreground">Default Model</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Gemini 3 Flash</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50" />
            </div>
            <div className="p-4 rounded-xl border border-border/40 bg-background/40 flex items-center justify-between opacity-70 group cursor-not-allowed">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-surface border border-border/50 shadow-sm"><Brain className="h-4 w-4 text-ai-orange" /></div>
                <div>
                  <p className="text-sm font-medium text-foreground">Memory Scope</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Global Workspace</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50" />
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-surface/40 border border-border/40 rounded-xl p-6 sm:p-8 backdrop-blur-sm transition-all hover:bg-surface/60 hover:border-border/60 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-lg flex items-center gap-2 tracking-tight">
                <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20"><Moon className="h-4 w-4" /></div>
                Appearance
              </h3>
              <p className="text-sm text-muted-foreground max-w-lg">NeuraOS is meticulously designed for a dark-first experience to reduce eye strain.</p>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="inline-flex rounded-lg p-1 border border-border/50 bg-background/50">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-surface text-sm font-medium shadow-sm border border-border/50 text-foreground transition-all">
                <Moon className="h-4 w-4" /> Dark
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-all cursor-not-allowed opacity-50" title="Coming with theming update">
                <Sun className="h-4 w-4" /> Light
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
