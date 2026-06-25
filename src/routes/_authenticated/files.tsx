import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/files")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader eyebrow="Files" title="Everything, in one place." description="Documents, images, and assets — indexed and searchable." />
      <ComingSoon module="Files"
        description="Upload, organize, preview, and search across files. PDFs and docs parsed into memory."
        features={["Drag & drop uploads","Folders & tags","PDF / DOCX parsing","Image previews","Full-text + semantic search","Shared workspace files"]}
      />
    </ModulePage>
  );
}
