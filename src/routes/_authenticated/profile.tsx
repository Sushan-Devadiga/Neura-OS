import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Mail, Key } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setDisplayName(data.user?.user_metadata?.name || "");
    });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: displayName }
      });
      if (error) throw error;
      toast.success("Profile updated successfully");
      // Update local state to reflect change
      setUser((prev: any) => ({
        ...prev,
        user_metadata: { ...prev?.user_metadata, name: displayName }
      }));
    } catch (err: any) {
      console.error("Update profile error:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <ModulePage>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ModulePage>
    );
  }

  const email = user.email ?? "";
  const name = user.user_metadata?.name ?? "";
  const initials = name ? name[0].toUpperCase() : (email ? email[0].toUpperCase() : "N");
  const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString() : "—";
  const workspaceName = name ? `${name}'s Workspace` : "My Workspace";

  return (
    <ModulePage>
      <ModuleHeader 
        eyebrow="My Profile" 
        title="Account details." 
        description="Manage your public profile and security settings." 
      />

      <div className="space-y-6 max-w-3xl">
        {/* Account Information */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-display font-semibold mb-4">Account Information</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full gradient-signature text-xl font-semibold text-white shadow-lg">
                {initials}
              </div>
              <div>
                <div className="font-medium text-lg">{name || "User"}</div>
                <div className="text-sm text-muted-foreground">{email}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <div className="text-muted-foreground text-[11px] uppercase tracking-wider">Workspace</div>
                <div className="mt-1 truncate">{workspaceName}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[11px] uppercase tracking-wider">Created</div>
                <div className="mt-1">{createdAt}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-display font-semibold mb-4">Edit Profile</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-[12px]">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ada Lovelace"
                className="bg-surface/60"
              />
            </div>
            <Button type="submit" disabled={isSaving || displayName === name} className="h-9 gradient-signature border-0 text-white">
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save changes
            </Button>
          </form>
        </div>

        {/* Avatar */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-display font-semibold mb-4">Avatar</h3>
          <div className="flex items-center gap-6">
            <div className="grid h-20 w-20 place-items-center rounded-full gradient-signature text-2xl font-semibold text-white shadow-lg">
              {initials}
            </div>
            <div className="space-y-2">
              <p className="text-[13px] text-muted-foreground">Upload a custom avatar to personalize your workspace.</p>
              <div className="flex items-center gap-3">
                <Button variant="outline" disabled className="h-9 opacity-50 relative group">
                  Upload Avatar
                </Button>
                <span className="text-[11px] font-medium text-ai-purple bg-ai-purple/10 px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-display font-semibold mb-4">Security</h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4 mb-4">
            <div>
              <div className="font-medium text-[14px] flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address
              </div>
              <div className="text-[13px] text-muted-foreground mt-1">{email}</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-medium text-[14px] flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                Password
              </div>
              <div className="text-[13px] text-muted-foreground mt-1">Update your password to keep your account secure.</div>
            </div>
            <Button variant="outline" onClick={() => navigate({ to: "/update-password" })} className="h-9 whitespace-nowrap">
              Change Password
            </Button>
          </div>
        </div>

        {/* Account Status */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-display font-semibold mb-4">Account Status</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-[13px]">
            <div className="flex items-center gap-2.5 bg-surface/40 p-3 rounded-lg border border-border/40">
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <div className="font-medium">Session Active</div>
                <div className="text-[11px] text-muted-foreground">You are currently logged in.</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-surface/40 p-3 rounded-lg border border-border/40">
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="font-medium">{user.email_confirmed_at ? "Email Verified" : "Email Unverified"}</div>
                <div className="text-[11px] text-muted-foreground">
                  {user.email_confirmed_at ? "Your email address has been confirmed." : "Please check your inbox to verify."}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </ModulePage>
  );
}
