import { Note } from "@/types/note";
import { formatDistanceToNow } from "date-fns";
import { Search, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NotesSidebarProps {
  notes: Note[] | undefined;
  isLoading: boolean;
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function NotesSidebar({ 
  notes, 
  isLoading, 
  selectedNoteId, 
  onSelectNote, 
  searchQuery, 
  setSearchQuery 
}: NotesSidebarProps) {
  
  const filteredNotes = notes?.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-[600px] w-full md:w-80 flex-col border-r border-border/60 bg-surface/20">
      <div className="p-4 border-b border-border/60">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            id="notes-search-input"
            placeholder="Search notes... (Ctrl+F)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-surface/40 animate-pulse" />
            ))}
          </div>
        ) : !notes || notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">No notes yet</p>
            <p className="text-xs text-muted-foreground mt-1">Press Ctrl+N to create one.</p>
          </div>
        ) : filteredNotes?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-sm text-muted-foreground">No notes match your search.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredNotes?.map((note) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={cn(
                  "w-full text-left flex flex-col p-3 rounded-lg transition-all duration-200",
                  selectedNoteId === note.id 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-surface text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn(
                  "font-medium text-sm truncate",
                  selectedNoteId === note.id ? "text-primary" : "text-foreground"
                )}>
                  {note.title}
                </span>
                <div className="flex items-center justify-between mt-1 text-xs opacity-80">
                  <span className="truncate max-w-[150px]">
                    {note.content ? note.content.substring(0, 30) : "No content"}
                  </span>
                  <span className="shrink-0 ml-2">
                    {formatDistanceToNow(new Date(note.updated_at))}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
