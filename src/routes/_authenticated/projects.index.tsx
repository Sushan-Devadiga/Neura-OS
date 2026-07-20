import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/projects/")({ component: Page });

function Page() {
  const { data: projects, isLoading, isError, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData?.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
  });

  return (
    <ModulePage>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <ModuleHeader 
          eyebrow="Projects" 
          title="Your work, organized." 
          description="Track everything you're building — with AI as your project manager." 
          hue="ai-blue" 
        />
        <NewProjectModal>
          <Button className="shrink-0 gap-2 gradient-signature border-0 text-white shadow-md">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </NewProjectModal>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl border border-border/50 bg-surface/30 animate-pulse"></div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-surface/20 py-20 text-center">
            <div className="rounded-full bg-red-500/10 p-3 text-red-500">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Failed to load projects</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              We couldn't fetch your projects. Please try again.
            </p>
            <Button onClick={() => refetch()} variant="outline" className="mt-6">
              Retry
            </Button>
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-surface/20 py-24 text-center">
            <div className="rounded-full bg-surface p-4 text-muted-foreground border border-border/50">
              <FolderOpen className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">No projects yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Create your first project to start organizing your tasks, documents, and AI conversations.
            </p>
            <div className="mt-6">
              <NewProjectModal>
                <Button className="gradient-signature border-0 text-white shadow-md">
                  <Plus className="mr-2 h-4 w-4" /> Create First Project
                </Button>
              </NewProjectModal>
            </div>
          </div>
        )}
      </div>
    </ModulePage>
  );
}
