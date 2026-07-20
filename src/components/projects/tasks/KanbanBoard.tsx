import { Task, TaskStatus } from "@/types/task";
import { KanbanColumn } from "./KanbanColumn";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function KanbanBoard({ projectId, tasks, onTaskClick }: KanbanBoardProps) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string, newStatus: TaskStatus }) => {
      // Optimistic update can be handled via queryClient in onMutate, 
      // but for simplicity we'll just invalidate on success.
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_tasks", projectId] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Failed to update task status");
    }
  });

  const handleDropTask = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      updateStatusMutation.mutate({ taskId, newStatus });
      // Optimistically update the UI by modifying cache
      queryClient.setQueryData(["project_tasks", projectId], (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      });
    }
  };

  const todoTasks = tasks.filter(t => t.status === "todo");
  const inProgressTasks = tasks.filter(t => t.status === "in-progress");
  const doneTasks = tasks.filter(t => t.status === "done");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
      <KanbanColumn 
        status="todo" 
        title="To Do" 
        tasks={todoTasks} 
        onTaskClick={onTaskClick} 
        onDropTask={handleDropTask}
      />
      <KanbanColumn 
        status="in-progress" 
        title="In Progress" 
        tasks={inProgressTasks} 
        onTaskClick={onTaskClick} 
        onDropTask={handleDropTask}
      />
      <KanbanColumn 
        status="done" 
        title="Done" 
        tasks={doneTasks} 
        onTaskClick={onTaskClick} 
        onDropTask={handleDropTask}
      />
    </div>
  );
}
