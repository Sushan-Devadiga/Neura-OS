import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({ component: Page });

function Page() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const email = user?.email ?? "";
  const initials = email ? email[0].toUpperCase() : "N";
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—";
  const lastSignIn = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "—";
  const provider = user?.app_metadata?.provider ?? "email";

  return (
    <ModulePage>
      <ModuleHeader eyebrow="Settings" title="Your workspace." description="Account, appearance, AI preferences, and security." />

      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="text-display font-semibold">Account</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="grid h-16 w-16 place-items-center rounded-full gradient-signature text-xl font-semibold text-white shadow-lg">
            {initials}
          </div>
          <div>
            <div className="font-medium text-lg">{email || "—"}</div>
            <div className="text-sm text-muted-foreground capitalize">Provider: {provider}</div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-[13px] border-t border-border/50 pt-4">
          <div>
            <div className="text-muted-foreground text-[11px] uppercase tracking-wider">Account Created</div>
            <div className="mt-1">{createdAt}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-[11px] uppercase tracking-wider">Last Sign In</div>
            <div className="mt-1">{lastSignIn}</div>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
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
            Sign out
          </Button>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-3">
        <h3 className="text-display font-semibold">AI preferences</h3>
        <p className="text-[13px] text-muted-foreground">Default chat model, memory scope, and response style. Coming next.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-3">
        <h3 className="text-display font-semibold">Appearance</h3>
        <p className="text-[13px] text-muted-foreground">NeuraOS is dark-first. Light mode lands with theming.</p>
      </div>
    </ModulePage>
  );
}
