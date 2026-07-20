import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, FolderKanban, Brain, FileText, CheckSquare, Loader2, ArrowRight, Database, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/search")({ component: Page });

type SearchResult = {
  id: string;
  type: "project" | "note" | "document" | "task" | "memory";
  title: string;
  subtitle: string;
  linkTo: string;
};

const TYPE_CONFIG = {
  project: { icon: FolderKanban, hue: "ai-purple", label: "Projects" },
  note: { icon: Brain, hue: "ai-orange", label: "Notes" },
  document: { icon: FileText, hue: "ai-cyan", label: "Documents" },
  task: { icon: CheckSquare, hue: "ai-green", label: "Tasks" },
  memory: { icon: Database, hue: "ai-pink", label: "Memories" },
};

function Page() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("neura_recent_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("neura_recent_searches", JSON.stringify(updated));
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const searchTerm = `%${query}%`;

      try {
        const [projectsRes, notesRes, docsRes, tasksRes, memRes] = await Promise.all([
          supabase.from("projects").select("id, name, description").ilike("name", searchTerm).limit(10),
          supabase.from("notes").select("id, title, project_id").ilike("title", searchTerm).limit(10),
          supabase.from("documents").select("id, file_name, project_id").ilike("file_name", searchTerm).limit(10),
          supabase.from("tasks").select("id, title, project_id").ilike("title", searchTerm).limit(10),
          supabase.from("memories").select("id, content, project_id").ilike("content", searchTerm).limit(10),
        ]);

        const combined: SearchResult[] = [];

        if (projectsRes.data) {
          projectsRes.data.forEach((p: any) => combined.push({
            id: p.id, type: "project", title: p.name, subtitle: p.description || "Project", linkTo: `/projects/${p.id}`,
          }));
        }
        if (notesRes.data) {
          notesRes.data.forEach((n: any) => combined.push({
            id: n.id, type: "note", title: n.title, subtitle: "Note", linkTo: `/projects/${n.project_id}`,
          }));
        }
        if (docsRes.data) {
          docsRes.data.forEach((d: any) => combined.push({
            id: d.id, type: "document", title: d.file_name, subtitle: "Document", linkTo: `/projects/${d.project_id}`,
          }));
        }
        if (tasksRes.data) {
          tasksRes.data.forEach((t: any) => combined.push({
            id: t.id, type: "task", title: t.title, subtitle: "Task", linkTo: `/projects/${t.project_id}`,
          }));
        }
        if (memRes.data) {
          memRes.data.forEach((m: any) => combined.push({
            id: m.id, type: "memory", title: m.content.substring(0, 50) + (m.content.length > 50 ? "..." : ""), subtitle: "Memory", linkTo: `/projects/${m.project_id}`,
          }));
        }

        setResults(combined);
        saveRecentSearch(query.trim());
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const filteredResults = activeFilter === "all" ? results : results.filter(r => r.type === activeFilter);
  
  // Group results by type
  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const filters = [
    { id: "all", label: "All" },
    { id: "project", label: "Projects" },
    { id: "note", label: "Notes" },
    { id: "document", label: "Documents" },
    { id: "task", label: "Tasks" },
    { id: "memory", label: "Memories" }
  ];

  return (
    <ModulePage>
      <ModuleHeader eyebrow="Search" title="Find anything." description="Hybrid keyword search across your entire workspace." hue="ai-cyan" />
      
      <div className="mt-8 space-y-6 max-w-4xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, notes, tasks, documents, memories..." 
            className="pl-12 h-16 text-lg rounded-2xl bg-surface border-border/50 shadow-sm"
            autoFocus
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === f.id ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-surface/80 text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {query.trim() === "" ? (
          recentSearches.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Recent Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map(term => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 rounded-lg bg-surface border border-border/50 text-sm hover:bg-surface/80 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )
        ) : filteredResults.length === 0 && !isSearching ? (
          <div className="text-center py-20 text-muted-foreground">
            No results found for "{query}". Try a different term or filter.
          </div>
        ) : (
          <div className="space-y-8 pt-4">
            {Object.entries(groupedResults).map(([type, items]) => {
              const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
              const Icon = config.icon;
              return (
                <div key={type} className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: `var(--color-${config.hue})` }} />
                    {config.label} ({items.length})
                  </h3>
                  <div className="grid gap-2">
                    {items.map(res => (
                      <Link
                        key={`${res.type}-${res.id}`}
                        to={res.linkTo}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface/50 border border-border/30 hover:bg-surface hover:border-border/60 transition-all group"
                      >
                        <div 
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" 
                          style={{ background: `color-mix(in oklab, var(--color-${config.hue}) 15%, transparent)` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: `var(--color-${config.hue})` }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-medium text-foreground truncate">
                            {res.title}
                          </div>
                          <div className="text-[13px] text-muted-foreground truncate">
                            {res.subtitle}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModulePage>
  );
}
