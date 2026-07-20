import { motion } from "framer-motion";
import { FolderKanban, Brain, FileText, CheckSquare, TrendingUp, MessageSquare } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    projects: number;
    notes: number;
    documents: number;
    tasks: number;
    chats: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    { icon: FolderKanban, label: "Active Projects", value: stats.projects, hue: "ai-purple" },
    { icon: CheckSquare, label: "Tasks", value: stats.tasks, hue: "ai-blue" },
    { icon: Brain, label: "Notes", value: stats.notes, hue: "ai-orange" },
    { icon: FileText, label: "Documents", value: stats.documents, hue: "ai-cyan" },
    { icon: MessageSquare, label: "Chats", value: stats.chats, hue: "ai-pink" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {statItems.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, delay: 0.05 * i }}
          className="glass rounded-2xl p-4 transition-all hover:bg-white/5"
        >
          <div className="flex items-center justify-between">
            <s.icon className="h-4 w-4" style={{ color: `var(--color-${s.hue})` }} />
            <TrendingUp className="h-3 w-3 text-muted-foreground opacity-50" />
          </div>
          <div className="mt-3 text-display text-2xl font-semibold">
            {s.value}
          </div>
          <div className="text-[11.5px] text-muted-foreground mt-0.5">{s.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
