import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/calendar")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Calendar" title="Time, in context." description="Your schedule cross-linked with tasks, projects, and memories." />
      <ComingSoon module="Calendar"
        description="Day, week, month views, AI scheduling, meeting prep briefs, and post-meeting capture."
        features={["Day / week / month views","AI scheduling assistant","Pre-meeting briefs","Post-meeting capture → memory","Google Calendar sync","Time-blocking from tasks"]}
      />
    </ModulePage>
  );
}
