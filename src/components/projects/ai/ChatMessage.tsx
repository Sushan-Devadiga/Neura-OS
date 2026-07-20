import { ChatMessage as IChatMessage } from "@/types/chat";
import { Sparkles, User, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ChatMessageProps {
  message: IChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex gap-4 w-full py-6", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="shrink-0 mt-1 h-8 w-8 rounded-full gradient-signature place-items-center grid text-white shadow-md">
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      <div className={cn(
        "relative max-w-[85%] group",
        isUser ? "bg-surface border border-border/50 rounded-2xl px-5 py-4" : ""
      )}>
        <div className={cn("prose prose-sm dark:prose-invert max-w-none", isUser ? "text-foreground" : "")}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
        
        {!isUser && (
          <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleCopy}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface transition-colors flex items-center gap-1 text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="shrink-0 mt-1 h-8 w-8 rounded-full bg-surface border place-items-center grid text-muted-foreground shadow-sm">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
