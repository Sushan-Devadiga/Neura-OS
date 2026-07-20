import { motion } from "framer-motion";
import { ArrowUpRight, Box, Brain, Cpu, Folder, Layout, Sparkles, FolderKanban } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Project } from "@/types/project";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Box,
  Sparkles,
  Folder,
  Cpu,
  Layout,
  FolderKanban
};

interface ContinueWorkingProps {
  project?: Project;
}

export function ContinueWorking({ project }: ContinueWorkingProps) {
  if (!project) return null;

  const IconComponent = project.icon && ICON_MAP[project.icon] ? ICON_MAP[project.icon] : Box;
  const colorClass = project.color || "bg-blue-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, delay: 0.05 }}
      className="relative overflow-hidden rounded-2xl glass-strong p-5 group"
    >
      <div className="absolute inset-0 -z-10 aurora-bg opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
      
      <div className="flex items-start gap-4">
        <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl shadow-sm text-white", colorClass)}>
          <IconComponent className="h-6 w-6" />
        </div>
        
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wider text-ai-purple font-semibold mb-1">
            Continue Working
          </div>
          <h3 className="text-lg font-semibold text-foreground line-clamp-1">
            {project.name}
          </h3>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
              {project.description}
            </p>
          )}
          
          <div className="mt-4 flex flex-wrap gap-2">
            <Link 
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface/80 text-[12px] font-medium transition-colors"
            >
              Open Project <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
