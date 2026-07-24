import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { motion } from "framer-motion";
import { 
  Github, 
  MessageSquare, 
  CalendarDays, 
  BookOpen, 
  CheckCircle2, 
  PlusCircle, 
  Webhook, 
  Target,
  ArrowRight
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/integrations")({ component: Page });

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: any;
  hue: string;
  status: "connected" | "disconnected";
};

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: "google",
    name: "Google Workspace",
    description: "Sync your Calendar, Drive, and Gmail with NeuraOS memory.",
    icon: CalendarDays,
    hue: "ai-cyan",
    status: "disconnected",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Allow agents to read messages and post updates to channels.",
    icon: MessageSquare,
    hue: "ai-pink",
    status: "connected",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Connect repositories for code context, PR reviews, and issues.",
    icon: Github,
    hue: "ai-purple",
    status: "connected",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Import pages and databases directly into your knowledge graph.",
    icon: BookOpen,
    hue: "ai-orange",
    status: "disconnected",
  },
  {
    id: "linear",
    name: "Linear",
    description: "Sync issues, track project progress, and automate task creation.",
    icon: Target,
    hue: "ai-blue",
    status: "disconnected",
  },
  {
    id: "webhooks",
    name: "Custom Webhooks",
    description: "Trigger agents or send memory updates via standard HTTP endpoints.",
    icon: Webhook,
    hue: "emerald-400",
    status: "connected",
  }
];

function Page() {
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);

  const toggleConnection = (id: string) => {
    setIntegrations(prev => prev.map(int => 
      int.id === id 
        ? { ...int, status: int.status === "connected" ? "disconnected" : "connected" } 
        : int
    ));
  };

  return (
    <ModulePage>
      <ModuleHeader 
        eyebrow="Integrations" 
        title="Plug NeuraOS into your stack." 
        description="Connect Google, Slack, GitHub, and more to your second brain." 
        hue="ai-purple"
      />
      
      <div className="mt-6 pb-12 overflow-y-auto max-h-[calc(100vh-180px)] pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, i) => {
            const isConnected = integration.status === "connected";
            
            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`glass rounded-2xl p-6 border relative overflow-hidden group transition-all duration-300 flex flex-col h-full ${
                  isConnected 
                    ? 'border-[var(--color-' + integration.hue + ')]/30 shadow-[0_0_15px_rgba(var(--color-' + integration.hue + '-rgb),0.1)]' 
                    : 'border-border/30 hover:border-border/60'
                }`}
              >
                {/* Background Glow */}
                <div 
                  className={`absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none ${isConnected ? 'opacity-5 group-hover:opacity-10' : 'group-hover:opacity-5'}`}
                  style={{ background: `radial-gradient(circle at top right, var(--color-${integration.hue}), transparent 60%)` }}
                />

                {/* Header: Icon & Status */}
                <div className="flex justify-between items-start mb-6 z-10">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-background/50 border border-border/50 shadow-sm"
                    style={{ color: `var(--color-${integration.hue})` }}
                  >
                    <integration.icon className="w-6 h-6" />
                  </div>
                  
                  {isConnected ? (
                    <div className="flex items-center text-[11px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Connected
                    </div>
                  ) : (
                    <div className="flex items-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-surface px-2.5 py-1 rounded-full border border-border/50">
                      Disconnected
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="z-10 flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{integration.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {integration.description}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="mt-8 pt-4 border-t border-border/50 z-10">
                  <Button 
                    variant={isConnected ? "outline" : "default"} 
                    className={`w-full justify-between group/btn ${
                      !isConnected && 'bg-foreground text-background hover:bg-foreground/90'
                    }`}
                    onClick={() => toggleConnection(integration.id)}
                  >
                    <span>{isConnected ? "Configure Integration" : "Connect Account"}</span>
                    {isConnected ? (
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/btn:translate-x-1 transition-transform" />
                    ) : (
                      <PlusCircle className="w-4 h-4 opacity-70 group-hover/btn:rotate-90 transition-transform" />
                    )}
                  </Button>
                </div>

              </motion.div>
            );
          })}
        </div>
      </div>
    </ModulePage>
  );
}
