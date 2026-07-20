import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateNoteInput } from "@/types/note";

interface NewNoteModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (noteId: string) => void;
}

export function NewNoteModal({ projectId, open, onOpenChange, onSuccess }: NewNoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData?.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("notes")
        .insert({
          project_id: input.project_id,
          user_id: userData.user.id,
          title: input.title,
          content: input.content || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Note created successfully!");
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
      onOpenChange(false);
      setTitle("");
      setContent("");
      if (data) onSuccess(data.id);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Failed to create note");
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({
      project_id: projectId,
      title,
      content,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-white/10 bg-background/60 p-0 shadow-2xl backdrop-blur-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="p-6 relative z-10">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold tracking-tight">Create a new note</DialogTitle>
            <DialogDescription className="text-[14px]">
              Capture your ideas, meeting notes, or documentation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="note-title" className="text-[13px] font-medium flex justify-between items-center">
                Note Title
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold bg-surface px-1.5 py-0.5 rounded">Required</span>
              </Label>
              <Input 
                id="note-title" 
                placeholder="e.g. Brainstorming Session" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                className="bg-black/20 border-white/10 h-11 text-[14px] placeholder:text-muted-foreground/60 focus-visible:ring-primary/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note-content" className="text-[13px] font-medium flex justify-between items-center">
                Content
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Optional</span>
              </Label>
              <Textarea 
                id="note-content" 
                placeholder="Start typing..." 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-black/20 border-white/10 min-h-[120px] text-[14px] placeholder:text-muted-foreground/60 focus-visible:ring-primary/50 resize-none"
              />
            </div>

            <div className="flex justify-end pt-6 mt-2 border-t border-white/5">
              <Button 
                type="submit" 
                disabled={createMutation.isPending || !title.trim()}
                className="w-full sm:w-auto h-11 px-8 gradient-signature border-0 text-white font-medium shadow-[0_0_20px_-5px_rgba(122,90,248,0.5)] transition-all hover:shadow-[0_0_25px_-5px_rgba(122,90,248,0.7)]"
              >
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Note
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
