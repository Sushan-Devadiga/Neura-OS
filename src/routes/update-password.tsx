import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/update-password")({
  head: () => ({
    meta: [
      { title: "Update Password · NeuraOS" },
      { name: "description", content: "Update your password." },
    ],
  }),
  component: UpdatePasswordPage,
});

function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated successfully.");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      console.error("[Auth] Update password failed:", err);
      toast.error(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center p-6 sm:p-10">
      <div className="absolute inset-0 -z-10 aurora-bg opacity-40" />
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Link to="/"><Logo /></Link></div>

        <h1 className="text-display text-2xl font-semibold text-center">
          Update password
        </h1>
        <p className="mt-1.5 mb-6 text-[13px] text-muted-foreground text-center">
          Please enter your new password below.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[12px]">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading}
            className="w-full h-10 gradient-signature animate-gradient text-white border-0 shadow-[0_0_24px_-6px_rgba(122,90,248,0.7)]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                Update password
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
