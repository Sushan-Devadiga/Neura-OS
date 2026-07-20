import { useState } from "react";
import { ProjectDocument } from "@/types/project";
import { DocumentCard } from "./DocumentCard";
import { DocumentPreviewDialog } from "./DocumentPreviewDialog";
import { Input } from "@/components/ui/input";
import { Search, Folder } from "lucide-react";

interface DocumentListProps {
  documents: ProjectDocument[];
  onDelete: (id: string, path: string) => Promise<void>;
  onRename: (id: string, newName: string) => Promise<void>;
}

export function DocumentList({ documents, onDelete, onRename }: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [previewDocument, setPreviewDocument] = useState<ProjectDocument | null>(null);

  const filteredDocuments = documents.filter(doc => 
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Project Documents ({documents.length})</h3>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search documents..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-xl bg-surface/20 border-dashed text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Folder className="h-6 w-6 text-primary" />
          </div>
          <h4 className="text-lg font-medium">No documents yet</h4>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">
            Upload files above to store them with your project. You can add PDFs, documents, images, and text files.
          </p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center p-12 border rounded-xl bg-surface/20">
          <p className="text-muted-foreground">No documents match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredDocuments.map(doc => (
            <DocumentCard 
              key={doc.id}
              document={doc}
              onClick={setPreviewDocument}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}

      <DocumentPreviewDialog 
        document={previewDocument}
        open={!!previewDocument}
        onOpenChange={(open) => !open && setPreviewDocument(null)}
      />
    </div>
  );
}
