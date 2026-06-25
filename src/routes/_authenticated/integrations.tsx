import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/integrations")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Integrations" title="Plug NeuraOS into your stack." description="Connect Google, Slack, GitHub, and more." />
      <ComingSoon module="Integrations"
        description="OAuth-based integrations with major productivity tools."
        features={["Google (Calendar, Drive, Gmail)","Slack","GitHub","Notion","Linear","Webhooks & API keys"]}
      />
    </ModulePage>
  );
}
