import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/documents")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Documents" title="Long-form, intelligent." description="Drafts, specs, and docs with AI woven in." />
      <ComingSoon module="Documents"
        description="Rich documents with AI co-writing, version history, comments, and exports."
        features={["Rich-text editor with AI co-write","Version history","Inline comments & suggestions","Export PDF / DOCX / MD","Shared with workspace","Indexed into memory"]}
      />
    </ModulePage>
  );
}
