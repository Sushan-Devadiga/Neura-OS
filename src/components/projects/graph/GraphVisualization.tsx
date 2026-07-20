import { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { GraphData, KnowledgeNode, KnowledgeEdge } from '@/types/graph';

interface GraphVisualizationProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: KnowledgeNode) => void;
}

const NODE_COLORS: Record<string, string> = {
  project: '#3b82f6', // blue-500
  note: '#eab308',    // yellow-500
  document: '#ef4444', // red-500
  task: '#22c55e',    // green-500
  memory: '#a855f7',  // purple-500
  chat: '#06b6d4',    // cyan-500
};

export function GraphVisualization({ data, width, height, onNodeClick }: GraphVisualizationProps) {
  const fgRef = useRef<any>();
  const [isDark, setIsDark] = useState(true);
  const [dimensions, setDimensions] = useState({ width: width || 800, height: height || 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize
  useEffect(() => {
    if (width && height) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [width, height]);

  // Dark mode detection
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark') || 
                       window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(isDarkMode);
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Center graph after load
  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      setTimeout(() => {
        fgRef.current.zoomToFit(400, 50);
      }, 500);
    }
  }, [data]);

  const graphData = {
    nodes: data.nodes.map(n => ({ ...n, val: n.entity_type === 'project' ? 2 : 1 })),
    links: data.edges.map(e => ({ ...e, source: e.source_id, target: e.target_id }))
  };

  const textColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
  const linkColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Inter, sans-serif`;
    
    // Draw circle
    const color = NODE_COLORS[node.entity_type] || '#888';
    ctx.beginPath();
    ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    // Draw text
    if (globalScale > 1.5) {
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

      ctx.fillStyle = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
      ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + 7, bckgDimensions[0], bckgDimensions[1]);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.fillText(label, node.x, node.y + 7 + fontSize / 2);
    }
  }, [isDark]);

  return (
    <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden border border-border bg-surface">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="label"
        nodeColor={(node: any) => NODE_COLORS[node.entity_type] || '#888'}
        nodeCanvasObject={paintNode}
        linkColor={() => linkColor}
        linkWidth={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={d => d.weight * 0.01}
        onNodeClick={(node: any) => {
          // Center on click
          fgRef.current.centerAt(node.x, node.y, 1000);
          fgRef.current.zoom(8, 2000);
          if (onNodeClick) onNodeClick(node);
        }}
        d3VelocityDecay={0.3}
        warmupTicks={100}
        cooldownTicks={100}
      />
    </div>
  );
}
