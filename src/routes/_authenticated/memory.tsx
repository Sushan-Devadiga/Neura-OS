import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { apiFetch } from "@/api/client";
import { supabase } from "@/integrations/supabase/client";
import { Database, Plus, Search, Pin, Archive, Trash, Edit2, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/memory")({ component: Page });

type Memory = {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  category: string;
  importance: string;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

function Page() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pinned" | "archived">("all");
  
  // Create / Edit state
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formContent, setFormContent] = useState("");
  const [formImportance, setFormImportance] = useState("medium");
  const [formCategory, setFormCategory] = useState("fact");

  useEffect(() => {
    loadMemories();
  }, []);

  const getProjectId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");

    let { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id")
      .limit(1);

    if (projectsError) throw projectsError;
    
    let projectId = projects?.[0]?.id;

    if (!projectId) {
      const { data: newProject, error: createProjectError } = await supabase
        .from("projects")
        .insert({ name: "Personal", user_id: session.user.id })
        .select("id")
        .single();
        
      if (createProjectError) throw createProjectError;
      projectId = newProject.id;
    }
    return projectId;
  };

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const projectId = await getProjectId();
      const resp = await apiFetch(`/memories/project/${projectId}`);
      setMemories(resp.data || []);
    } catch (err) {
      toast.error("Failed to load memories.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formContent.trim()) return;
    try {
      const projectId = await getProjectId();
      const resp = await apiFetch("/memories", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          content: formContent,
          importance: formImportance,
          category: formCategory
        })
      });
      if (resp.data) {
        setMemories([resp.data, ...memories]);
        toast.success("Memory created");
      }
      setIsCreating(false);
      resetForm();
    } catch (err) {
      toast.error("Failed to create memory");
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Memory>) => {
    try {
      // Optimistic update
      setMemories(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      
      const resp = await apiFetch(`/memories/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates)
      });
      
      if (resp.data) {
        setMemories(prev => prev.map(m => m.id === id ? resp.data : m));
      }
      
      if (editingId === id) {
        setEditingId(null);
        toast.success("Memory updated");
      }
    } catch (err) {
      toast.error("Failed to update memory");
      loadMemories(); // Revert
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this memory forever?")) return;
    try {
      setMemories(prev => prev.filter(m => m.id !== id));
      await apiFetch(`/memories/${id}`, { method: "DELETE" });
      toast.success("Memory deleted");
    } catch (err) {
      toast.error("Failed to delete memory");
      loadMemories(); // Revert
    }
  };

  const resetForm = () => {
    setFormContent("");
    setFormImportance("medium");
    setFormCategory("fact");
  };

  const startEdit = (m: Memory) => {
    setEditingId(m.id);
    setFormContent(m.content);
    setFormImportance(m.importance || "medium");
    setFormCategory(m.category || "fact");
  };

  const saveEdit = () => {
    if (editingId) {
      handleUpdate(editingId, { content: formContent, importance: formImportance, category: formCategory });
    }
  };

  const getImportanceColor = (imp: string) => {
    switch(imp) {
      case "high": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "low": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const filteredMemories = memories.filter(m => {
    const matchesSearch = m.content.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filter === "pinned") return m.is_pinned && !m.is_archived;
    if (filter === "archived") return m.is_archived;
    return !m.is_archived;
  }).sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <ModulePage>
      <ModuleHeader eyebrow="Memory OS" title="Your second brain." description="Every interaction, structured into long-term memory." hue="ai-orange" />
      
      <div className="mt-8 max-w-5xl mx-auto flex gap-6">
        {/* Sidebar filters */}
        <div className="w-64 shrink-0 space-y-6">
          <Button 
            className="w-full bg-ai-orange hover:bg-ai-orange/90 text-white" 
            onClick={() => { setIsCreating(true); resetForm(); }}
          >
            <Plus className="h-4 w-4 mr-2" /> New Memory
          </Button>
          
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3 px-2">Views</h3>
            <button 
              onClick={() => setFilter("all")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "all" ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface/50"}`}
            >
              <Database className="h-4 w-4" /> All Memories
            </button>
            <button 
              onClick={() => setFilter("pinned")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "pinned" ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface/50"}`}
            >
              <Pin className="h-4 w-4" /> Pinned
            </button>
            <button 
              onClick={() => setFilter("archived")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "archived" ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface/50"}`}
            >
              <Archive className="h-4 w-4" /> Archive
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search memories..." 
              className="pl-9 h-11 bg-surface border-border/50 rounded-xl"
            />
          </div>

          {isCreating && (
            <div className="bg-surface rounded-xl p-5 border border-ai-orange/30 shadow-md">
              <h3 className="text-sm font-medium mb-3">Create New Memory</h3>
              <textarea 
                autoFocus
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                placeholder="What should the AI remember?"
                className="w-full h-24 bg-background border border-border/50 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ai-orange"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  <Select value={formImportance} onValueChange={setFormImportance}>
                    <SelectTrigger className="w-28 h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger className="w-28 h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fact">Fact</SelectItem>
                      <SelectItem value="preference">Preference</SelectItem>
                      <SelectItem value="goal">Goal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button size="sm" className="bg-ai-orange hover:bg-ai-orange/90 text-white" onClick={handleCreate}>Save Memory</Button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filteredMemories.length === 0 && !isCreating ? (
            <div className="text-center p-12 text-muted-foreground border border-dashed border-border/50 rounded-xl bg-surface/30">
              No memories found.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMemories.map(memory => (
                <div key={memory.id} className="bg-surface rounded-xl p-5 border border-border/50 hover:border-border transition-colors group">
                  {editingId === memory.id ? (
                    <div>
                      <textarea 
                        autoFocus
                        value={formContent}
                        onChange={e => setFormContent(e.target.value)}
                        className="w-full h-24 bg-background border border-border/50 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ai-orange"
                      />
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-2">
                          <Select value={formImportance} onValueChange={setFormImportance}>
                            <SelectTrigger className="w-28 h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={formCategory} onValueChange={setFormCategory}>
                            <SelectTrigger className="w-28 h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fact">Fact</SelectItem>
                              <SelectItem value="preference">Preference</SelectItem>
                              <SelectItem value="goal">Goal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                          <Button size="sm" className="bg-ai-orange text-white" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="text-[15px] leading-relaxed flex-1 whitespace-pre-wrap">{memory.content}</p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdate(memory.id, { is_pinned: !memory.is_pinned })}>
                            <Pin className={`h-3.5 w-3.5 ${memory.is_pinned ? 'text-ai-orange fill-ai-orange' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => startEdit(memory)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdate(memory.id, { is_archived: !memory.is_archived })}>
                            <Archive className={`h-3.5 w-3.5 ${memory.is_archived ? 'text-foreground fill-foreground' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(memory.id)}>
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-medium border ${getImportanceColor(memory.importance || 'medium')}`}>
                          {memory.importance || 'medium'}
                        </span>
                        <span className="text-[11px] text-muted-foreground capitalize">
                          {memory.category || 'fact'}
                        </span>
                        <span className="text-[11px] text-muted-foreground/60 ml-auto">
                          {formatDistanceToNow(new Date(memory.created_at))} ago
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModulePage>
  );
}
