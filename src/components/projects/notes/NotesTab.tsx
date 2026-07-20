import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note, UpdateNoteInput } from "@/types/note";
import { NotesSidebar } from "./NotesSidebar";
import { NoteEditor } from "./NoteEditor";
import { NewNoteModal } from "./NewNoteModal";
import { Button } from "@/components/ui/button";
import { Plus, NotebookPen } from "lucide-react";
import { toast } from "sonner";

interface NotesTabProps {
  projectId: string;
}

export function NotesTab({ projectId }: NotesTabProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const queryClient = useQueryClient();

  // Fetch notes
  const { data: notes, isLoading } = useQuery({
    queryKey: ["notes", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Note[];
    },
  });

  // Select first note if none selected and notes exist
  useEffect(() => {
    if (!selectedNoteId && notes && notes.length > 0 && !searchQuery) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId, searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setIsNewNoteModalOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        document.getElementById("notes-search-input")?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNoteInput }) => {
      setSaveStatus("saving");
      const { error } = await supabase
        .from("notes")
        .update({
          title: data.title,
          content: data.content,
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      setSaveStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onError: (err: any) => {
      console.error(err);
      setSaveStatus("error");
      toast.error(err.message || "Failed to save note");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      toast.success("Note deleted");
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
      if (selectedNoteId === deletedId) {
        setSelectedNoteId(null);
      }
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Failed to delete note");
    },
  });

  const handleSaveNote = (id: string, data: UpdateNoteInput) => {
    updateMutation.mutate({ id, data });
  };

  const selectedNote = notes?.find((n) => n.id === selectedNoteId);

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border/60 bg-surface/20 overflow-hidden shadow-sm">
      {/* Tab Header (Toolbar) */}
      <div className="flex items-center justify-between p-4 border-b border-border/60 bg-surface/40 backdrop-blur-md z-10">
        <div className="flex items-center space-x-2">
          <NotebookPen className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Project Notes</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs text-muted-foreground mr-2 font-mono">
            Ctrl+N
          </span>
          <Button 
            size="sm" 
            className="gradient-signature border-0 text-white shadow-sm"
            onClick={() => setIsNewNoteModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> New Note
          </Button>
        </div>
      </div>

      {/* Main Content Area (Split Pane) */}
      <div className="flex flex-1 flex-col md:flex-row h-full overflow-hidden">
        <NotesSidebar 
          notes={notes} 
          isLoading={isLoading} 
          selectedNoteId={selectedNoteId} 
          onSelectNote={setSelectedNoteId} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        {selectedNote ? (
          <NoteEditor 
            note={selectedNote} 
            onSave={handleSaveNote}
            onDelete={(id) => deleteMutation.mutate(id)}
            saveStatus={saveStatus}
            isDeleting={deleteMutation.isPending}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-surface/10 p-8 text-center h-[600px]">
            <div className="rounded-full bg-surface p-4 text-muted-foreground border border-border/50 mb-4 shadow-sm">
              <NotebookPen className="h-8 w-8 opacity-50" />
            </div>
            <h3 className="text-lg font-medium">Select a note</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Choose a note from the sidebar or create a new one to start writing.
            </p>
            <Button 
              className="mt-6" 
              variant="outline"
              onClick={() => setIsNewNoteModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Create Note
            </Button>
          </div>
        )}
      </div>

      <NewNoteModal 
        projectId={projectId}
        open={isNewNoteModalOpen}
        onOpenChange={setIsNewNoteModalOpen}
        onSuccess={(noteId) => setSelectedNoteId(noteId)}
      />
    </div>
  );
}
