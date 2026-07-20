import { useState, useRef, useCallback } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { apiFetch } from "@/api/client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

interface DocumentUploaderProps {
  projectId: string;
  userId: string;
  onUploadSuccess?: () => void;
}

export function DocumentUploader({ projectId, userId, onUploadSuccess }: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
      "text/plain",
      "text/markdown",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    
    // Check extension as fallback for markdown
    if (!validTypes.includes(file.type) && !file.name.endsWith(".md")) {
      toast.error(`Invalid file type: ${file.type || "unknown"}. Please upload PDF, DOCX, TXT, MD, PNG, or JPG.`);
      return false;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error("File size must be less than 50MB");
      return false;
    }
    
    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${projectId}/${fileName}`;

      // Simulate progress since Supabase js doesn't support upload progress out of the box easily
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const { error: uploadError, data } = await supabase.storage
        .from('project_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      // 2. Insert metadata into documents table
      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          project_id: projectId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || (file.name.endsWith('.md') ? 'text/markdown' : 'application/octet-stream'),
          storage_bucket: 'project_documents'
        })
        .select()
        .single();

      if (dbError) {
        // Rollback storage upload if DB fails
        await supabase.storage.from('project_documents').remove([filePath]);
        throw dbError;
      }

      // 3. Trigger backend processing for RAG
      if (docData && !file.type.startsWith('image/')) {
        try {
          apiFetch('/documents/process', {
            method: 'POST',
            body: JSON.stringify({
              document_id: docData.id,
              project_id: projectId,
              file_path: filePath
            })
          }).catch(e => console.error("Failed to trigger processing:", e));
        } catch (e) {
          console.error("Failed to trigger processing:", e);
        }
      }

      setUploadProgress(100);
      toast.success("Document uploaded successfully");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["project_documents", projectId] });
      
      if (onUploadSuccess) onUploadSuccess();
      
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      uploadFile(file);
    }
  }, [projectId, userId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full mb-6">
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-border/60 bg-surface/20 hover:bg-surface/40",
          isUploading ? "opacity-70 pointer-events-none" : ""
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt,.md,image/png,image/jpeg,image/jpg"
        />
        
        {isUploading ? (
          <div className="w-full max-w-xs space-y-4 flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-sm font-medium">Uploading document...</div>
            <Progress value={uploadProgress} className="h-2 w-full" />
          </div>
        ) : (
          <>
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <UploadCloud className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Click or drag document to upload</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Supports PDF, DOCX, TXT, MD, PNG, and JPG. Maximum file size is 50MB.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
