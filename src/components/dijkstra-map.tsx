
"use client";

import * as React from 'react';
import type { Graph, AIStyle, DijkstraStep } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


interface DijkstraMapProps {
  graph: Graph;
  nodeStates: Record<string, string>;
  edgeStates: Record<string, string>;
  onNodeClick: (nodeId: string) => void;
  aiStyle: AIStyle | null;
  currentStep: DijkstraStep | null;
  shortestPath: string[];
}

const stateColors = {
  default: "hsl(var(--muted-foreground))",
  start: "#22c55e",
  end: "#f97373",
  visited: "hsl(var(--secondary-foreground) / 0.5)",
  current: "hsl(var(--primary))",
  neighbor: "hsl(var(--primary))",
  path: "#eab308",
};

const INITIAL_VIEWBOX = { x: 0, y: 0, width: 800, height: 900 };

export function DijkstraMap({ graph, nodeStates, edgeStates, onNodeClick, aiStyle, currentStep, shortestPath }: DijkstraMapProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const isMobile = useIsMobile();
  
  const [viewBox, setViewBox] = React.useState(INITIAL_VIEWBOX);
  const [isPanning, setIsPanning] = React.useState(false);
  const [startPoint, setStartPoint] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Use a timeout to ensure the DOM is ready for getBBox
    const timer = setTimeout(() => {
      try {
        const bbox = svg.getBBox();
        const padding = 50; 
        setViewBox({
          x: bbox.x - padding,
          y: bbox.y - padding,
          width: bbox.width + padding * 2,
          height: bbox.height + padding * 2,
        });
      } catch(e) {
        // Fallback if getBBox fails
        setViewBox(INITIAL_VIEWBOX);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [graph]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const CTM = svgRef.current?.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - CTM.e) / CTM.a,
      y: (clientY - CTM.f) / CTM.d
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    let point;
    if ('touches' in e) {
      if (e.touches.length > 1) return;
      point = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      if (e.button !== 0) return;
      point = { x: e.clientX, y: e.clientY };
    }
    
    setIsPanning(true);
    setStartPoint(point);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning) return;
    
    let currentPoint;
     if ('touches' in e) {
      if (e.touches.length > 1) return;
      currentPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      currentPoint = { x: e.clientX, y: e.clientY };
    }

    const svgWidth = svgRef.current!.clientWidth;
    const svgHeight = svgRef.current!.clientHeight;

    const dx = (currentPoint.x - startPoint.x) * (viewBox.width / svgWidth);
    const dy = (currentPoint.y - startPoint.y) * (viewBox.height / svgHeight);


    setViewBox(vb => ({ ...vb, x: vb.x - dx, y: vb.y - dy }));
    setStartPoint(currentPoint);
  };
  
  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) {
        // If Ctrl/Cmd key is not pressed, don't zoom, let the page scroll
        return;
    }
    e.preventDefault();
    const point = getPoint(e);
    const scale = e.deltaY < 0 ? 0.9 : 1.1;

    setViewBox(vb => {
      const newWidth = vb.width * scale;
      const newHeight = vb.height * scale;
      return {
        width: newWidth,
        height: newHeight,
        x: vb.x + (point.x - vb.x) * (1 - scale),
        y: vb.y + (point.y - vb.y) * (1 - scale)
      };
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => handleMouseDown(e);
  const handleTouchMove = (e: React.TouchEvent) => handleMouseMove(e);
  const handleTouchEnd = () => handleMouseUp();


  const pathD = React.useMemo(() => {
    if (shortestPath.length < 2) return '';
    let d = '';
    for (let i = 0; i < shortestPath.length - 1; i++) {
        const sourceNode = graph.nodes.find(n => n.id === shortestPath[i]);
        const targetNode = graph.nodes.find(n => n.id === shortestPath[i + 1]);
        if (sourceNode && targetNode) {
            d += `M ${sourceNode.x} ${sourceNode.y} L ${targetNode.x} ${targetNode.y} `;
        }
    }
    return d.trim();
  }, [shortestPath, graph.nodes]);


  return (
    <svg 
      ref={svgRef} 
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} 
      className={cn("w-full h-full rounded-lg bg-card", isPanning ? "cursor-grabbing" : "cursor-grab")}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <defs>
        {aiStyle?.glow && (
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        )}
      </defs>

      {/* Edges */}
      <g>
        {graph.edges.map(edge => {
          const sourceNode = graph.nodes.find(n => n.id === edge.source);
          const targetNode = graph.nodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;
          const state = edgeStates[edge.id];
          if (state === 'path') return null; // Path edges are rendered separately

          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;

          return (
            <g key={edge.id}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  className={cn(
                    "stroke-muted transition-all duration-300",
                    {
                      "stroke-[#38bdf8] stroke-2": state === 'active',
                    }
                  )}
                />
                 {!isMobile && <text
                    x={midX}
                    y={midY - 5}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-muted-foreground pointer-events-none"
                    >
                    {Math.round(edge.weight)}
                </text>}
            </g>
          );
        })}
      </g>

       {/* Shortest Path Edge */}
      {aiStyle && pathD && (
         <path 
            d={pathD}
            stroke={aiStyle.color}
            strokeWidth={aiStyle.thickness}
            strokeLinecap="round"
            fill="none"
            filter={aiStyle.glow ? "url(#glow)" : "none"}
            className="transition-all duration-500"
         />
      )}

      {/* Nodes */}
      <g>
        {graph.nodes.map(node => {
          const state = nodeStates[node.id] || 'default';
          const isPathNode = state === 'path';
          const isStartOrEnd = state === 'start' || state === 'end';
          const isCurrent = state === 'current';

          const baseRadius = isMobile ? 12 : 8;
          const activeRadius = isMobile ? 16 : 12;

          const distance = currentStep?.distances[node.id];
          const showDistance = distance !== undefined && distance !== Infinity && distance > 0;
          
          return (
            <g key={node.id} onClick={() => onNodeClick(node.id)} className="cursor-pointer group">
              <circle
                cx={node.x}
                cy={node.y}
                r={isPathNode || isStartOrEnd || isCurrent ? activeRadius : baseRadius}
                fill={stateColors[state as keyof typeof stateColors] || stateColors.default}
                stroke="hsl(var(--card-bg))"
                strokeWidth="2"
                className="transition-all duration-300"
              />
              <text
                x={node.x}
                y={node.y - (isMobile ? 22 : 18)}
                textAnchor="middle"
                className={cn(
                  "text-xs font-sans fill-foreground pointer-events-none",
                  isMobile && "text-[14px]"
                )}
              >
                {node.name}
              </text>
               {showDistance && !isStartOrEnd && (
                <text
                  x={node.x}
                  y={node.y + (isMobile ? 28 : 24)}
                  textAnchor="middle"
                  className={cn(
                    "text-xs font-mono fill-[#38bdf8] pointer-events-none",
                     isMobile && "text-[12px]"
                  )}
                >
                  {Math.round(distance)}
                </text>
              )}
            </g>
          );
        })}
      </g>
      <text x={viewBox.x + 15} y={viewBox.y + viewBox.height - 15} className="text-[12px] fill-muted-foreground pointer-events-none">
        Use Ctrl/Cmd + Scroll to zoom
      </text>
    </svg>
  );
}
