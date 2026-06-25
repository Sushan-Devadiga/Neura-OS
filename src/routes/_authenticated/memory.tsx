import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/memory")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Memory OS" title="Your second brain." description="Every interaction, structured into long-term memory." hue="ai-orange" />
      <ComingSoon module="Memory" hue="ai-orange"
        description="Chunking, embeddings, importance scoring, dedup, and a visual memory timeline."
        features={["Semantic + keyword retrieval","Importance scoring (0–1)","Duplicate detection","Project / workspace / personal scopes","Editable memory timeline","Manual memory ingestion"]}
      />
    </ModulePage>
  );
}
