import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskStatus, TaskPriority } from "@/types/task";
import { Plus, Trash, Calendar, AlertCircle, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/tasks")({ component: Page });

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "In Progress" },
  { id: "done", label: "Done" }
];

function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const DEFAULT_PROJECT = "00000000-0000-0000-0000-000000000000";

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      toast.error("Failed to load tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const projectIdToUse = tasks.length > 0 ? tasks[0].project_id : DEFAULT_PROJECT;

      const newTask = {
        title: newTaskTitle,
        status: "todo" as TaskStatus,
        priority: "medium" as TaskPriority,
        project_id: projectIdToUse,
        user_id: session.user.id
      };

      const { data, error } = await supabase.from("tasks").insert(newTask).select().single();
      if (error) throw error;

      setTasks([data, ...tasks]);
      setNewTaskTitle("");
      setIsCreating(false);
      toast.success("Task created");
    } catch (err: any) {
      toast.error(err.message || "Failed to create task");
      console.error("Task creation error:", err);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      const { error } = await supabase.from("tasks").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    } catch (err) {
      toast.error("Failed to update task");
      loadTasks(); // revert on error
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      setTasks(prev => prev.filter(t => t.id !== id));
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
      toast.success("Task deleted");
    } catch (err) {
      toast.error("Failed to delete task");
      loadTasks(); // revert on error
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("taskId", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== status) {
      handleUpdateTask(taskId, { status });
    }
  };

  return (
    <ModulePage>
      <ModuleHeader eyebrow="Tasks" title="Get it done." description="Manage your tasks using a Kanban board." hue="ai-green" />
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <div className="font-medium text-lg">Task Board</div>
          <Button onClick={() => setIsCreating(true)} className="bg-ai-green hover:bg-ai-green/90">
            <Plus className="h-4 w-4 mr-2" /> New Task
          </Button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateTask} className="mb-8 p-4 bg-surface rounded-xl border flex items-center gap-4">
            <Input 
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1"
            />
            <Button type="submit" className="bg-ai-green hover:bg-ai-green/90">Add</Button>
            <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
          </form>
        )}

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {COLUMNS.map(column => (
              <div 
                key={column.id} 
                className="bg-surface/50 rounded-2xl border border-border/50 p-4 min-h-[500px] flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="font-semibold text-foreground/80">{column.label}</h3>
                  <span className="text-xs bg-background rounded-full px-2 py-1 text-muted-foreground font-medium">
                    {tasks.filter(t => t.status === column.id).length}
                  </span>
                </div>
                
                <div className="flex-1 flex flex-col gap-3">
                  {tasks.filter(t => t.status === column.id).map(task => (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-background rounded-xl p-4 border border-border/50 shadow-sm hover:border-ai-green/40 hover:shadow-md transition-all group cursor-grab active:cursor-grabbing"
                    >
                      {editingTask?.id === task.id ? (
                        <div className="space-y-3">
                          <Input 
                            value={editingTask.title} 
                            onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                          />
                          <div className="flex gap-2">
                            <Select value={editingTask.priority} onValueChange={(v: TaskPriority) => setEditingTask({...editingTask, priority: v})}>
                              <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input 
                              type="date"
                              value={editingTask.due_date ? editingTask.due_date.split("T")[0] : ""}
                              onChange={e => setEditingTask({...editingTask, due_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                              className="h-8 text-xs w-36"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingTask(null)}>Cancel</Button>
                            <Button size="sm" className="bg-ai-green" onClick={() => {
                              handleUpdateTask(task.id, { title: editingTask.title, priority: editingTask.priority, due_date: editingTask.due_date });
                              setEditingTask(null);
                            }}>Save</Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <h4 className="text-[14px] font-medium leading-snug">{task.title}</h4>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive shrink-0" onClick={() => handleDeleteTask(task.id)}>
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-4 ml-6 cursor-pointer" onClick={() => setEditingTask(task)}>
                            <div className={`text-[10px] px-2 py-0.5 rounded-md font-medium uppercase tracking-wide
                              ${task.priority === 'high' ? 'bg-rose-500/10 text-rose-500' : 
                                task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' : 
                                'bg-emerald-500/10 text-emerald-500'}`}
                            >
                              {task.priority}
                            </div>
                            
                            {task.due_date && (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(task.due_date), "MMM d")}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {tasks.filter(t => t.status === column.id).length === 0 && (
                    <div className="h-full border-2 border-dashed border-border/40 rounded-xl flex items-center justify-center text-muted-foreground text-sm p-6 text-center">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModulePage>
  );
}
