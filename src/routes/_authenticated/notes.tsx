import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/notes")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Notes" title="Think in writing." description="Rich notes that auto-link to your knowledge graph." />
      <ComingSoon module="Notes"
        description="Block-based editor, backlinks, AI completions, semantic search, and auto-tagging."
        features={["Block-based editor","Backlinks & graph view","AI continue / rewrite","Auto-tagging & entity extraction","Embeds & code blocks","Real-time collaboration"]}
      />
    </ModulePage>
  );
}
