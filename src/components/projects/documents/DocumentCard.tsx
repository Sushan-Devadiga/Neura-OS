import { useState } from "react";
import { ProjectDocument } from "@/types/project";
import { format } from "date-fns";
import { 
  FileText, FileImage, File, MoreVertical, Trash2, Edit2, Loader2, Download
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface DocumentCardProps {
  document: ProjectDocument;
  onClick: (doc: ProjectDocument) => void;
  onDelete: (id: string, path: string) => Promise<void>;
  onRename: (id: string, newName: string) => Promise<void>;
}

export function DocumentCard({ document, onClick, onDelete, onRename }: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const getFileIcon = () => {
    if (document.mime_type.startsWith("image/")) return <FileImage className="h-10 w-10 text-blue-500" />;
    if (document.mime_type.startsWith("text/") || document.mime_type === "application/pdf") return <FileText className="h-10 w-10 text-rose-500" />;
    return <File className="h-10 w-10 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${document.file_name}?`)) {
      setIsDeleting(true);
      try {
        await onDelete(document.id, document.file_path);
      } catch (err) {
        console.error(err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleRename = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = window.prompt("Enter new file name:", document.file_name);
    if (newName && newName !== document.file_name) {
      setIsRenaming(true);
      try {
        await onRename(document.id, newName);
      } catch (err) {
        console.error(err);
      } finally {
        setIsRenaming(false);
      }
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { data: { publicUrl } } = supabase.storage
      .from(document.storage_bucket)
      .getPublicUrl(document.file_path);
    window.open(publicUrl, '_blank');
  };

  return (
    <div 
      onClick={() => onClick(document)}
      className="group relative flex flex-col items-center justify-center rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleRename}>
              <Edit2 className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-4 mt-2">
        {getFileIcon()}
      </div>
      
      <div className="w-full text-center space-y-1">
        <h3 className="font-medium text-sm line-clamp-1 break-all" title={document.file_name}>
          {isRenaming ? <Loader2 className="h-3 w-3 inline mr-1 animate-spin" /> : null}
          {document.file_name}
        </h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
          <span>{formatFileSize(document.file_size)}</span>
          <span>{format(new Date(document.updated_at), "MMM d, yyyy")}</span>
        </div>
      </div>
    </div>
  );
}
