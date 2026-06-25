import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/knowledge")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Knowledge Graph" title="Your ideas, connected." description="Entities and relationships, visually traversable." hue="ai-cyan" />
      <ComingSoon module="Knowledge Graph" hue="ai-cyan"
        description="NER, relationship extraction, force-directed graph view, and graph-aware retrieval."
        features={["Auto entity extraction (NER)","Relationship inference","Force-directed graph view","Node detail panels","Graph-aware retrieval in chat","Manual node editing"]}
      />
    </ModulePage>
  );
}
