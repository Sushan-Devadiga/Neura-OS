import { useState } from "react";
import { Memory } from "@/types/memory";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pin, 
  PinOff, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  BrainCircuit,
  Lightbulb,
  Crosshair,
  Code2,
  PenTool,
  Network,
  BookOpen
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MemoryCardProps {
  memory: Memory;
  onUpdate: (id: string, updates: Partial<Memory>) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'preference': Lightbulb,
  'project decision': Network,
  'architecture': BrainCircuit,
  'goal': Crosshair,
  'fact': BookOpen,
  'coding style': Code2,
  'writing style': PenTool
};

export function MemoryCard({ memory, onUpdate, onDelete }: MemoryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(memory.content);
  const [editCategory, setEditCategory] = useState<string>(memory.category);
  const [editImportance, setEditImportance] = useState<string>(memory.importance);

  const Icon = CATEGORY_ICONS[memory.category] || BookOpen;

  const handleSave = () => {
    onUpdate(memory.id, {
      content: editContent,
      category: editCategory as any,
      importance: editImportance as any,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(memory.content);
    setEditCategory(memory.category);
    setEditImportance(memory.importance);
    setIsEditing(false);
  };

  return (
    <Card className={`relative transition-all duration-200 border-border/50 ${memory.is_pinned ? 'border-primary/50 shadow-sm bg-primary/5' : 'hover:border-border'} ${memory.is_archived ? 'opacity-60 grayscale-[0.3]' : ''}`}>
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="flex flex-wrap gap-2">
          {!isEditing ? (
            <>
              <Badge variant="outline" className="bg-surface capitalize flex items-center gap-1.5">
                <Icon className="w-3 h-3" />
                {memory.category}
              </Badge>
              <Badge 
                variant={memory.importance === 'high' ? 'destructive' : memory.importance === 'medium' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {memory.importance}
              </Badge>
              {memory.is_pinned && (
                <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-1">
                  <Pin className="w-3 h-3" /> Pinned
                </Badge>
              )}
            </>
          ) : (
            <div className="flex gap-2 w-full">
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="h-8 text-xs w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CATEGORY_ICONS).map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={editImportance} onValueChange={setEditImportance}>
                <SelectTrigger className="h-8 text-xs w-[100px]">
                  <SelectValue placeholder="Importance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1 -mt-1 -mr-1">
          {!isEditing && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => onUpdate(memory.id, { is_pinned: !memory.is_pinned })}
                title={memory.is_pinned ? "Unpin memory" : "Pin memory"}
              >
                {memory.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        {isEditing ? (
          <Textarea 
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[100px] text-sm resize-y"
          />
        ) : (
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {memory.content}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(memory.updated_at), { addSuffix: true })}
        </span>
        
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 px-2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="h-8 px-2">
                <Check className="h-4 w-4 mr-1" /> Save
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => onUpdate(memory.id, { is_archived: !memory.is_archived })}
                title={memory.is_archived ? "Restore memory" : "Archive memory"}
              >
                {memory.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(memory.id)}
                title="Delete memory"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
