import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { ChatInterface } from "@/components/chat/ChatInterface";

export const Route = createFileRoute("/_authenticated/chat")({ component: Page });

function Page() {
  // Use a default project ID for the global chat. 
  // In a real app, this might come from a context or standard settings.
  const DEFAULT_PROJECT = "00000000-0000-0000-0000-000000000000";

  return (
    <ModulePage>
      <ModuleHeader
        eyebrow="AI Chat"
        title="Conversations with context"
        description="Multi-model streaming chat wired to your memory, knowledge graph, and agents."
        hue="ai-purple"
      />
      
      <div className="flex-1 mt-6">
        <ChatInterface projectId={DEFAULT_PROJECT} />
      </div>
    </ModulePage>
  );
}
