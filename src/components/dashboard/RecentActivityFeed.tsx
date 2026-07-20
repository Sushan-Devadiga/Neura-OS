import { Clock, MessageSquare, Brain, CheckSquare, FolderKanban, FileText, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type ActivityType = "project" | "note" | "document" | "task" | "chat";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  updated_at: string;
  project_id?: string;
}

interface RecentActivityFeedProps {
  activities: ActivityItem[];
}

const TYPE_CONFIG = {
  project: { icon: FolderKanban, hue: "ai-purple", label: "Project updated" },
  note: { icon: Brain, hue: "ai-orange", label: "Note updated" },
  document: { icon: FileText, hue: "ai-cyan", label: "Document uploaded" },
  task: { icon: CheckSquare, hue: "ai-green", label: "Task updated" },
  chat: { icon: MessageSquare, hue: "ai-pink", label: "Chat session" },
};

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  return (
    <div className="glass rounded-2xl p-5 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-display font-semibold text-[15px]">Recent activity</h3>
      </div>
      
      <div className="mt-4 space-y-2.5">
        {activities.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">
            No recent activity found.
          </div>
        ) : (
          activities.map((activity) => {
            const config = TYPE_CONFIG[activity.type];
            const Icon = config.icon;
            
            return (
              <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-surface/60 transition group cursor-default">
                <div 
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg mt-0.5" 
                  style={{ background: `color-mix(in oklab, var(--color-${config.hue}) 18%, transparent)` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: `var(--color-${config.hue})` }} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13px] font-medium text-foreground truncate">
                      {activity.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(activity.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="text-[12px] text-muted-foreground truncate mt-0.5">
                    {config.label} &bull; {activity.description}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
