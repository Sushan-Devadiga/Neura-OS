import { Prompt } from "@/types/prompt";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, StarOff, Copy, FileEdit, Trash2, FolderIcon, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface PromptCardProps {
  prompt: Prompt;
  onEdit: (prompt: Prompt) => void;
  onDelete: (promptId: string) => void;
  onToggleFavorite: (promptId: string, currentStatus: boolean) => void;
}

export function PromptCard({ prompt, onEdit, onDelete, onToggleFavorite }: PromptCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    toast.success("Prompt copied to clipboard!");
  };

  return (
    <Card className="flex flex-col h-full bg-surface border-border hover:border-border/80 transition-all hover:shadow-md group relative overflow-hidden">
      {/* Top gradient highlight for visual flair */}
      <div className="absolute top-0 left-0 right-0 h-1 gradient-signature opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="pb-3 pt-5">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-base font-semibold line-clamp-1" title={prompt.title}>
              {prompt.title}
            </CardTitle>
            {prompt.description && (
              <CardDescription className="line-clamp-2 mt-1 text-xs text-muted-foreground">
                {prompt.description}
              </CardDescription>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-yellow-500"
            onClick={() => onToggleFavorite(prompt.id, prompt.is_favorite)}
          >
            {prompt.is_favorite ? (
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-3">
        <div className="bg-background/50 rounded-md p-3 text-sm font-mono text-muted-foreground line-clamp-4 relative group-hover:text-foreground transition-colors cursor-pointer" onClick={handleCopy}>
          {prompt.content}
          
          {/* Quick copy overlay */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
            <span className="flex items-center gap-1.5 text-foreground font-sans font-medium text-xs">
              <Copy className="h-3 w-3" /> Click to Copy
            </span>
          </div>
        </div>
        
        {/* Meta Info */}
        <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
          {prompt.folder && (
            <div className="flex items-center gap-1">
              <FolderIcon className="h-3 w-3" />
              <span>{prompt.folder}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>v{prompt.version} • {formatDistanceToNow(new Date(prompt.updated_at), { addSuffix: true })}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex flex-col gap-3">
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 w-full">
            {prompt.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 font-medium">
                {tag}
              </Badge>
            ))}
            {prompt.tags.length > 3 && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                +{prompt.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex justify-end gap-1.5 w-full border-t border-border/40 pt-3">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onEdit(prompt)}>
            <FileEdit className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => onDelete(prompt.id)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
