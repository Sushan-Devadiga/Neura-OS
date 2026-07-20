import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FolderKanban, Brain, FileText, CheckSquare, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SearchResult = {
  id: string;
  type: "project" | "note" | "document" | "task";
  title: string;
  subtitle: string;
  linkTo: string;
  projectId?: string;
};

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const searchTerm = `%${query}%`;

      try {
        const [projectsRes, notesRes, docsRes, tasksRes] = await Promise.all([
          supabase.from("projects").select("id, name, description").ilike("name", searchTerm).limit(3),
          supabase.from("notes").select("id, title, project_id").ilike("title", searchTerm).limit(3),
          supabase.from("documents").select("id, file_name, project_id").ilike("file_name", searchTerm).limit(3),
          supabase.from("tasks").select("id, title, project_id").ilike("title", searchTerm).limit(3),
        ]);

        const combined: SearchResult[] = [];

        if (projectsRes.data) {
          projectsRes.data.forEach((p: any) => combined.push({
            id: p.id, type: "project", title: p.name, subtitle: p.description || "Project", linkTo: `/projects/${p.id}`,
          }));
        }
        if (notesRes.data) {
          notesRes.data.forEach((n: any) => combined.push({
            id: n.id, type: "note", title: n.title, subtitle: "Note", linkTo: `/projects/${n.project_id}`, projectId: n.project_id
          }));
        }
        if (docsRes.data) {
          docsRes.data.forEach((d: any) => combined.push({
            id: d.id, type: "document", title: d.file_name, subtitle: "Document", linkTo: `/projects/${d.project_id}`, projectId: d.project_id
          }));
        }
        if (tasksRes.data) {
          tasksRes.data.forEach((t: any) => combined.push({
            id: t.id, type: "task", title: t.title, subtitle: "Task", linkTo: `/projects/${t.project_id}`, projectId: t.project_id
          }));
        }

        setResults(combined);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const TYPE_CONFIG = {
    project: { icon: FolderKanban, hue: "ai-purple" },
    note: { icon: Brain, hue: "ai-orange" },
    document: { icon: FileText, hue: "ai-cyan" },
    task: { icon: CheckSquare, hue: "ai-green" },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background/80 backdrop-blur-xl border-border/60">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <DialogDescription className="sr-only">Search across projects, notes, documents, and tasks.</DialogDescription>
        
        <div className="flex items-center px-4 py-3 border-b border-border/40">
          <Search className="h-5 w-5 text-muted-foreground shrink-0 mr-3" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, notes, tasks..." 
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-10 text-base shadow-none"
            autoFocus
          />
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-3 shrink-0" />}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.trim() === "" ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              Type to start searching...
            </div>
          ) : results.length === 0 && !isSearching ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              No results found for "{query}".
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((res) => {
                const config = TYPE_CONFIG[res.type];
                const Icon = config.icon;
                return (
                  <Link
                    key={`${res.type}-${res.id}`}
                    to={res.linkTo}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface/80 transition-colors group"
                  >
                    <div 
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" 
                      style={{ background: `color-mix(in oklab, var(--color-${config.hue}) 18%, transparent)` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: `var(--color-${config.hue})` }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {res.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {res.subtitle}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
