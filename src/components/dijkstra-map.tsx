
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

export function DijkstraMap({ graph, nodeStates, edgeStates, onNodeClick, aiStyle, currentStep }: DijkstraMapProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = React.useState("0 0 800 900");
  const isMobile = useIsMobile();

  React.useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setViewBox(`0 0 800 ${800 * (height / width)}`);
      }
    });

    resizeObserver.observe(svgElement);
    
    // Set initial viewbox
    const { width, height } = svgElement.getBoundingClientRect();
    if (width > 0 && height > 0) {
        setViewBox(`0 0 800 ${800 * (height / width)}`);
    }


    return () => {
      resizeObserver.unobserve(svgElement);
    };
  }, []);

  const pathD = aiStyle && edgeStates ? graph.edges.filter(edge => edgeStates[edge.id] === 'path').map(edge => {
    const sourceNode = graph.nodes.find(n => n.id === edge.source);
    const targetNode = graph.nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return '';
    return `M ${sourceNode.x} ${sourceNode.y} L ${targetNode.x} ${targetNode.y}`;
  }).join(' ') : '';


  return (
    <svg ref={svgRef} viewBox={viewBox} className="w-full h-full rounded-lg bg-card cursor-pointer">
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
