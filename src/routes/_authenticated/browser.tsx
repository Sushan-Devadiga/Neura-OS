import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/browser")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Browser" title="Web-aware AI." description="Browse and capture pages directly into your memory." />
      <ComingSoon module="Browser"
        description="Embedded reader, page-to-memory clipping, web search agent."
        features={["Clean reader view","Clip page → memory","Web search agent","Citation tracking","Domain allowlist","Per-page chat"]}
      />
    </ModulePage>
  );
}
