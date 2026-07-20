import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Prompt, PromptCreate, PromptUpdate } from "@/types/prompt";

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  onSave: (prompt: PromptCreate | PromptUpdate) => void;
  isSaving: boolean;
}

export function PromptEditorModal({ isOpen, onClose, prompt, onSave, isSaving }: PromptEditorModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [folder, setFolder] = useState("General");
  const [tagsStr, setTagsStr] = useState("");

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setDescription(prompt.description || "");
      setContent(prompt.content);
      setFolder(prompt.folder || "General");
      setTagsStr(prompt.tags ? prompt.tags.join(", ") : "");
    } else {
      setTitle("");
      setDescription("");
      setContent("");
      setFolder("General");
      setTagsStr("");
    }
  }, [prompt, isOpen]);

  const handleSave = () => {
    const tags = tagsStr.split(",").map(t => t.trim()).filter(t => t.length > 0);
    
    if (prompt) {
      onSave({
        title,
        description,
        content,
        folder,
        tags
      });
    } else {
      onSave({
        title,
        description,
        content,
        folder,
        tags,
        is_favorite: false
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] border-border/60 bg-surface/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{prompt ? "Edit Prompt" : "Create New Prompt"}</DialogTitle>
          <DialogDescription>
            Use variables like {"{{project_name}}"}, {"{{current_task}}"}, or {"{{selected_note}}"} to make it dynamic.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-xs font-semibold">Title <span className="text-red-500">*</span></Label>
            <Input 
              id="title" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Generate Weekly Report"
              className="bg-background/50 border-border/50"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-xs font-semibold">Description</Label>
            <Input 
              id="description" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="What does this prompt do?"
              className="bg-background/50 border-border/50"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="content" className="text-xs font-semibold">Prompt Content <span className="text-red-500">*</span></Label>
            <Textarea 
              id="content" 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="Write your prompt here. You can use variables..."
              className="h-32 bg-background/50 border-border/50 font-mono text-sm resize-none custom-scrollbar"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="folder" className="text-xs font-semibold">Folder</Label>
              <Input 
                id="folder" 
                value={folder} 
                onChange={e => setFolder(e.target.value)} 
                placeholder="e.g. Coding, Writing"
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags" className="text-xs font-semibold">Tags (comma separated)</Label>
              <Input 
                id="tags" 
                value={tagsStr} 
                onChange={e => setTagsStr(e.target.value)} 
                placeholder="e.g. react, debug, refactor"
                className="bg-background/50 border-border/50"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !title.trim() || !content.trim()}
            className="gradient-signature border-0"
          >
            {isSaving ? "Saving..." : "Save Prompt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
