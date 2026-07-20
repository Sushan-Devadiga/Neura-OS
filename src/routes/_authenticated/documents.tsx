import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "@/api/client";
import { FileText, Upload, Trash, File, Search, Loader2, Edit2, Play, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/documents")({ component: Page });

type Document = {
  id: string;
  project_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  status: string;
  created_at: string;
  updated_at: string;
};

function Page() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const DEFAULT_PROJECT = "00000000-0000-0000-0000-000000000000";

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      toast.error("Failed to load documents.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("project_documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Ensure we have a project to assign this to, as documents require a project_id
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

      // Create record in documents table
      const newDoc = {
        project_id: projectId,
        user_id: session.user.id,
        file_name: file.name,
        file_path: filePath,
        mime_type: file.type || "application/octet-stream",
        file_size: file.size
      };

      const { data, error: dbError } = await supabase.from("documents").insert(newDoc).select().single();
      if (dbError) throw dbError;

      setDocuments([data, ...documents]);
      toast.success("Document uploaded successfully");

      // Auto-trigger processing
      handleProcess(data.id, filePath, projectId);

    } catch (err: any) {
      console.error(err);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleProcess = async (id: string, filePath: string, projectId: string) => {
    try {
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: "processing" } : d));
      
      await apiFetch("/documents/process", {
        method: "POST",
        body: JSON.stringify({
          document_id: id,
          project_id: projectId,
          file_path: filePath
        })
      });
      
      toast.success("Processing started");
      // Note: we'd ideally listen to realtime updates from Supabase to update status to 'completed'
    } catch (err) {
      toast.error("Failed to start processing");
      loadDocuments(); // Revert status
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      setDocuments(prev => prev.filter(d => d.id !== id));
      
      // Delete from storage
      await supabase.storage.from("project_documents").remove([filePath]);
      
      // Delete from DB
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      
      toast.success("Document deleted");
    } catch (err) {
      toast.error("Failed to delete document");
      loadDocuments();
    }
  };

  const handleRenameSubmit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, file_name: editName } : d));
      const { error } = await supabase.from("documents").update({ file_name: editName }).eq("id", id);
      if (error) throw error;
      toast.success("Document renamed");
    } catch (err) {
      toast.error("Failed to rename document");
      loadDocuments();
    } finally {
      setEditingId(null);
    }
  };

  const getFileIcon = (type?: string) => {
    if (!type) return <File className="h-8 w-8 text-ai-cyan" />;
    const lowerType = type.toLowerCase();
    if (lowerType.includes("pdf")) return <FileIcon className="h-8 w-8 text-rose-500" />;
    if (lowerType.includes("word") || lowerType.includes("document")) return <FileIcon className="h-8 w-8 text-blue-500" />;
    if (lowerType.includes("text")) return <FileText className="h-8 w-8 text-gray-500" />;
    return <File className="h-8 w-8 text-ai-cyan" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes == null) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const filteredDocs = documents.filter(d => (d.file_name || "").toLowerCase().includes((searchQuery || "").toLowerCase()));

  return (
    <ModulePage>
      <ModuleHeader eyebrow="Documents" title="Long-form, intelligent." description="Upload, process, and index documents for AI retrieval." hue="ai-cyan" />
      
      <div className="mt-8 max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-surface p-4 rounded-2xl border border-border/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search documents..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          
          <div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
              accept=".pdf,.txt,.docx,.md" 
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              className="bg-ai-cyan hover:bg-ai-cyan/90 text-cyan-950"
            >
              {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload Document
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="bg-surface/50 border border-border/50 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-ai-cyan/10 text-ai-cyan mb-4">
              <Upload className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No documents found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Upload PDFs, Word documents, or text files to process them and make their knowledge available to your AI agents.
            </p>
            <Button 
              variant="outline" 
              className="mt-6 border-ai-cyan/20 hover:bg-ai-cyan/10 text-ai-cyan"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload your first document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="bg-surface border border-border/50 rounded-2xl p-5 hover:border-ai-cyan/40 transition-colors group flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <div className="shrink-0 bg-background rounded-xl p-2.5 border border-border/50 shadow-sm">
                    {getFileIcon(doc.mime_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingId === doc.id ? (
                      <div className="flex items-center gap-2">
                        <Input 
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleRenameSubmit(doc.id)}
                          onBlur={() => handleRenameSubmit(doc.id)}
                          className="h-7 text-sm px-2 -ml-2"
                        />
                      </div>
                    ) : (
                      <h4 
                        className="font-medium text-[15px] truncate cursor-pointer hover:text-ai-cyan transition-colors"
                        onClick={() => {
                          setEditingId(doc.id);
                          setEditName(doc.file_name);
                        }}
                      >
                        {doc.file_name}
                      </h4>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{formatSize(doc.file_size)}</span>
                      <span>&bull;</span>
                      <span>{formatDistanceToNow(new Date(doc.created_at))} ago</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      doc.status === 'completed' || doc.status === 'processed' ? 'bg-emerald-500' : 
                      doc.status === 'error' ? 'bg-rose-500' : 
                      doc.status === 'processing' ? 'bg-amber-500 animate-pulse' : 
                      'bg-muted-foreground'
                    }`} />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {doc.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-ai-cyan"
                      onClick={() => handleProcess(doc.id, doc.file_path, doc.project_id)}
                      title="Process Document"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => { setEditingId(doc.id); setEditName(doc.file_name); }}
                      title="Rename"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(doc.id, doc.file_path)}
                      title="Delete"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModulePage>
  );
}
