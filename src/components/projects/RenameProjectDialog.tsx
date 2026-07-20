import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Box, Sparkles, Folder, Cpu, Layout, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Project } from "@/types/project";
import { cn } from "@/lib/utils";

const ICONS = [
  { name: "Box", component: Box },
  { name: "Sparkles", component: Sparkles },
  { name: "Folder", component: Folder },
  { name: "Cpu", component: Cpu },
  { name: "Layout", component: Layout },
  { name: "Briefcase", component: Briefcase },
];

const COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-gray-500",
];

interface RenameProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameProjectDialog({ project, open, onOpenChange }: RenameProjectDialogProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [selectedIcon, setSelectedIcon] = useState(project.icon || "Box");
  const [selectedColor, setSelectedColor] = useState(project.color || "bg-blue-500");

  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setName(project.name);
      setDescription(project.description || "");
      setSelectedIcon(project.icon || "Box");
      setSelectedColor(project.color || "bg-blue-500");
    }
  }, [open, project]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("projects")
        .update({
          name,
          description,
          icon: selectedIcon,
          color: selectedColor,
        })
        .eq("id", project.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Failed to update project");
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-white/10 bg-background/60 p-0 shadow-2xl backdrop-blur-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="p-6 relative z-10">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold tracking-tight">Rename project</DialogTitle>
            <DialogDescription className="text-[14px]">
              Update your project details and visual appearance.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="rename-name" className="text-[13px] font-medium flex justify-between items-center">
                Project Name
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold bg-surface px-1.5 py-0.5 rounded">Required</span>
              </Label>
              <Input 
                id="rename-name" 
                placeholder="e.g. Acme Redesign" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-black/20 border-white/10 h-11 text-[14px] placeholder:text-muted-foreground/60 focus-visible:ring-primary/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rename-description" className="text-[13px] font-medium flex justify-between items-center">
                Description
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Optional</span>
              </Label>
              <Input 
                id="rename-description" 
                placeholder="What is this project about?" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-black/20 border-white/10 h-11 text-[14px] placeholder:text-muted-foreground/60 focus-visible:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[13px] font-medium">Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((IconObj) => (
                    <button
                      key={IconObj.name}
                      type="button"
                      onClick={() => setSelectedIcon(IconObj.name)}
                      className={cn(
                        "h-10 w-10 flex items-center justify-center rounded-xl border transition-all duration-200",
                        selectedIcon === IconObj.name 
                          ? "border-primary/50 bg-primary/20 text-primary shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)]" 
                          : "border-white/5 bg-black/20 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      <IconObj.component className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[13px] font-medium">Color theme</Label>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "h-7 w-7 rounded-full transition-all duration-200 ring-offset-2 ring-offset-background/50",
                        color,
                        selectedColor === color 
                          ? "ring-2 ring-white scale-110 shadow-lg" 
                          : "hover:scale-110 opacity-60 hover:opacity-100"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 mt-2 border-t border-white/5">
              <Button 
                type="submit" 
                disabled={updateMutation.isPending || !name.trim()}
                className="w-full sm:w-auto h-11 px-8 gradient-signature border-0 text-white font-medium shadow-[0_0_20px_-5px_rgba(122,90,248,0.5)] transition-all hover:shadow-[0_0_25px_-5px_rgba(122,90,248,0.7)]"
              >
                {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
