import { Calendar, AlertCircle } from "lucide-react";
import { Task } from "@/types/task";
import { isToday, isTomorrow, isPast, isFuture, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface UpcomingTasksWidgetProps {
  tasks: Task[];
}

export function UpcomingTasksWidget({ tasks }: UpcomingTasksWidgetProps) {
  const now = new Date();
  
  // Categorize tasks
  const overdueTasks = tasks.filter(t => t.due_date && isPast(startOfDay(new Date(t.due_date))) && !isToday(new Date(t.due_date)));
  const todayTasks = tasks.filter(t => t.due_date && isToday(new Date(t.due_date)));
  const upcomingTasks = tasks.filter(t => t.due_date && isFuture(new Date(t.due_date)) && !isToday(new Date(t.due_date)));

  // Combine and limit to top 5
  const displayTasks = [...overdueTasks, ...todayTasks, ...upcomingTasks].slice(0, 5);

  const getTaskStatusInfo = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return { text: "Today", className: "text-amber-500" };
    if (isTomorrow(d)) return { text: "Tomorrow", className: "text-ai-blue" };
    if (isPast(startOfDay(d))) return { text: "Overdue", className: "text-rose-500 font-semibold" };
    return { text: "Upcoming", className: "text-muted-foreground" };
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-ai-blue" />
        <h3 className="text-display font-semibold text-[15px]">Upcoming Tasks</h3>
      </div>
      
      <div className="mt-4 space-y-2">
        {displayTasks.length === 0 ? (
          <div className="text-sm text-muted-foreground py-2">
            No upcoming tasks scheduled.
          </div>
        ) : (
          displayTasks.map((t) => {
            const statusInfo = getTaskStatusInfo(t.due_date!);
            return (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-surface/60 px-3 py-2 text-[12.5px] hover:bg-surface transition-colors cursor-default">
                <div className="flex items-center gap-2 overflow-hidden">
                  {statusInfo.text === "Overdue" && <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                  <span className="truncate">{t.title}</span>
                </div>
                <span className={cn("shrink-0 ml-2", statusInfo.className)}>
                  {statusInfo.text}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
