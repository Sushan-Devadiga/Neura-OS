import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/projects")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Projects" title="Your work, organized." description="Track everything you're building — with AI as your project manager." hue="ai-blue" />
      <ComingSoon module="Projects" hue="ai-blue"
        description="Kanban + list views, project memory scope, AI status updates, automated standups."
        features={["Kanban, list, and timeline views","AI-generated status updates","Per-project memory scope","Task auto-extraction from chat","Linked documents & knowledge","Templates and workflows"]}
      />
    </ModulePage>
  );
}
