import { Task } from "@/types/task";
import { format } from "date-fns";
import { CalendarIcon, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("taskId", task.id);
    // Optional: Set a drag image or styling
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = "1";
  };

  const priorityColors = {
    low: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    high: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  };

  const statusIcons = {
    "todo": <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />,
    "in-progress": <Clock className="w-3.5 h-3.5 text-amber-500" />,
    "done": <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick(task)}
      className="bg-card hover:bg-accent/50 border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing transition-colors"
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <h4 className="font-medium text-sm leading-tight line-clamp-2">
          {task.title}
        </h4>
        <div className="shrink-0 mt-0.5">
          {statusIcons[task.status]}
        </div>
      </div>
      
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2">
        <div className={cn(
          "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border",
          priorityColors[task.priority]
        )}>
          {task.priority}
        </div>
        
        {task.due_date && (
          <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
            <CalendarIcon className="w-3 h-3 mr-1" />
            {format(new Date(task.due_date), "MMM d")}
          </div>
        )}
      </div>
    </div>
  );
}
