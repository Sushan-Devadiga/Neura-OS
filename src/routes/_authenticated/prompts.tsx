import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Prompt, PromptCreate, PromptUpdate } from "@/types/prompt";
import { apiFetch } from "@/api/client";
import { PromptCard } from "@/components/prompts/PromptCard";
import { PromptEditorModal } from "@/components/prompts/PromptEditorModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Upload, Download, Sparkles, FolderIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/prompts")({
  component: PromptLibraryPage,
});

function PromptLibraryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("All");
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Fetch all prompts
  const { data: prompts, isLoading } = useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const res = await apiFetch("/prompts");
      return (res?.data || []) as Prompt[];
    }
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: PromptCreate | PromptUpdate) => {
      const method = editingPrompt ? "PUT" : "POST";
      const url = editingPrompt 
        ? `/prompts/${editingPrompt.id}`
        : `/prompts`;

      return await apiFetch(url, {
        method,
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      setIsEditorOpen(false);
      setEditingPrompt(null);
      toast.success(editingPrompt ? "Prompt updated!" : "Prompt created!");
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/prompts/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Prompt deleted!");
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string, is_favorite: boolean }) => {
      await apiFetch(`/prompts/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_favorite: !is_favorite })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    }
  });

  const importMutation = useMutation({
    mutationFn: async (importedPrompts: PromptCreate[]) => {
      return await apiFetch(`/prompts/import`, {
        method: "POST",
        body: JSON.stringify(importedPrompts)
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success(`Imported ${res.count} prompts successfully!`);
    }
  });

  // Derived state
  const folders = useMemo(() => {
    if (!prompts) return ["All"];
    const f = new Set(prompts.map(p => p.folder).filter(Boolean));
    return ["All", ...Array.from(f)];
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    if (!prompts) return [];
    return prompts.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.content.toLowerCase().includes(search.toLowerCase());
      const matchFolder = selectedFolder === "All" || p.folder === selectedFolder;
      return matchSearch && matchFolder && !p.is_archived;
    });
  }, [prompts, search, selectedFolder]);

  // Handlers
  const handleExport = () => {
    if (!prompts || prompts.length === 0) return toast.error("No prompts to export.");
    const exportData = prompts.map(p => ({
      title: p.title,
      content: p.content,
      description: p.description,
      folder: p.folder,
      category: p.category,
      tags: p.tags,
      is_favorite: p.is_favorite
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neuraos_prompts_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Prompts exported!");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          if (Array.isArray(parsed)) {
            importMutation.mutate(parsed);
          } else {
            toast.error("Invalid format: Expected an array of prompts.");
          }
        } catch (err) {
          toast.error("Failed to parse JSON file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ai-purple/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="px-8 py-8 flex-1 overflow-y-auto custom-scrollbar relative z-10">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-ai-purple" /> Prompt Library
              </h1>
              <p className="text-muted-foreground mt-1">Build your personal vault of highly-optimized AI instructions.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport} className="h-9" disabled={importMutation.isPending}>
                <Upload className="h-4 w-4 mr-2" /> Import
              </Button>
              <Button 
                onClick={() => { setEditingPrompt(null); setIsEditorOpen(true); }}
                className="gradient-signature border-0 shadow-md h-9 ml-2"
              >
                <Plus className="h-4 w-4 mr-2" /> New Prompt
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-surface/50 border border-border/50 backdrop-blur-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search prompts by title or content..." 
                className="pl-9 bg-background/50 border-border/50"
              />
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <div className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Folder" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {folders.map(f => (
                    <SelectItem key={f as string} value={f as string}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-border/50 rounded-2xl bg-surface/30 backdrop-blur-sm">
              <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No prompts found</h3>
              <p className="text-muted-foreground mb-6">Create your first prompt or import an existing library.</p>
              <Button onClick={() => { setEditingPrompt(null); setIsEditorOpen(true); }} className="gradient-signature border-0">
                Create Prompt
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrompts.map(prompt => (
                <PromptCard 
                  key={prompt.id} 
                  prompt={prompt} 
                  onEdit={(p) => { setEditingPrompt(p); setIsEditorOpen(true); }}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onToggleFavorite={(id, status) => toggleFavoriteMutation.mutate({ id, is_favorite: status })}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      <PromptEditorModal 
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        prompt={editingPrompt}
        onSave={(data) => saveMutation.mutate(data)}
        isSaving={saveMutation.isPending}
      />
    </div>
  );
}
