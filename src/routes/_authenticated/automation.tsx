import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/automation")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Automation" title="Workflows that think." description="Trigger on events, memory updates, or natural language." hue="ai-pink" />
      <ComingSoon module="Automation" hue="ai-pink"
        description="Visual workflow builder, webhooks, scheduled jobs, integrations, and execution logs."
        features={["Visual workflow builder","Triggers: schedule, webhook, memory","Integrations: Slack, GitHub, Drive, Calendar","Retry & error handling","Run history & logs","Templates library"]}
      />
    </ModulePage>
  );
}
