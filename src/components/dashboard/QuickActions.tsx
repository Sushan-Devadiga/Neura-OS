import { Link } from "@tanstack/react-router";
import { Plus, FolderKanban, Brain, FileText, CheckSquare, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Project } from "@/types/project";
import { toast } from "sonner";

interface QuickActionsProps {
  recentProject?: Project;
}

export function QuickActions({ recentProject }: QuickActionsProps) {
  const actions = [
    { 
      label: "New Project", 
      icon: FolderKanban, 
      hue: "ai-purple", 
      to: "/projects",
      onClick: undefined
    },
    { 
      label: "New Note", 
      icon: Brain, 
      hue: "ai-orange",
      to: recentProject ? `/projects/${recentProject.id}` : "/projects",
      onClick: () => {
        if (!recentProject) toast.info("Select a project first to create a note.");
      }
    },
    { 
      label: "Upload Document", 
      icon: FileText, 
      hue: "ai-cyan",
      to: recentProject ? `/projects/${recentProject.id}` : "/projects",
      onClick: () => {
        if (!recentProject) toast.info("Select a project first to upload a document.");
      }
    },
    { 
      label: "New Task", 
      icon: CheckSquare, 
      hue: "ai-green",
      to: recentProject ? `/projects/${recentProject.id}` : "/projects",
      onClick: () => {
        if (!recentProject) toast.info("Select a project first to create a task.");
      }
    },
  ];

  return (
    <div className="relative overflow-hidden glass rounded-2xl p-5">
      <div className="absolute inset-0 -z-10 opacity-30 gradient-signature blur-3xl" />
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ai-pink font-semibold">
        <Zap className="h-3.5 w-3.5" /> Quick Actions
      </div>
      <p className="mt-2 text-[13px] text-muted-foreground">
        Jump straight into your most common workflows.
      </p>
      
      <div className="mt-4 grid grid-cols-2 gap-2">
        {actions.map((action, i) => (
          <Link
            key={action.label}
            to={action.to}
            onClick={action.onClick}
            className="flex items-center gap-2 rounded-lg bg-surface/60 hover:bg-surface px-3 py-2 text-[11.5px] transition-colors"
          >
            <action.icon className="h-3.5 w-3.5" style={{ color: `var(--color-${action.hue})` }} />
            <span className="font-medium text-foreground">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
