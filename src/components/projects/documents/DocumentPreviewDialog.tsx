import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ProjectDocument } from "@/types/project";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface DocumentPreviewDialogProps {
  document: ProjectDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreviewDialog({ document, open, onOpenChange }: DocumentPreviewDialogProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !document) {
      setTextContent(null);
      setError(null);
      return;
    }

    const isText = document.mime_type.startsWith("text/") || document.file_name.endsWith(".md") || document.file_name.endsWith(".txt");

    if (isText) {
      const fetchText = async () => {
        setLoading(true);
        try {
          const { data } = supabase.storage
            .from(document.storage_bucket)
            .getPublicUrl(document.file_path);
            
          const response = await fetch(data.publicUrl);
          if (!response.ok) throw new Error("Failed to load text content");
          const text = await response.text();
          setTextContent(text);
        } catch (err: any) {
          setError(err.message || "Failed to load content");
        } finally {
          setLoading(false);
        }
      };

      fetchText();
    }
  }, [open, document]);

  if (!document) return null;

  const { data: { publicUrl } } = supabase.storage
    .from(document.storage_bucket)
    .getPublicUrl(document.file_path);

  const isImage = document.mime_type.startsWith("image/");
  const isPdf = document.mime_type === "application/pdf";
  const isText = document.mime_type.startsWith("text/") || document.file_name.endsWith(".md") || document.file_name.endsWith(".txt");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{document.file_name}</DialogTitle>
          <DialogDescription>Previewing document</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 relative">
          {isImage && (
            <div className="h-full w-full flex items-center justify-center p-4">
              <img 
                src={publicUrl} 
                alt={document.file_name} 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {isPdf && (
            <iframe 
              src={`${publicUrl}#toolbar=0`} 
              className="w-full h-full border-0"
              title={document.file_name}
            />
          )}

          {isText && (
            <div className="p-6 h-full overflow-auto">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center text-destructive">
                  {error}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm text-foreground bg-background p-4 rounded-md border">
                  {textContent}
                </pre>
              )}
            </div>
          )}

          {!isImage && !isPdf && !isText && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p>No preview available for this file type.</p>
              <a 
                href={publicUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 text-primary hover:underline"
              >
                Download file instead
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
