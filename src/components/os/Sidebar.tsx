import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, MessageSquare, FolderKanban, CheckSquare, FileText, Files,
  Network, Brain, Sparkles, Workflow, Bot, Calendar, Globe, Code2, BarChart3,
  Plug, Settings, BookMarked,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: typeof LayoutDashboard; hue?: string };

const groups: { label: string; items: Item[] }[] = [
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/chat", label: "AI Chat", icon: MessageSquare, hue: "ai-purple" },
      { to: "/search", label: "Search", icon: Sparkles },
    ],
  },
  {
    label: "Build",
    items: [
      { to: "/projects", label: "Projects", icon: FolderKanban },
      { to: "/tasks", label: "Tasks", icon: CheckSquare },
      { to: "/notes", label: "Notes", icon: FileText },
      { to: "/documents", label: "Documents", icon: Files },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/knowledge", label: "Knowledge Graph", icon: Network, hue: "ai-cyan" },
      { to: "/memory", label: "Memory", icon: Brain, hue: "ai-orange" },
      { to: "/prompts", label: "Prompt Library", icon: BookMarked },
      { to: "/agents", label: "Agents", icon: Bot, hue: "ai-green" },
      { to: "/automation", label: "Automation", icon: Workflow, hue: "ai-pink" },
    ],
  },
  {
    label: "Life",
    items: [
      { to: "/calendar", label: "Calendar", icon: Calendar },
      { to: "/files", label: "Files", icon: Files },
      { to: "/browser", label: "Browser", icon: Globe },
      { to: "/ide", label: "AI IDE", icon: Code2 },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/integrations", label: "Integrations", icon: Plug },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function OSSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex h-full w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-2xl">
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border/60">
        <Link to="/dashboard"><Logo /></Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
              {group.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full gradient-signature" />
                    )}
                    <Icon
                      className={cn(
                        "h-[15px] w-[15px] transition-colors",
                        active && item.hue ? `text-${item.hue}` : "",
                      )}
                      style={active && item.hue ? { color: `var(--color-${item.hue})` } : undefined}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border/60 p-3">
        <div className="glass rounded-xl p-3">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-ai-green animate-ai-pulse" />
            AI Online · Gemini 3 Flash
          </div>
        </div>
      </div>
    </aside>
  );
}
