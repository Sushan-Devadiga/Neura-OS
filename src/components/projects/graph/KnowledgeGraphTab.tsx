import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GraphData, EntityType, KnowledgeNode } from "@/types/graph";
import { apiFetch } from "@/api/client";
import { GraphVisualization } from "./GraphVisualization";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Network, Filter } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface KnowledgeGraphTabProps {
  projectId: string;
}

export function KnowledgeGraphTab({ projectId }: KnowledgeGraphTabProps) {
  const queryClient = useQueryClient();
  const [activeFilters, setActiveFilters] = useState<string[]>([
    "project", "note", "document", "task", "memory", "chat"
  ]);

  const { data: graphData, isLoading } = useQuery({
    queryKey: ["knowledge_graph", projectId],
    queryFn: async () => {
      const res = await apiFetch(`/graph/${projectId}`);
      return res.data as GraphData;
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch(`/graph/${projectId}/sync`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge_graph", projectId] });
      toast.success("Graph synchronized successfully!");
    },
    onError: (err) => {
      toast.error(`Sync failed: ${err.message}`);
    }
  });

  const filteredData: GraphData = {
    nodes: graphData?.nodes.filter(n => activeFilters.includes(n.entity_type)) || [],
    edges: graphData?.edges.filter(e => {
      // Only keep edges where both source and target nodes are in the filtered set
      const sourceNode = graphData.nodes.find(n => n.id === e.source_id || n.id === (e as any).source?.id);
      const targetNode = graphData.nodes.find(n => n.id === e.target_id || n.id === (e as any).target?.id);
      return sourceNode && targetNode && 
             activeFilters.includes(sourceNode.entity_type) && 
             activeFilters.includes(targetNode.entity_type);
    }) || []
  };

  const handleNodeClick = (node: KnowledgeNode) => {
    toast(`Clicked ${node.entity_type}: ${node.label}`);
    // Future: navigate to the actual entity or open a dialog
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-280px)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <Network className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">Knowledge Graph</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-surface/50 border border-border rounded-md px-2 py-1">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <ToggleGroup type="multiple" value={activeFilters} onValueChange={(val) => {
              if (val.length > 0) setActiveFilters(val);
            }} size="sm">
              <ToggleGroupItem value="project" aria-label="Toggle projects" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-500">Project</ToggleGroupItem>
              <ToggleGroupItem value="note" aria-label="Toggle notes" className="data-[state=on]:bg-yellow-500/20 data-[state=on]:text-yellow-500">Notes</ToggleGroupItem>
              <ToggleGroupItem value="document" aria-label="Toggle documents" className="data-[state=on]:bg-red-500/20 data-[state=on]:text-red-500">Docs</ToggleGroupItem>
              <ToggleGroupItem value="task" aria-label="Toggle tasks" className="data-[state=on]:bg-green-500/20 data-[state=on]:text-green-500">Tasks</ToggleGroupItem>
              <ToggleGroupItem value="memory" aria-label="Toggle memories" className="data-[state=on]:bg-purple-500/20 data-[state=on]:text-purple-500">Memories</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Button 
            onClick={() => syncMutation.mutate()} 
            disabled={syncMutation.isPending}
            variant="outline"
          >
            {syncMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync Graph
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-[400px] relative rounded-xl border border-border overflow-hidden bg-black/5">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filteredData.nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
            <Network className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-xl font-medium">Empty Graph</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-center">
              No knowledge nodes found for this project. Click 'Sync Graph' to extract nodes from your existing data.
            </p>
            <Button className="mt-6" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Sync Now
            </Button>
          </div>
        ) : (
          <GraphVisualization 
            data={filteredData} 
            onNodeClick={handleNodeClick}
          />
        )}
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 p-3 rounded-lg bg-background/80 backdrop-blur-md border border-border text-xs pointer-events-none">
          <div className="font-semibold mb-1 text-muted-foreground">Legend</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Project</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Notes</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Documents</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Tasks</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Memories</div>
        </div>
      </div>
    </div>
  );
}
