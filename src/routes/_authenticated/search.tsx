import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/search")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Search" title="Find anything." description="Hybrid keyword + semantic + graph search across your entire workspace." />
      <ComingSoon module="Search"
        description="BM25 + vector + knowledge graph traversal with a unified ranking engine."
        features={["BM25 keyword scoring","pgvector semantic search","Knowledge graph traversal","Faceted filtering","Saved searches","Ranking explainer"]}
      />
    </ModulePage>
  );
}
