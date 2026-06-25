import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({ component: Page });

function Page() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  return (
    <ModulePage>
      <ModuleHeader eyebrow="Settings" title="Your workspace." description="Account, appearance, AI preferences, and security." />

      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="text-display font-semibold">Account</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-[13px]">
          <div>
            <div className="text-muted-foreground text-[11px] uppercase tracking-wider">Email</div>
            <div className="mt-1">{email || "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-[11px] uppercase tracking-wider">Plan</div>
            <div className="mt-1">Free · Lovable Cloud</div>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success("Signed out");
              navigate({ to: "/auth" });
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
