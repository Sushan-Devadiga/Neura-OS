import { useState } from "react";
import { Task, TaskStatus } from "@/types/task";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDropTask: (taskId: string, newStatus: TaskStatus) => void;
}

export function KanbanColumn({ status, title, tasks, onTaskClick, onDropTask }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col h-full min-h-[500px] rounded-xl border bg-surface/30 transition-colors p-4",
        isDragOver ? "border-primary bg-primary/5" : "border-border/60"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          {title}
          <span className="bg-muted text-muted-foreground text-xs py-0.5 px-2 rounded-full">
            {tasks.length}
          </span>
        </h3>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto overflow-x-hidden pr-1 pb-4 custom-scrollbar">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onClick={onTaskClick} />
        ))}
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/50 rounded-lg opacity-50 p-6 text-center">
            <span className="text-sm text-muted-foreground">Drop tasks here</span>
          </div>
        )}
      </div>
    </div>
  );
}
