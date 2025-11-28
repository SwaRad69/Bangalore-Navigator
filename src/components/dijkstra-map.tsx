
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
}

const stateColors = {
  default: "hsl(var(--muted-foreground))",
  start: "hsl(var(--primary))",
  end: "hsl(var(--destructive))",
  visited: "hsl(var(--secondary-foreground))",
  current: "hsl(var(--primary))",
  neighbor: "hsl(var(--accent))",
  path: "hsl(var(--accent))",
};

const INITIAL_VIEWBOX = { x: -50, y: -50, width: 850, height: 950 };

export function DijkstraMap({ graph, nodeStates, edgeStates, onNodeClick, aiStyle, currentStep }: DijkstraMapProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const isMobile = useIsMobile();
  
  const [viewBox, setViewBox] = React.useState(INITIAL_VIEWBOX);
  const [isPanning, setIsPanning] = React.useState(false);
  const [startPoint, setStartPoint] = React.useState({ x: 0, y: 0 });

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setStartPoint({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = (e.clientX - startPoint.x) / (svgRef.current!.clientWidth / viewBox.width);
    const dy = (e.clientY - startPoint.y) / (svgRef.current!.clientHeight / viewBox.height);
    setViewBox(vb => ({ ...vb, x: vb.x - dx, y: vb.y - dy }));
    setStartPoint({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
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

  const pathD = aiStyle && edgeStates ? graph.edges.filter(edge => edgeStates[edge.id] === 'path').map(edge => {
    const sourceNode = graph.nodes.find(n => n.id === edge.source);
    const targetNode = graph.nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return '';
    return `M ${sourceNode.x} ${sourceNode.y} L ${targetNode.x} ${targetNode.y}`;
  }).join(' ') : '';


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
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
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
                      "stroke-[hsl(var(--accent))] stroke-2": state === 'active',
                    }
                  )}
                />
                 <text
                    x={midX}
                    y={midY - 5}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-muted-foreground pointer-events-none"
                    >
                    {Math.round(edge.weight)}
                </text>
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
                stroke="hsl(var(--card))"
                strokeWidth="2"
                className="transition-all duration-300"
              />
              <text
                x={node.x}
                y={node.y - (isMobile ? 20 : 18)}
                textAnchor="middle"
                className={cn(
                  "text-xs font-sans fill-foreground pointer-events-none",
                  isMobile && "text-[10px]"
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
                    "text-xs font-mono fill-primary pointer-events-none",
                     isMobile && "text-[10px]"
                  )}
                >
                  {Math.round(distance)}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
