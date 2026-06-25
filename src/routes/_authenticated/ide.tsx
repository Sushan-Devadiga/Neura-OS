import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/ide")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="AI IDE" title="Code, with your second brain." description="Editor with AI completions, refactors, and agent runs." />
      <ComingSoon module="AI IDE"
        description="Monaco-based editor, file tree, terminal, AI co-pilot grounded in your knowledge."
        features={["Monaco editor","File tree & search","Terminal","AI completions & refactors","Code-aware memory","Run agents on selections"]}
      />
    </ModulePage>
  );
}
