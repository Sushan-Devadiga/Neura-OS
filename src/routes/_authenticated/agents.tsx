import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { useQuery } from "@tanstack/react-query";
import { Agent } from "@/types/agent";
import { apiFetch } from "@/api/client";
import { Bot, Code2, Search, PenTool, Calendar, CheckSquare, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/agents")({ component: Page });

const IconMap: Record<string, React.ElementType> = {
  Bot: Bot,
  Code2: Code2,
  Search: Search,
  PenTool: PenTool,
  Calendar: Calendar,
  CheckSquare: CheckSquare,
};

function Page() {
  const navigate = useNavigate();
  
  const { data: agents, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await apiFetch("/agents");
      return res as Agent[];
    }
  });

  return (
    <ModulePage>
      <ModuleHeader
        eyebrow="Agents"
        title="AI Operating System"
        description="Choose a specialized AI agent to assist you with your tasks."
        hue="ai-blue"
      />
      
      <div className="p-8 h-full overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-ai-blue" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
            {agents?.map((agent) => {
              const Icon = IconMap[agent.icon] || Bot;
              return (
                <div 
                  key={agent.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface/30 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-surface/50 hover:shadow-2xl hover:shadow-black/50 p-6 cursor-pointer"
                  onClick={() => {
                    localStorage.setItem('preferred_agent', agent.id);
                    localStorage.setItem('open_ai_chat', 'true');
                    navigate({ to: "/projects" });
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${agent.color}, transparent 70%)` }}
                  />
                  
                  <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div 
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 shadow-inner"
                      style={{ color: agent.color }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">{agent.name}</h3>
                      <p className="text-xs text-muted-foreground">{agent.model}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-foreground/80 mb-6 flex-1 relative z-10">
                    {agent.description}
                  </p>
                  
                  <div className="space-y-4 mb-6 relative z-10 flex-1">
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Specialization</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.specialization.map(spec => (
                          <span key={spec} className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-foreground/80 border border-white/10">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Available Tools</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.available_tools.map(tool => (
                          <span key={tool} className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-foreground/80 border border-white/10">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-white/5 relative z-10">
                    <Button 
                      className="w-full justify-between bg-white/5 hover:bg-white/10 text-foreground border border-white/5 transition-colors group-hover:bg-white/10"
                      variant="ghost"
                    >
                      <span>Chat with {agent.name.split(' ')[0]}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModulePage>
  );
}
