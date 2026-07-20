import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Project } from "@/types/project";
import { formatDistanceToNow } from "date-fns";
import { Box, Sparkles, Folder, Cpu, Layout, Briefcase, MoreVertical, Edit2, Trash2, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { RenameProjectDialog } from "./RenameProjectDialog";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Box,
  Sparkles,
  Folder,
  Cpu,
  Layout,
  Briefcase,
};

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  const IconComponent = project.icon && ICON_MAP[project.icon] ? ICON_MAP[project.icon] : Box;
  
  // Provide a fallback color if project.color is missing or invalid
  const colorClass = project.color || "bg-blue-500";

  const timeAgo = project.updated_at 
    ? formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })
    : "Recently";

  return (
    <>
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/50 bg-surface/40 p-5 transition-all hover:border-primary/30 hover:bg-surface/60 hover:shadow-lg">
        {/* Top section */}
        <div className="flex items-start justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-sm", colorClass)}>
            <IconComponent className="h-5 w-5" />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-60 transition-opacity hover:opacity-100 hover:bg-surface/80 data-[state=open]:opacity-100 data-[state=open]:bg-surface/80">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 glass">
              <DropdownMenuItem onClick={() => navigate({ to: '/projects/$projectId', params: { projectId: project.id } })}>
                <ExternalLink className="mr-2 h-4 w-4" /> Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
                <Edit2 className="mr-2 h-4 w-4" /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-500 focus:text-red-500"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <Link to="/projects/$projectId" params={{ projectId: project.id }} className="mt-4 block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md">
          <h3 className="font-semibold text-base tracking-tight truncate">{project.name}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {project.description || "No description provided."}
          </p>
        </Link>

        {/* Footer */}
        <div className="mt-5 flex items-center text-xs text-muted-foreground">
          <span className="truncate">Updated {timeAgo}</span>
        </div>
      </div>

      <RenameProjectDialog
        project={project}
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
      />

      <DeleteProjectDialog 
        projectId={project.id} 
        projectName={project.name} 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
      />
    </>
  );
}
