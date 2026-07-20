import { useState, useEffect, useRef, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { apiFetch } from "@/api/client";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Search, Loader2, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ForceGraph2D from "react-force-graph-2d";
import { useWindowSize } from "@/hooks/use-window-size";

export const Route = createFileRoute("/_authenticated/knowledge")({ component: Page });


function Page() {
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fgRef = useRef<any>();
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  
  useEffect(() => {
    loadGraph();
  }, []);

  useEffect(() => {
    if (containerRef) {
      const { clientWidth, clientHeight } = containerRef;
      setDimensions({ width: clientWidth, height: clientHeight || 600 });
      
      const handleResize = () => {
        setDimensions({ width: containerRef.clientWidth, height: containerRef.clientHeight || 600 });
      };
      
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [containerRef]);

  const getProjectId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");

    let { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id")
      .limit(1);

    if (projectsError) throw projectsError;
    
    let projectId = projects?.[0]?.id;

    if (!projectId) {
      const { data: newProject, error: createProjectError } = await supabase
        .from("projects")
        .insert({ name: "Personal", user_id: session.user.id })
        .select("id")
        .single();
        
      if (createProjectError) throw createProjectError;
      projectId = newProject.id;
    }
    return projectId;
  };

  const loadGraph = async () => {
    setIsLoading(true);
    try {
      const projectId = await getProjectId();
      const data = await apiFetch(`/graph/${projectId}`);
      if (data && data.nodes) {
        setGraphData(data);
      } else {
        setGraphData({ nodes: [], links: [] });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load knowledge graph.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const projectId = await getProjectId();
      await apiFetch(`/graph/${projectId}/sync`, { method: "POST" });
      toast.success("Graph sync started. Refresh in a moment.");
      setTimeout(loadGraph, 2000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync knowledge graph.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    if (fgRef.current) {
      // Center on node
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(8, 2000);
    }
  }, []);

  const handleZoomIn = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom * 1.5, 400);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom / 1.5, 400);
    }
  };

  const handleFit = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 20);
    }
  };

  // Filter graph data based on search
  const filteredData = searchQuery.trim() ? {
    nodes: graphData.nodes.filter(n => n.name?.toLowerCase().includes(searchQuery.toLowerCase()) || n.label?.toLowerCase().includes(searchQuery.toLowerCase())),
    links: graphData.links
  } : graphData;

  // Render logic for nodes
  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name || node.label || node.id;
    const fontSize = 12/globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

    const isMatch = searchQuery && label.toLowerCase().includes(searchQuery.toLowerCase());
    const isSelected = selectedNode?.id === node.id;

    ctx.fillStyle = isSelected ? 'rgba(6, 182, 212, 0.8)' : isMatch ? 'rgba(234, 179, 8, 0.8)' : 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isSelected ? '#000' : isMatch ? '#000' : '#d4d4d8';
    ctx.fillText(label, node.x, node.y);

    node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
  };

  return (
    <ModulePage>
      <ModuleHeader eyebrow="Knowledge Graph" title="Your ideas, connected." description="Entities and relationships, visually traversable." hue="ai-cyan" />
      
      <div className="mt-8 flex flex-col h-[calc(100vh-220px)] bg-surface rounded-2xl border overflow-hidden relative">
        <div className="p-4 border-b flex items-center justify-between bg-background/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search nodes..." 
                className="pl-9 h-9"
              />
            </div>
            
            <div className="flex items-center gap-1 border border-border/50 rounded-md p-1 bg-background">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} title="Zoom In"><ZoomIn className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} title="Zoom Out"><ZoomOut className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFit} title="Fit to Screen"><Maximize className="h-4 w-4" /></Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {graphData.nodes.length > 0 && (
              <span className="text-xs text-muted-foreground font-medium mr-2">
                {graphData.nodes.length} nodes, {graphData.links.length} links
              </span>
            )}
            <Button variant="outline" size="sm" onClick={loadGraph} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button size="sm" onClick={handleSync} disabled={isSyncing} className="bg-ai-cyan hover:bg-ai-cyan/90 text-cyan-950">
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Graph
            </Button>
          </div>
        </div>

        <div className="flex-1 relative" ref={setContainerRef}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <p>No knowledge graph data found.</p>
              <p className="text-sm mt-2">Click "Sync Graph" to extract entities from your documents and notes.</p>
            </div>
          ) : (
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeLabel={(node: any) => `${node.label || node.name || 'Entity'}\n${node.description || ''}`}
              nodeColor={() => "#06b6d4"}
              linkColor={() => "rgba(255,255,255,0.15)"}
              linkDirectionalArrowLength={3.5}
              linkDirectionalArrowRelPos={1}
              onNodeClick={handleNodeClick}
              nodeCanvasObject={nodeCanvasObject}
              nodePointerAreaPaint={(node: any, color, ctx) => {
                ctx.fillStyle = color;
                const bckgDimensions = node.__bckgDimensions;
                if (bckgDimensions) {
                  ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
                }
              }}
              linkCanvasObjectMode={() => 'after'}
              linkCanvasObject={(link: any, ctx, globalScale) => {
                const MAX_FONT_SIZE = 4;
                const LABEL_NODE_MARGIN = fgRef.current?.zoom() * 1.5;
                if (!link.label) return;
                
                const start = link.source;
                const end = link.target;
                
                if (typeof start !== 'object' || typeof end !== 'object') return;
                
                const textPos = Object.assign(...['x', 'y'].map(c => ({
                  [c]: start[c] + (end[c] - start[c]) / 2
                })));
                
                const relLink = { x: end.x - start.x, y: end.y - start.y };
                const maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - LABEL_NODE_MARGIN * 2;
                
                let textAngle = Math.atan2(relLink.y, relLink.x);
                if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
                if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);
                
                const label = link.label;
                const fontSize = Math.min(MAX_FONT_SIZE, maxTextLength / label.length);
                
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                
                ctx.save();
                ctx.translate(textPos.x, textPos.y);
                ctx.rotate(textAngle);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, 0, 0);
                ctx.restore();
              }}
            />
          )}

          {selectedNode && (
            <div className="absolute right-4 top-4 w-72 bg-background/95 backdrop-blur shadow-lg border rounded-xl p-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm truncate">{selectedNode.name || selectedNode.label || selectedNode.id}</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedNode(null)}>✕</Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-2">
                {selectedNode.type && <p><strong className="text-foreground">Type:</strong> {selectedNode.type}</p>}
                {selectedNode.description && <p><strong className="text-foreground">Description:</strong> {selectedNode.description}</p>}
                <p><strong className="text-foreground">ID:</strong> {selectedNode.id}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModulePage>
  );
}
