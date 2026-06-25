import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader, ComingSoon } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/chat")({ component: Page });

function Page() {
  return (
    <ModulePage>
      <ModuleHeader
        eyebrow="AI Chat"
        title="Conversations with context"
        description="Multi-model streaming chat wired to your memory, knowledge graph, and agents."
        hue="ai-purple"
      />
      <ComingSoon
        module="Chat"
        hue="ai-purple"
        description="Next: streaming responses via Lovable AI Gateway, threaded conversations, model picker (Gemini 3, GPT-5.x), and inline tool calls."
        features={[
          "Streaming responses (Gemini 3 Flash default)",
          "Threaded conversations with URL routing",
          "Inline tool calls and agent handoffs",
          "Full memory + knowledge graph context",
          "File and image attachments",
          "Voice input and TTS playback",
        ]}
      />
    </ModulePage>
  );
}
