import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/analytics")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Analytics" title="Insights into your OS." description="Usage, memory growth, AI cost, and productivity metrics." />
      <ComingSoon module="Analytics"
        description="Charts for AI usage, memory growth, agent runs, and productivity scores."
        features={["AI request volume & latency","Token & cost breakdown","Memory growth over time","Agent execution metrics","Workspace activity","Custom dashboards"]}
      />
    </ModulePage>
  );
}
