import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "@/api/client";
import { ChatMessage as IChatMessage } from "@/types/chat";
import { Prompt } from "@/types/prompt";
import { ChatMessage } from "./ChatMessage";
import { PromptAutocomplete } from "@/components/prompts/PromptAutocomplete";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Agent } from "@/types/agent";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatAreaProps {
  sessionId: string;
  projectId: string;
}

export function ChatArea({ sessionId, projectId }: ChatAreaProps) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  
  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [promptQuery, setPromptQuery] = useState("");
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedAgentId, setSelectedAgentId] = useState<string>("general");
  const [confirmationData, setConfirmationData] = useState<{tool_name: string, tool_args: any, message: string} | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  
  useEffect(() => {
    const preferred = localStorage.getItem('preferred_agent');
    if (preferred) setSelectedAgentId(preferred);
  }, []);

  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await apiFetch("/agents");
      return res as Agent[];
    }
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat_messages", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as IChatMessage[];
    },
  });

  // Fetch prompts
  const { data: prompts } = useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      try {
        const res = await apiFetch("/prompts");
        return (res?.data || []) as Prompt[];
      } catch (err) {
        return [];
      }
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      // Instead of saving directly to Supabase from the frontend, 
      // we send it to the FastAPI backend which handles everything.
      const res = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          chat_session_id: sessionId,
          message: content,
          agent_id: selectedAgentId
        })
      });

      return res;
    },
    onMutate: async (content) => {
      // Optimistic update for the user's message could go here
    },
    onSuccess: (data) => {
      if (data && data.status === "requires_confirmation") {
        setConfirmationData(data);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["chat_messages", sessionId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    }
  });

  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending) return;
    const msg = input;
    setInput("");
    setShowAutocomplete(false);
    sendMessageMutation.mutate(msg);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    // Detect if we are typing a prompt shortcut
    const lastSlashIndex = val.lastIndexOf("/");
    if (lastSlashIndex !== -1 && (lastSlashIndex === 0 || val[lastSlashIndex - 1] === " " || val[lastSlashIndex - 1] === "\n")) {
      const query = val.slice(lastSlashIndex + 1);
      if (!query.includes(" ")) {
        setShowAutocomplete(true);
        setPromptQuery(query);
        // Position autocomplete
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect();
          setAutocompletePosition({ top: rect.height + 10, left: 16 });
        }
        return;
      }
    }
    setShowAutocomplete(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showAutocomplete) {
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter" || e.key === "Escape") {
        // Let the autocomplete handle these
        return;
      }
    }
    
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Variable Substitution
  const handleSelectPrompt = async (prompt: Prompt) => {
    setShowAutocomplete(false);
    let resolvedContent = prompt.content;
    
    try {
      // Fetch latest context for variables if needed
      const needsProject = resolvedContent.includes("{{project_name}}");
      const needsTask = resolvedContent.includes("{{current_task}}");
      const needsNote = resolvedContent.includes("{{selected_note}}");
      const needsDoc = resolvedContent.includes("{{selected_document}}");
      const needsMemory = resolvedContent.includes("{{current_memory}}");

      if (needsProject) {
        const { data } = await supabase.from("projects").select("name").eq("id", projectId).single();
        if (data) resolvedContent = resolvedContent.replace(/\{\{project_name\}\}/g, data.name);
      }
      if (needsTask) {
        const { data } = await supabase.from("tasks").select("title, description").eq("project_id", projectId).order("updated_at", { ascending: false }).limit(1).single();
        if (data) resolvedContent = resolvedContent.replace(/\{\{current_task\}\}/g, `${data.title}: ${data.description || ''}`);
      }
      if (needsNote) {
        const { data } = await supabase.from("notes").select("title, content").eq("project_id", projectId).order("updated_at", { ascending: false }).limit(1).single();
        if (data) resolvedContent = resolvedContent.replace(/\{\{selected_note\}\}/g, `${data.title}\n${data.content}`);
      }
      if (needsDoc) {
        const { data: docData } = await supabase.from("documents").select("id, title").eq("project_id", projectId).order("updated_at", { ascending: false }).limit(1).single();
        if (docData) {
          const { data: chunks } = await supabase.from("document_chunks").select("content").eq("document_id", docData.id).order("chunk_index");
          const docContent = chunks ? chunks.map(c => c.content).join("\n\n") : "";
          resolvedContent = resolvedContent.replace(/\{\{selected_document\}\}/g, `${docData.title}\n${docContent}`);
        }
      }
      if (needsMemory) {
        const { data } = await supabase.from("memories").select("content").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).single();
        if (data) resolvedContent = resolvedContent.replace(/\{\{current_memory\}\}/g, data.content);
      }
    } catch (err) {
      console.error("Failed to resolve prompt variables", err);
    }

    // Replace the /query text with the resolved prompt
    const lastSlashIndex = input.lastIndexOf("/");
    const newInput = input.substring(0, lastSlashIndex) + resolvedContent;
    setInput(newInput);
    textareaRef.current?.focus();
  };

  const handleConfirmTool = async () => {
    if (!confirmationData) return;
    setIsConfirming(true);
    try {
      const res = await apiFetch("/tools/execute", {
        method: "POST",
        body: JSON.stringify({
          tool_name: confirmationData.tool_name,
          args: { ...confirmationData.tool_args, user_confirmed: true }
        })
      });
      
      toast.success("Action executed successfully.");
      
      // Let AI know it's done
      sendMessageMutation.mutate(`I have confirmed the action (${confirmationData.tool_name}) and it was executed successfully.`);
    } catch (e: any) {
      toast.error(e.message || "Failed to confirm action");
    } finally {
      setIsConfirming(false);
      setConfirmationData(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-14rem)] bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar relative">
        <div className="max-w-3xl mx-auto w-full mb-6 flex justify-end sticky top-0 z-20">
          <Select value={selectedAgentId} onValueChange={(val) => {
            setSelectedAgentId(val);
            localStorage.setItem('preferred_agent', val);
          }}>
            <SelectTrigger className="w-[180px] h-8 text-xs bg-surface/50 border-white/10 backdrop-blur-md rounded-full">
              <SelectValue placeholder="Select Agent" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-white/10">
              {agents?.map(agent => (
                <SelectItem key={agent.id} value={agent.id} className="text-xs focus:bg-white/10">
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages?.length === 0 && !sendMessageMutation.isPending ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <div className="h-16 w-16 rounded-2xl gradient-signature grid place-items-center mb-6 text-white">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">How can I help you?</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              I'm your AI assistant for this project. Ask me to draft docs, summarize notes, or manage tasks.
            </p>
          </div>
        ) : (
          <div className="flex flex-col max-w-3xl mx-auto w-full">
            {messages?.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {/* Loading Indicator for AI Response */}
            {sendMessageMutation.isPending && (
              <div className="flex gap-4 w-full py-6 justify-start">
                <div className="shrink-0 mt-1 h-8 w-8 rounded-full gradient-signature place-items-center grid text-white shadow-md animate-pulse">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="relative max-w-[85%] group flex items-center">
                  <div className="flex gap-1 items-center px-2">
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border/40 bg-surface/30 relative">
        {showAutocomplete && prompts && (
          <PromptAutocomplete 
            query={promptQuery}
            prompts={prompts}
            onSelect={handleSelectPrompt}
            onClose={() => setShowAutocomplete(false)}
            position={autocompletePosition}
          />
        )}
        <div className="max-w-3xl mx-auto relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Send a message... Type '/' for prompts"
            disabled={sendMessageMutation.isPending}
            className="pr-24 py-4 min-h-[60px] max-h-[200px] resize-none rounded-xl bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-ai-purple/50 shadow-sm"
            rows={1}
          />
          <div className="absolute right-3 top-3 flex gap-2">
            <Button 
              size="icon" 
              onClick={handleSend}
              disabled={!input.trim() || sendMessageMutation.isPending}
              className="h-8 w-8 rounded-lg gradient-signature border-0 shadow-sm transition-all"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="text-center mt-2">
          <span className="text-[10px] text-muted-foreground">
            AI can make mistakes. Consider verifying important information.
          </span>
        </div>
      </div>

      <AlertDialog open={!!confirmationData} onOpenChange={(open) => !open && setConfirmationData(null)}>
        <AlertDialogContent className="bg-surface border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation Required</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationData?.message || "The AI is trying to perform an action that requires your explicit confirmation."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming} className="bg-surface-light border-border hover:bg-surface-light/80">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmTool} disabled={isConfirming} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Action"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
