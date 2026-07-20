import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { apiFetch } from "@/api/client";
import { Play, Settings, RefreshCw, Mail, CheckCircle2, AlertCircle, History, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/automation")({ component: Page });

type Workflow = {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  icon: any;
  hue: string;
  fields: { name: string; label: string; type: string; default?: string }[];
};

const WORKFLOWS: Workflow[] = [
  {
    id: "test",
    name: "Test Webhook",
    description: "Trigger a basic test webhook in n8n.",
    endpoint: "/n8n/test",
    icon: RefreshCw,
    hue: "ai-cyan",
    fields: [
      { name: "message", label: "Message", type: "text", default: "Hello from Neura-OS" }
    ]
  },
  {
    id: "send-email",
    name: "Send Email",
    description: "Send an email via n8n integration.",
    endpoint: "/n8n/send-email",
    icon: Mail,
    hue: "ai-orange",
    fields: [
      { name: "to", label: "To", type: "text", default: "test@example.com" },
      { name: "subject", label: "Subject", type: "text", default: "Automated Email" },
      { name: "message", label: "Message", type: "textarea", default: "This is an automated email from Neura-OS." }
    ]
  },
  {
    id: "read-inbox",
    name: "Read Inbox",
    description: "Read recent emails from inbox via n8n.",
    endpoint: "/n8n/read-inbox",
    icon: Clock,
    hue: "ai-purple",
    fields: [
      { name: "max_results", label: "Max Results", type: "number", default: "5" }
    ]
  }
];

type Execution = {
  id: string;
  workflowId: string;
  status: "success" | "error";
  result: any;
  timestamp: string;
};

function Page() {
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow>(WORKFLOWS[0]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [executions, setExecutions] = useState<Execution[]>(() => {
    try { return JSON.parse(localStorage.getItem("neura_n8n_executions") || "[]"); } catch { return []; }
  });

  const saveExecutions = (newExecutions: Execution[]) => {
    setExecutions(newExecutions);
    localStorage.setItem("neura_n8n_executions", JSON.stringify(newExecutions));
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRun = async () => {
    setIsRunning(true);
    
    // Merge defaults
    const payload: Record<string, any> = {};
    activeWorkflow.fields.forEach(f => {
      let val = formData[f.name] !== undefined ? formData[f.name] : f.default;
      if (f.type === 'number') val = parseInt(val, 10);
      payload[f.name] = val;
    });

    try {
      const resp = await apiFetch(activeWorkflow.endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      const exec: Execution = {
        id: crypto.randomUUID(),
        workflowId: activeWorkflow.id,
        status: "success",
        result: resp,
        timestamp: new Date().toISOString()
      };
      
      saveExecutions([exec, ...executions]);
      toast.success("Workflow executed successfully");
    } catch (err: any) {
      const exec: Execution = {
        id: crypto.randomUUID(),
        workflowId: activeWorkflow.id,
        status: "error",
        result: { error: err.message || "Unknown error" },
        timestamp: new Date().toISOString()
      };
      
      saveExecutions([exec, ...executions]);
      toast.error("Workflow execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  const activeExecutions = executions.filter(e => e.workflowId === activeWorkflow.id);

  return (
    <ModulePage>
      <ModuleHeader eyebrow="Automation" title="Run the world." description="Trigger n8n workflows and monitor execution history." hue="ai-cyan" />
      
      <div className="mt-8 max-w-6xl mx-auto flex gap-6 h-[calc(100vh-220px)]">
        {/* Sidebar */}
        <div className="w-72 shrink-0 bg-surface border border-border/50 rounded-2xl p-4 overflow-y-auto">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-4 px-2">Workflows</h3>
          <div className="space-y-2">
            {WORKFLOWS.map(wf => (
              <button
                key={wf.id}
                onClick={() => { setActiveWorkflow(wf); setFormData({}); }}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${activeWorkflow.id === wf.id ? "bg-background border border-border shadow-sm" : "hover:bg-background/50 border border-transparent"}`}
              >
                <div 
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg mt-0.5" 
                  style={{ background: `color-mix(in oklab, var(--color-${wf.hue}) 15%, transparent)` }}
                >
                  <wf.icon className="h-4 w-4" style={{ color: `var(--color-${wf.hue})` }} />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-foreground">{wf.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{wf.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Configure & Run */}
          <div className="bg-surface border border-border/50 rounded-2xl p-6 shrink-0">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  Configure: {activeWorkflow.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{activeWorkflow.description}</p>
              </div>
              <Button 
                onClick={handleRun} 
                disabled={isRunning}
                className="bg-ai-cyan hover:bg-ai-cyan/90 text-cyan-950 font-medium"
              >
                {isRunning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Run Workflow
              </Button>
            </div>

            <div className="space-y-4">
              {activeWorkflow.fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1.5">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea 
                      className="w-full bg-background border border-border/50 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ai-cyan min-h-[100px]"
                      value={formData[field.name] !== undefined ? formData[field.name] : field.default}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                    />
                  ) : (
                    <Input 
                      type={field.type === 'number' ? 'number' : 'text'}
                      className="bg-background max-w-md"
                      value={formData[field.name] !== undefined ? formData[field.name] : field.default}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Execution History */}
          <div className="bg-surface border border-border/50 rounded-2xl p-6 flex-1 flex flex-col overflow-hidden">
            <h2 className="text-base font-semibold flex items-center gap-2 mb-4 shrink-0">
              <History className="h-4 w-4 text-muted-foreground" />
              Execution History
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {activeExecutions.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border/50 rounded-xl">
                  No executions yet. Run the workflow to see results here.
                </div>
              ) : (
                activeExecutions.map(exec => (
                  <div key={exec.id} className="bg-background border border-border/50 rounded-xl overflow-hidden">
                    <div className="p-3 border-b flex items-center justify-between bg-surface/30">
                      <div className="flex items-center gap-2">
                        {exec.status === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-rose-500" />
                        )}
                        <span className="text-sm font-medium capitalize">{exec.status}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(exec.timestamp), 'MMM d, yyyy HH:mm:ss')}
                      </span>
                    </div>
                    <div className="p-4 bg-zinc-950 overflow-x-auto">
                      <pre className="text-xs text-zinc-300 font-mono">
                        {JSON.stringify(exec.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
