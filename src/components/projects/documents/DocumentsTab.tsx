import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectDocument } from "@/types/project";
import { DocumentUploader } from "./DocumentUploader";
import { DocumentList } from "./DocumentList";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DocumentsTabProps {
  projectId: string;
}

export function DocumentsTab({ projectId }: DocumentsTabProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUserId(data.user.id);
      }
    };
    fetchUser();
  }, []);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["project_documents", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as ProjectDocument[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, path }: { id: string, path: string }) => {
      // 1. Delete from storage
      const { error: storageError } = await supabase.storage
        .from("project_documents")
        .remove([path]);
      
      if (storageError) throw storageError;

      // 2. Delete from DB
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);
        
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: ["project_documents", projectId] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Failed to delete document");
    }
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string, newName: string }) => {
      const { error } = await supabase
        .from("documents")
        .update({ file_name: newName, updated_at: new Date().toISOString() })
        .eq("id", id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document renamed");
      queryClient.invalidateQueries({ queryKey: ["project_documents", projectId] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Failed to rename document");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {userId && (
        <DocumentUploader 
          projectId={projectId} 
          userId={userId} 
        />
      )}
      
      <DocumentList 
        documents={documents || []} 
        onDelete={async (id, path) => await deleteMutation.mutateAsync({ id, path })}
        onRename={async (id, newName) => await renameMutation.mutateAsync({ id, newName })}
      />
    </div>
  );
}
