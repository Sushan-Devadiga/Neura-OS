import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Copy, Check, AlertCircle, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiFetch } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatInterfaceProps {
  projectId: string;
  defaultSessionId?: string;
}

const AGENTS = [
  { id: "general", name: "General Assistant" },
  { id: "coder", name: "Code Assistant" },
  { id: "writer", name: "Writing Assistant" },
];

export function ChatInterface({ projectId, defaultSessionId }: ChatInterfaceProps) {
  const [sessionId, setSessionId] = useState<string>(defaultSessionId || crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [agentId, setAgentId] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHistory() {
      setIsFetchingHistory(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setMessages(
            data.map((m: any) => ({
              id: m.id,
              role: m.role as "user" | "assistant" | "system",
              content: m.content,
            }))
          );
        } else {
          // Welcome message
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: "Hello! I am your AI assistant. How can I help you today?",
            }
          ]);
        }
      } catch (err: any) {
        toast.error("Failed to load conversation history.");
      } finally {
        setIsFetchingHistory(false);
      }
    }
    loadHistory();
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent, retryMessage?: string) => {
    e?.preventDefault();
    const msgText = retryMessage || input.trim();
    if (!msgText || isLoading) return;

    if (!retryMessage) {
      setInput("");
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: msgText },
      ]);
    }
    
    setIsLoading(true);

    try {
      const response = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          chat_session_id: sessionId,
          message: msgText,
          agent_id: agentId,
        }),
      });

      if (response.status === "requires_confirmation") {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "system",
            content: `**Tool Execution Requires Confirmation**\n\nTool: \`${response.tool_name}\`\n\nMessage: ${response.message}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: response.message },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: `**Error:** Failed to get response. \n\n${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMessage) {
      const lastUserIndex = messages.lastIndexOf(lastUserMessage);
      setMessages(messages.slice(0, lastUserIndex + 1));
      handleSubmit(undefined, lastUserMessage.content);
    }
  };

  if (isFetchingHistory) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[600px] flex-col bg-surface rounded-2xl border overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-ai-purple" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        <div>
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Select Agent" />
            </SelectTrigger>
            <SelectContent>
              {AGENTS.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
            <Bot className="h-5 w-5" />
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background/50 backdrop-blur-sm border-t">
        <form 
          onSubmit={handleSubmit}
          className="flex items-center gap-2 relative max-w-4xl mx-auto"
        >
          {messages.length > 0 && messages[messages.length - 1].role === "system" && messages[messages.length - 1].content.includes("Error") && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleRetry}
              title="Retry last message"
              className="shrink-0 text-amber-500 hover:text-amber-600"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-surface"
            disabled={isLoading}
            autoFocus
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isLoading}
            className="shrink-0 bg-ai-purple hover:bg-ai-purple/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isUser ? "bg-primary text-primary-foreground" : isSystem ? "bg-amber-500/20 text-amber-500" : "bg-ai-purple/20 text-ai-purple"}`}>
        {isUser ? <User className="h-5 w-5" /> : isSystem ? <AlertCircle className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>
      
      <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${isUser ? "bg-primary text-primary-foreground" : isSystem ? "bg-amber-500/10 border border-amber-500/20 text-foreground" : "glass text-foreground"}`}>
        <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed text-[14px]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const isCodeBlock = !inline && match;
                
                return isCodeBlock ? (
                  <CodeBlock language={match[1]} value={String(children).replace(/\n$/, "")} />
                ) : (
                  <code className="bg-black/10 dark:bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-lg bg-zinc-950 overflow-hidden border border-zinc-800">
      <div className="flex items-center justify-between bg-zinc-900 px-4 py-1.5 text-xs text-zinc-400">
        <span>{language || "code"}</span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 hover:text-zinc-100 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="text-[13px] leading-relaxed text-zinc-100 font-mono m-0 bg-transparent p-0">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}
