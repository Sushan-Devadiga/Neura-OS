import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/types/note";
import { Plus, Search, FileText, Pin, Archive, Trash, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/notes")({ component: Page });

// Extend Note type with local-only flags if they aren't in the DB
interface ExtendedNote extends Note {
  is_pinned?: boolean;
  is_archived?: boolean;
}

function Page() {
  const [notes, setNotes] = useState<ExtendedNote[]>([]);
  const [activeNote, setActiveNote] = useState<ExtendedNote | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "pinned" | "archived">("all");

  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("neura_pinned_notes") || "[]"); } catch { return []; }
  });
  
  const [archivedIds, setArchivedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("neura_archived_notes") || "[]"); } catch { return []; }
  });

  const DEFAULT_PROJECT = "00000000-0000-0000-0000-000000000000"; // Fallback project ID

  useEffect(() => {
    localStorage.setItem("neura_pinned_notes", JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  useEffect(() => {
    localStorage.setItem("neura_archived_notes", JSON.stringify(archivedIds));
  }, [archivedIds]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
      
      if (data && data.length > 0 && !activeNote) {
        // Find first non-archived note
        const firstActive = data.find(n => !archivedIds.includes(n.id));
        if (firstActive) setActiveNote(firstActive);
      }
    } catch (err: any) {
      toast.error("Failed to load notes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Ensure we have a project to assign this to, as notes require a project_id
      let { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id")
        .limit(1);

      if (projectsError) throw projectsError;
      
      let projectId = projects?.[0]?.id;

      if (!projectId) {
        // Create a default personal project if none exists
        const { data: newProject, error: createProjectError } = await supabase
          .from("projects")
          .insert({ name: "Personal", user_id: session.user.id })
          .select("id")
          .single();
          
        if (createProjectError) throw createProjectError;
        projectId = newProject.id;
      }

      const newNote = {
        title: "Untitled Note",
        content: "",
        project_id: projectId,
        user_id: session.user.id
      };

      const { data, error } = await supabase.from("notes").insert(newNote).select().single();
      if (error) throw error;
      
      setNotes([data, ...notes]);
      setActiveNote(data);
      toast.success("Note created");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create note.");
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
      
      setNotes(notes.filter(n => n.id !== id));
      if (activeNote?.id === id) {
        setActiveNote(null);
      }
      toast.success("Note deleted");
    } catch (err: any) {
      toast.error("Failed to delete note.");
    }
  };

  // Auto-save logic
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (activeNote) {
        const originalNote = notes.find(n => n.id === activeNote.id);
        if (originalNote && (originalNote.title !== activeNote.title || originalNote.content !== activeNote.content)) {
          saveNote(activeNote);
        }
      }
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [activeNote?.title, activeNote?.content]);

  const saveNote = async (noteToSave: ExtendedNote) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("notes")
        .update({ title: noteToSave.title, content: noteToSave.content, updated_at: new Date().toISOString() })
        .eq("id", noteToSave.id);

      if (error) throw error;
      
      setNotes(notes.map(n => n.id === noteToSave.id ? noteToSave : n));
    } catch (err: any) {
      toast.error("Auto-save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const toggleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setArchivedIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
    if (activeNote?.id === id) setActiveNote(null);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    const isPinned = pinnedIds.includes(note.id);
    const isArchived = archivedIds.includes(note.id);
    
    if (filter === "pinned") return isPinned && !isArchived;
    if (filter === "archived") return isArchived;
    return !isArchived;
  }).sort((a, b) => {
    const aPinned = pinnedIds.includes(a.id);
    const bPinned = pinnedIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <ModulePage>
      <ModuleHeader eyebrow="Notes" title="Think in writing." description="Rich notes that auto-link to your knowledge graph." hue="ai-orange" />
      
      <div className="flex h-[calc(100vh-220px)] mt-6 gap-6">
        {/* Sidebar */}
        <div className="w-80 flex flex-col bg-surface rounded-2xl border overflow-hidden shrink-0">
          <div className="p-4 border-b space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search notes..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
              <Button size="icon" onClick={handleCreateNote} className="shrink-0 bg-ai-orange hover:bg-ai-orange/90">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex bg-background rounded-lg p-1">
              <button 
                onClick={() => setFilter("all")}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${filter === "all" ? "bg-surface shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter("pinned")}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${filter === "pinned" ? "bg-surface shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Pinned
              </button>
              <button 
                onClick={() => setFilter("archived")}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${filter === "archived" ? "bg-surface shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Archive
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center p-8 text-sm text-muted-foreground">No notes found.</div>
            ) : (
              filteredNotes.map(note => {
                const isPinned = pinnedIds.includes(note.id);
                return (
                  <div 
                    key={note.id}
                    onClick={() => setActiveNote(note)}
                    className={`p-3 rounded-xl cursor-pointer transition-colors group ${activeNote?.id === note.id ? "bg-ai-orange/10 border border-ai-orange/20" : "hover:bg-surface-hover border border-transparent"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm truncate pr-2">{note.title || "Untitled"}</h4>
                      {isPinned && <Pin className="h-3 w-3 text-ai-orange shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {note.content || "No content"}
                    </p>
                    <div className="text-[10px] text-muted-foreground/60 mt-2 flex justify-between items-center">
                      <span>{formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => togglePin(note.id, e)} className="hover:text-ai-orange p-1"><Pin className="h-3 w-3" /></button>
                        <button onClick={(e) => toggleArchive(note.id, e)} className="hover:text-foreground p-1"><Archive className="h-3 w-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }} className="hover:text-destructive p-1"><Trash className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 bg-surface rounded-2xl border flex flex-col overflow-hidden">
          {activeNote ? (
            <>
              <div className="p-4 border-b flex items-center justify-between bg-background/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 text-ai-orange" />
                  {isSaving ? (
                    <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</span>
                  ) : (
                    <span className="flex items-center gap-1"><Save className="h-3 w-3" /> Saved</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={(e) => togglePin(activeNote.id, e)}>
                    <Pin className={`h-4 w-4 ${pinnedIds.includes(activeNote.id) ? "text-ai-orange fill-ai-orange" : "text-muted-foreground"}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => toggleArchive(activeNote.id, e)}>
                    <Archive className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteNote(activeNote.id)}>
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col overflow-y-auto">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => setActiveNote({...activeNote, title: e.target.value})}
                  placeholder="Note Title"
                  className="text-4xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0 mb-6"
                />
                <textarea
                  value={activeNote.content || ""}
                  onChange={(e) => setActiveNote({...activeNote, content: e.target.value})}
                  placeholder="Start typing your note here... (Markdown supported)"
                  className="flex-1 resize-none bg-transparent border-none focus:outline-none focus:ring-0 text-base leading-relaxed"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="h-12 w-12 opacity-20 mb-4" />
              <p>Select a note or create a new one</p>
              <Button onClick={handleCreateNote} className="mt-4 bg-ai-orange hover:bg-ai-orange/90">
                Create Note
              </Button>
            </div>
          )}
        </div>
      </div>
    </ModulePage>
  );
}
