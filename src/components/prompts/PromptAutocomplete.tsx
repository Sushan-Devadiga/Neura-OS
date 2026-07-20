import { useState, useEffect, useRef } from "react";
import { Prompt } from "@/types/prompt";
import { Sparkles, Command } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PromptAutocompleteProps {
  query: string;
  prompts: Prompt[];
  onSelect: (prompt: Prompt) => void;
  position: { top: number; left: number };
  onClose: () => void;
}

export function PromptAutocomplete({ query, prompts, onSelect, position, onClose }: PromptAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredPrompts = prompts.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase()) || 
    p.content.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8); // Max 8 suggestions

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredPrompts.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredPrompts.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredPrompts.length) % filteredPrompts.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        onSelect(filteredPrompts[selectedIndex]);
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [filteredPrompts, selectedIndex, onSelect, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (filteredPrompts.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute z-50 w-[300px] bg-surface/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={{ bottom: position.top, left: position.left }}
    >
      <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2 text-xs font-medium text-muted-foreground bg-background/30">
        <Command className="h-3.5 w-3.5" /> Prompt Library
      </div>
      <ScrollArea className="max-h-[240px]">
        <div className="p-1">
          {filteredPrompts.map((prompt, i) => (
            <div
              key={prompt.id}
              onClick={() => onSelect(prompt)}
              className={`px-3 py-2 rounded-lg cursor-pointer flex flex-col gap-1 transition-colors ${
                i === selectedIndex ? 'bg-ai-purple/10 text-ai-purple' : 'hover:bg-background/60 text-foreground'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="truncate">{prompt.title}</span>
              </div>
              <div className="text-xs text-muted-foreground line-clamp-1 opacity-80">
                {prompt.content}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
