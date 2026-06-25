import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, MessageSquare, FolderKanban, CheckSquare, FileText, Network, Brain,
  Bot, Workflow, Calendar, Settings, Sparkles, Search as SearchIcon,
} from "lucide-react";

type Ctx = { open: () => void; close: () => void; toggle: () => void };
const CommandPaletteCtx = createContext<Ctx | null>(null);

export function useCommandPalette() {
  const c = useContext(CommandPaletteCtx);
  if (!c) throw new Error("CommandPalette context missing");
  return c;
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ctx: Ctx = {
    open: useCallback(() => setOpen(true), []),
    close: useCallback(() => setOpen(false), []),
    toggle: useCallback(() => setOpen((v) => !v), []),
  };

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <CommandPaletteCtx.Provider value={ctx}>
      {children}
      <CommandDialog open={isOpen} onOpenChange={setOpen}>
        <Command className="bg-elevated/95">
          <CommandInput placeholder="Search, navigate, or ask NeuraOS…" />
          <CommandList className="max-h-[420px]">
            <CommandEmpty>No results. Try a different query.</CommandEmpty>
            <CommandGroup heading="Ask AI">
              <CommandItem onSelect={() => go("/chat")}>
                <Sparkles className="mr-2 h-4 w-4 text-ai-purple" />
                Start a new AI conversation
              </CommandItem>
              <CommandItem onSelect={() => go("/search")}>
                <SearchIcon className="mr-2 h-4 w-4" />
                Hybrid search across your workspace
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Navigate">
              <CommandItem onSelect={() => go("/dashboard")}><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</CommandItem>
              <CommandItem onSelect={() => go("/chat")}><MessageSquare className="mr-2 h-4 w-4" />AI Chat</CommandItem>
              <CommandItem onSelect={() => go("/projects")}><FolderKanban className="mr-2 h-4 w-4" />Projects</CommandItem>
              <CommandItem onSelect={() => go("/tasks")}><CheckSquare className="mr-2 h-4 w-4" />Tasks</CommandItem>
              <CommandItem onSelect={() => go("/notes")}><FileText className="mr-2 h-4 w-4" />Notes</CommandItem>
              <CommandItem onSelect={() => go("/knowledge")}><Network className="mr-2 h-4 w-4" />Knowledge Graph</CommandItem>
              <CommandItem onSelect={() => go("/memory")}><Brain className="mr-2 h-4 w-4" />Memory</CommandItem>
              <CommandItem onSelect={() => go("/agents")}><Bot className="mr-2 h-4 w-4" />Agents</CommandItem>
              <CommandItem onSelect={() => go("/automation")}><Workflow className="mr-2 h-4 w-4" />Automation</CommandItem>
              <CommandItem onSelect={() => go("/calendar")}><Calendar className="mr-2 h-4 w-4" />Calendar</CommandItem>
              <CommandItem onSelect={() => go("/settings")}><Settings className="mr-2 h-4 w-4" />Settings</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </CommandPaletteCtx.Provider>
  );
}
