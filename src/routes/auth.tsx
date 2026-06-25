import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · NeuraOS" },
      { name: "description", content: "Sign in or create your NeuraOS workspace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const onEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { name } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm — or sign in if email confirmation is off.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) { toast.error(result.error.message); return; }
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Brand side */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden">
        <div className="absolute inset-0 -z-10 aurora-bg opacity-60" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background/40 via-background/70 to-background" />
        <Link to="/"><Logo /></Link>
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="space-y-4"
        >
          <h2 className="text-display text-4xl font-bold leading-tight">
            Welcome to your <span className="gradient-text">second brain</span>.
          </h2>
          <p className="max-w-md text-[14px] text-muted-foreground">
            NeuraOS unifies AI chat, long-term memory, knowledge, projects, and agents in a
            single keyboard-native workspace.
          </p>
        </motion.div>
        <div className="text-[11.5px] text-muted-foreground">
          Trusted by AI-first teams · WCAG 2.2 AA · SOC 2-ready architecture
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8"><Link to="/"><Logo /></Link></div>

          <h1 className="text-display text-2xl font-semibold">
            {tab === "signin" ? "Sign in to NeuraOS" : "Create your workspace"}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            {tab === "signin" ? "Welcome back — let's get you back in." : "Start your AI-native workspace in seconds."}
          </p>

          <Button
            onClick={onGoogle}
            disabled={loading}
            variant="outline"
            className="mt-6 w-full h-10 border-border bg-surface/60 backdrop-blur"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground/70">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2 bg-surface/60">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <form onSubmit={onEmail} className="mt-5 space-y-3.5">
              {tab === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[12px]">Name</Label>
                  <Input id="name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ada Lovelace" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[12px]">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)}
                    placeholder="you@neuraos.ai" className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[12px]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input id="password" type="password" required minLength={6} value={password}
                    onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" className="pl-9" />
                </div>
              </div>

              <Button type="submit" disabled={loading}
                className="w-full h-10 gradient-signature animate-gradient text-white border-0 shadow-[0_0_24px_-6px_rgba(122,90,248,0.7)]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    {tab === "signin" ? "Sign in" : "Create workspace"}
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          </Tabs>

          <p className="mt-6 text-center text-[11.5px] text-muted-foreground">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
