import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/tasks")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Tasks" title="Get it done." description="Tasks auto-extracted, prioritized, and scheduled by AI." />
      <ComingSoon module="Tasks"
        description="Recurring tasks, smart prioritization, time-blocking via calendar integration, and natural-language input."
        features={["Natural language task entry","AI prioritization","Recurring & dependent tasks","Time-blocking integration","Per-project filtering","Bulk operations"]}
      />
    </ModulePage>
  );
}
