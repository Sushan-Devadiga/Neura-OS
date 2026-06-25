import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/prompts")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Prompt Library" title="Prompts, version-controlled." description="Reusable prompts and agent specs managed like source code." />
      <ComingSoon module="Prompts"
        description="Per-prompt versioning, variables, evaluations, and shared library."
        features={["Versioned prompts","Variables & templating","Inline evaluations","Tag & search","Shared with workspace","Agent system-prompt registry"]}
      />
    </ModulePage>
  );
}
