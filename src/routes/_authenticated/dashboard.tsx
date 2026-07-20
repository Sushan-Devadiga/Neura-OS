import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModulePage } from "@/components/os/ModulePage";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ContinueWorking } from "@/components/dashboard/ContinueWorking";
import { RecentActivityFeed, ActivityItem } from "@/components/dashboard/RecentActivityFeed";
import { UpcomingTasksWidget } from "@/components/dashboard/UpcomingTasksWidget";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { GlobalSearchDialog } from "@/components/dashboard/GlobalSearchDialog";
import { Project } from "@/types/project";
import { Task } from "@/types/task";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Fetch Dashboard Data
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard_data"],
    queryFn: async () => {
      // Execute all main queries in parallel
      const [
        { count: projectsCount },
        { count: notesCount },
        { count: docsCount },
        { count: tasksCount },
        { count: chatsCount },
        { data: recentProject },
        { data: recentProjects },
        { data: recentNotes },
        { data: recentDocs },
        { data: recentTasksData },
        { data: recentChats },
        { data: upcomingTasksData }
      ] = await Promise.all([
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("notes").select("*", { count: "exact", head: true }),
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase.from("tasks").select("*", { count: "exact", head: true }),
        supabase.from("chat_sessions").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*").order("updated_at", { ascending: false }).limit(1),
        supabase.from("projects").select("id, name, updated_at").order("updated_at", { ascending: false }).limit(5),
        supabase.from("notes").select("id, title, updated_at, project_id").order("updated_at", { ascending: false }).limit(5),
        supabase.from("documents").select("id, file_name, updated_at, project_id").order("updated_at", { ascending: false }).limit(5),
        supabase.from("tasks").select("id, title, updated_at, project_id").order("updated_at", { ascending: false }).limit(5),
        supabase.from("chat_sessions").select("id, title, updated_at, project_id").order("updated_at", { ascending: false }).limit(5),
        supabase.from("tasks").select("*").neq("status", "done").not("due_date", "is", null).order("due_date", { ascending: true }).limit(20)
      ]);

      // Combine and sort recent activity
      const combinedActivity: ActivityItem[] = [];
      
      recentProjects?.forEach(p => combinedActivity.push({ id: p.id, type: "project", title: p.name, description: "Updated project details", updated_at: p.updated_at, project_id: p.id }));
      recentNotes?.forEach(n => combinedActivity.push({ id: n.id, type: "note", title: n.title, description: "Updated note content", updated_at: n.updated_at, project_id: n.project_id }));
      recentDocs?.forEach(d => combinedActivity.push({ id: d.id, type: "document", title: d.file_name, description: "Uploaded new version", updated_at: d.updated_at, project_id: d.project_id }));
      recentTasksData?.forEach(t => combinedActivity.push({ id: t.id, type: "task", title: t.title, description: "Updated task status or details", updated_at: t.updated_at, project_id: t.project_id }));
      recentChats?.forEach(c => combinedActivity.push({ id: c.id, type: "chat", title: c.title || "AI Chat", description: "Continued AI conversation", updated_at: c.updated_at, project_id: c.project_id }));

      combinedActivity.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      return {
        stats: {
          projects: projectsCount || 0,
          notes: notesCount || 0,
          documents: docsCount || 0,
          tasks: tasksCount || 0,
          chats: chatsCount || 0,
        },
        recentProject: (recentProject?.[0] as Project) || undefined,
        activities: combinedActivity.slice(0, 8),
        upcomingTasks: (upcomingTasksData as Task[]) || [],
      };
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

  if (error || !data) {
    return (
      <ModulePage>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center text-destructive">
          <p>Failed to load dashboard. Please refresh the page.</p>
        </div>
      </ModulePage>
    );
  }

  return (
    <ModulePage>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="space-y-2"
        >
          <div className="text-[12px] text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
          <h1 className="text-display text-4xl font-semibold tracking-tight">
            {greet}. <span className="gradient-text">What should we build today?</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Button 
            variant="outline" 
            className="rounded-full shadow-sm pr-6 pl-4"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Search everything...</span>
            <kbd className="ml-4 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </motion.div>
      </div>

      <div className="space-y-6">
        <DashboardStats stats={data.stats} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6 flex flex-col">
            <ContinueWorking project={data.recentProject} />
            <div className="flex-1">
              <RecentActivityFeed activities={data.activities} />
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            <QuickActions recentProject={data.recentProject} />
            <div className="flex-1">
              <UpcomingTasksWidget tasks={data.upcomingTasks} />
            </div>
          </div>
        </div>
      </div>

      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </ModulePage>
  );
}
