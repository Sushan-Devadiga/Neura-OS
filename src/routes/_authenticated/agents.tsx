import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/agents")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Multi-Agent" title="A team that runs on AI." description="Planner, Research, Writer, Code, and Memory agents coordinated by the AI Orchestration Engine." hue="ai-green" />
      <ComingSoon module="Agents" hue="ai-green"
        description="Per-agent system prompts, tools, memory scopes, and execution traces — version-controlled like code."
        features={["Planner / Research / Writer / Code / Memory","Per-agent prompt library","Tool permission graph","Multi-agent coordination","Execution traces & metrics","Agent marketplace (custom)"]}
      />
    </ModulePage>
  );
}
