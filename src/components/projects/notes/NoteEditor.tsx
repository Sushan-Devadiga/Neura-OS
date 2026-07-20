import { useState, useEffect, useRef } from "react";
import { Note, UpdateNoteInput } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Trash2, Save, CheckCircle2, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface NoteEditorProps {
  note: Note;
  onSave: (id: string, data: UpdateNoteInput) => void;
  onDelete: (id: string) => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  isDeleting: boolean;
}

export function NoteEditor({ note, onSave, onDelete, saveStatus, isDeleting }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if a completely different note is selected
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content || "");
  }, [note.id]);

  // Debounced autosave
  useEffect(() => {
    // Avoid saving if nothing changed from DB
    if (title === note.title && content === (note.content || "")) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSave(note.id, { title, content });
    }, 2000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, content, note.id, onSave]);

  const handleBlur = () => {
    if (title === note.title && content === (note.content || "")) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSave(note.id, { title, content });
  };

  return (
    <div className="flex-1 flex flex-col h-[600px] overflow-hidden bg-surface/10 relative">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/60">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {saveStatus === "saving" && (
            <span className="flex items-center text-blue-400">
              <Save className="h-3 w-3 mr-1 animate-pulse" /> Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center text-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center text-red-500">
              <AlertCircle className="h-3 w-3 mr-1" /> Error saving
            </span>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </Button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            placeholder="Note Title"
            className="w-full bg-transparent text-3xl font-bold tracking-tight text-foreground border-none outline-none focus:ring-0 placeholder:text-muted-foreground/30"
          />
          
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            placeholder="Start writing..."
            className="w-full min-h-[400px] bg-transparent text-base leading-relaxed border-none outline-none focus-visible:ring-0 p-0 resize-none placeholder:text-muted-foreground/30"
          />
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{note.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                onDelete(note.id);
              }}
              className="bg-red-500 hover:bg-red-600 text-white border-0"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Note"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
