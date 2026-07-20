import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Memory } from "@/types/memory";
import { MemoryCard } from "./MemoryCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Plus, BrainCircuit } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MemoriesTabProps {
  projectId: string;
}

export function MemoriesTab({ projectId }: MemoriesTabProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("active");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New memory state
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("fact");
  const [newImportance, setNewImportance] = useState("medium");

  const { data: memories = [], isLoading } = useQuery({
    queryKey: ["memories", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .eq("project_id", projectId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Memory[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Memory> }) => {
      const { data, error } = await supabase
        .from("memories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories", projectId] });
      toast.success("Memory updated");
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("memories")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories", projectId] });
      toast.success("Memory deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    }
  });

  const createMutation = useMutation({
    mutationFn: async (memory: Partial<Memory>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("memories")
        .insert({
          ...memory,
          user_id: user.id,
          project_id: projectId
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories", projectId] });
      toast.success("Memory added");
      setIsAddOpen(false);
      setNewContent("");
    },
    onError: (error) => {
      toast.error(`Failed to add memory: ${error.message}`);
    }
  });

  const handleUpdate = (id: string, updates: Partial<Memory>) => {
    updateMutation.mutate({ id, updates });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCreate = () => {
    if (!newContent.trim()) {
      toast.error("Content is required");
      return;
    }
    createMutation.mutate({
      content: newContent,
      category: newCategory as any,
      importance: newImportance as any,
    });
  };

  const filteredMemories = memories.filter(memory => {
    // Filter by archive status
    if (activeTab === "active" && memory.is_archived) return false;
    if (activeTab === "archived" && !memory.is_archived) return false;
    
    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return (
        memory.content.toLowerCase().includes(lowerQuery) ||
        memory.category.toLowerCase().includes(lowerQuery)
      );
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">Memory Engine</h2>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Memory
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Manual Memory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea 
                  placeholder="E.g., The user prefers React over Vue for new projects."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preference">Preference</SelectItem>
                      <SelectItem value="project decision">Project Decision</SelectItem>
                      <SelectItem value="architecture">Architecture</SelectItem>
                      <SelectItem value="goal">Goal</SelectItem>
                      <SelectItem value="fact">Fact</SelectItem>
                      <SelectItem value="coding style">Coding Style</SelectItem>
                      <SelectItem value="writing style">Writing Style</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Importance</Label>
                  <Select value={newImportance} onValueChange={setNewImportance}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full mt-4" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Memory
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search memories..."
            className="pl-8 bg-surface border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredMemories.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-surface/20">
          <BrainCircuit className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground">No memories found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
            {searchQuery 
              ? "No memories match your search." 
              : activeTab === "archived" 
                ? "You haven't archived any memories." 
                : "The AI automatically extracts important information from your chats. You can also add manual memories."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.map(memory => (
            <MemoryCard 
              key={memory.id} 
              memory={memory} 
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
