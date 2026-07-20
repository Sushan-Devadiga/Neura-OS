import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatSession } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, MessageSquare, Trash2, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  projectId: string;
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
}

export function ChatSidebar({ projectId, activeSessionId, onSelectSession }: ChatSidebarProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["chat_sessions", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ChatSession[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          project_id: projectId,
          user_id: userData.user.id,
          title: "New Chat",
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ["chat_sessions", projectId] });
      onSelectSession(newSession.id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chat_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["chat_sessions", projectId] });
      if (activeSessionId === deletedId) {
        onSelectSession(""); // Clear selection
      }
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string, title: string }) => {
      const { error } = await supabase.from("chat_sessions").update({ title }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat_sessions", projectId] });
      setEditingId(null);
    },
  });

  const startEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim()) {
      renameMutation.mutate({ id, title: editTitle.trim() });
    } else {
      setEditingId(null);
    }
  };

  return (
    <div className="w-64 border-r border-border/50 bg-surface/20 flex flex-col h-[calc(100vh-14rem)] rounded-l-2xl">
      <div className="p-4">
        <Button 
          onClick={() => createMutation.mutate()} 
          disabled={createMutation.isPending}
          className="w-full gradient-signature border-0 shadow-sm"
        >
          {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : sessions?.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground p-4">
            No chats yet. Start a new conversation!
          </div>
        ) : (
          <div className="space-y-1">
            {sessions?.map((session) => (
              <div 
                key={session.id}
                className={cn(
                  "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors",
                  activeSessionId === session.id ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:bg-surface/50 hover:text-foreground"
                )}
                onClick={() => {
                  if (editingId !== session.id) onSelectSession(session.id);
                }}
              >
                {editingId === session.id ? (
                  <div className="flex items-center w-full gap-1">
                    <Input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-7 text-xs px-2 py-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(session.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button onClick={(e) => { e.stopPropagation(); saveEdit(session.id); }} className="p-1 hover:text-green-500">
                      <Check className="h-3 w-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1 hover:text-rose-500">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                      <span className="text-sm truncate">{session.title}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); startEdit(session); }}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(session.id); }}
                        className="p-1 text-muted-foreground hover:text-rose-500"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
