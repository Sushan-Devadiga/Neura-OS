import { useState } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatArea } from "./ChatArea";
import { Sparkles } from "lucide-react";

interface AIChatTabProps {
  projectId: string;
}

export function AIChatTab({ projectId }: AIChatTabProps) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  return (
    <div className="flex border border-border/60 rounded-2xl overflow-hidden bg-surface/10 shadow-sm mt-4">
      <ChatSidebar 
        projectId={projectId} 
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
      />
      
      {activeSessionId ? (
        <ChatArea sessionId={activeSessionId} projectId={projectId} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 p-8">
          <div className="h-16 w-16 rounded-2xl gradient-signature grid place-items-center mb-6 text-white shadow-md">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">AI Project Assistant</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Select a chat from the sidebar or start a new one to interact with the AI assistant for this project.
          </p>
        </div>
      )}
    </div>
  );
}
