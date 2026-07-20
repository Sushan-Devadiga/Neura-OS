import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotesTab } from "@/components/projects/notes/NotesTab";
import { DocumentsTab } from "@/components/projects/documents/DocumentsTab";
import { TasksTab } from "@/components/projects/tasks/TasksTab";
import { AIChatTab } from "@/components/projects/ai/AIChatTab";
import { MemoriesTab } from "@/components/projects/memories/MemoriesTab";
import { KnowledgeGraphTab } from "@/components/projects/graph/KnowledgeGraphTab";
import { Loader2, ArrowLeft, Box, Sparkles, Folder, Cpu, Layout, Briefcase, BrainCircuit, Network } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Box,
  Sparkles,
  Folder,
  Cpu,
  Layout,
  Briefcase,
};

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  component: ProjectDetailsPage,
});

function ProjectDetailsPage() {
  const { projectId } = Route.useParams();

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data as Project;
    },
  });

  if (isLoading) {
    return (
      <ModulePage>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ModulePage>
    );
  }

  if (isError || !project) {
    return (
      <ModulePage>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h3 className="text-xl font-semibold">Project not found</h3>
          <p className="text-muted-foreground mt-2">The project you're looking for doesn't exist or you don't have access.</p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/projects">Return to Projects</Link>
          </Button>
        </div>
      </ModulePage>
    );
  }

  const IconComponent = project.icon && ICON_MAP[project.icon] ? ICON_MAP[project.icon] : Box;
  const colorClass = project.color || "bg-blue-500";
  
  const [defaultTab] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('open_ai_chat') === 'true') {
      localStorage.removeItem('open_ai_chat');
      return 'ai';
    }
    return 'notes';
  });

  return (
    <ModulePage>
      <div className="mb-6 flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to projects
          </Link>
        </Button>
      </div>

      <div className="flex items-start gap-4 mb-8">
        <div className={cn("mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-white shadow-md", colorClass)}>
          <IconComponent className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.name}</h1>
          {project.description && (
            <p className="mt-2 text-lg text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border/60 bg-transparent p-0 h-auto overflow-x-auto hide-scrollbar flex-nowrap">
          <TabsTrigger value="notes" className="whitespace-nowrap rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Notes
          </TabsTrigger>
          <TabsTrigger value="documents" className="whitespace-nowrap rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Documents
          </TabsTrigger>
          <TabsTrigger value="tasks" className="whitespace-nowrap rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Tasks
          </TabsTrigger>
          <TabsTrigger value="ai" className="whitespace-nowrap rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            AI Chat
          </TabsTrigger>
          <TabsTrigger value="memories" className="whitespace-nowrap rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <BrainCircuit className="w-4 h-4 mr-2 inline-block" />
            Memories
          </TabsTrigger>
          <TabsTrigger value="graph" className="whitespace-nowrap rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <Network className="w-4 h-4 mr-2 inline-block" />
            Graph
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="notes" className="focus-visible:outline-none focus-visible:ring-0">
            <NotesTab projectId={projectId} />
          </TabsContent>

          <TabsContent value="documents" className="focus-visible:outline-none focus-visible:ring-0">
            <DocumentsTab projectId={projectId} />
          </TabsContent>

          <TabsContent value="tasks" className="focus-visible:outline-none focus-visible:ring-0">
            <TasksTab projectId={projectId} />
          </TabsContent>

          <TabsContent value="ai" className="focus-visible:outline-none focus-visible:ring-0">
            <AIChatTab projectId={projectId} />
          </TabsContent>

          <TabsContent value="memories" className="focus-visible:outline-none focus-visible:ring-0">
            <MemoriesTab projectId={projectId} />
          </TabsContent>

          <TabsContent value="graph" className="focus-visible:outline-none focus-visible:ring-0">
            <KnowledgeGraphTab projectId={projectId} />
          </TabsContent>
        </div>
      </Tabs>
    </ModulePage>
  );
}
