
"use client";

import * as React from 'react';
import type { Graph, AIStyle, DijkstraStep } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


interface DijkstraMapProps {
  graph: Graph; // The graph data (nodes and edges).
  nodeStates: Record<string, string>; // A map of nodeId to its current state (e.g., 'visited', 'path').
  edgeStates: Record<string, string>; // A map of edgeId to its current state (e.g., 'active').
  onNodeClick: (nodeId: string) => void; // Callback function for when a node is clicked.
  aiStyle: AIStyle | null; // The AI-generated style for the shortest path.
  currentStep: DijkstraStep | null; // The current step of the Dijkstra visualization.
  shortestPath: string[]; // An array of node IDs representing the final shortest path.
}

// A mapping of node/edge states to their corresponding colors.
const stateColors = {
  default: "hsl(var(--muted-foreground))",
  start: "#22c55e", // Green
  end: "#f97373",   // Red
  visited: "hsl(var(--secondary-foreground) / 0.5)",
  current: "hsl(var(--primary))",
  neighbor: "hsl(var(--primary))",
  path: "#eab308", // Yellow
};

// The initial viewbox settings for the SVG map.
const INITIAL_VIEWBOX = { x: 0, y: 0, width: 800, height: 900 };

/**
 * The `DijkstraMap` component is responsible for rendering the SVG map,
 * including the nodes, edges, and the visualization of the algorithm.
 * It also handles user interactions like panning and zooming.
 */
export function DijkstraMap({ graph, nodeStates, edgeStates, onNodeClick, aiStyle, currentStep, shortestPath }: DijkstraMapProps) {
  const svgRef = React.useRef<SVGSVGElement>(null); // A ref to the SVG element for direct DOM manipulation.
  const isMobile = useIsMobile(); // A custom hook to check if the user is on a mobile device.
  
  // State for the SVG viewbox, which controls the pan and zoom level.
  const [viewBox, setViewBox] = React.useState(INITIAL_VIEWBOX);
  // State to track if the user is currently panning the map.
  const [isPanning, setIsPanning] = React.useState(false);
  // State to store the starting point of a pan gesture.
  const [startPoint, setStartPoint] = React.useState({ x: 0, y: 0 });

  /**
   * This `useEffect` hook runs once when the graph data changes.
   * It calculates the initial viewbox to fit all the nodes on the screen.
   */
  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Use a timeout to ensure the browser has rendered the SVG and can calculate its bounding box.
    const timer = setTimeout(() => {
      try {
        const bbox = svg.getBBox(); // Gets the bounding box of all elements in the SVG.
        const padding = 50; // Add some padding around the edges.
        setViewBox({
          x: bbox.x - padding,
          y: bbox.y - padding,
          width: bbox.width + padding * 2,
          height: bbox.height + padding * 2,
        });
      } catch(e) {
        // Fallback to the initial viewbox if getBBox fails for any reason.
        setViewBox(INITIAL_VIEWBOX);
      }
    }, 0);

    return () => clearTimeout(timer); // Cleanup: clear the timeout if the component unmounts.
  }, [graph]);

  /**
   * A helper function to convert screen coordinates (like from a mouse click)
   * into SVG coordinates, accounting for the current pan and zoom (viewBox).
   */
  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const CTM = svgRef.current?.getScreenCTM(); // Get the Current Transformation Matrix of the SVG.
    if (!CTM) return { x: 0, y: 0 };
    
    // Determine the clientX/Y from either a mouse or touch event.
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Apply the inverse transformation to get the point in SVG space.
    return {
      x: (clientX - CTM.e) / CTM.a,
      y: (clientY - CTM.f) / CTM.d
    };
  };

  // --- PAN AND ZOOM HANDLERS ---

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    let point;
    // For touch events, only pan with a single finger.
    if ('touches' in e) {
      if (e.touches.length > 1) return;
      point = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      if (e.button !== 0) return; // Only pan with the left mouse button.
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

    // Calculate the change in position, scaled by the current zoom level.
    const dx = (currentPoint.x - startPoint.x) * (viewBox.width / svgWidth);
    const dy = (currentPoint.y - startPoint.y) * (viewBox.height / svgHeight);

    // Update the viewbox's x and y coordinates to pan the map.
    setViewBox(vb => ({ ...vb, x: vb.x - dx, y: vb.y - dy }));
    setStartPoint(currentPoint); // Update the start point for the next move event.
  };
  
  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom if the Ctrl or Cmd key is pressed. This allows normal page scrolling otherwise.
    if (!e.ctrlKey && !e.metaKey) {
        return;
    }
    e.preventDefault(); // Prevent the default scroll-to-zoom browser behavior.
    const point = getPoint(e); // Get the cursor position in SVG coordinates.
    const scale = e.deltaY < 0 ? 0.9 : 1.1; // Zoom in or out based on wheel direction.

    // Update the viewbox to zoom in/out, centered on the cursor's position.
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

  // Touch event handlers that map to their mouse equivalents.
  const handleTouchStart = (e: React.TouchEvent) => handleMouseDown(e);
  
  const handleTouchMove = (e: React.TouchEvent) => {
    // This is crucial for mobile: it prevents the whole page from scrolling while panning the map.
    e.preventDefault(); 
    handleMouseMove(e);
  };

  const handleTouchEnd = () => handleMouseUp();


  /**
   * `useMemo` is used here to optimize the calculation of the SVG path `d` attribute.
   * This calculation only re-runs when the `shortestPath` or `graph.nodes` change,
   * not on every single render.
   */
  const pathD = React.useMemo(() => {
    if (shortestPath.length < 2) return '';
    let d = '';
    // Build the SVG path data string by drawing lines between consecutive nodes in the path.
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
      // Attach all the pan and zoom event handlers to the SVG element.
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
      {/* SVG definitions, like filters, go in a `<defs>` block. */}
      <defs>
        {/* This filter is only defined if the AI style requests a glow effect. */}
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

      {/* Render all the graph edges. */}
      <g>
        {graph.edges.map(edge => {
          const sourceNode = graph.nodes.find(n => n.id === edge.source);
          const targetNode = graph.nodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;
          const state = edgeStates[edge.id];
          // Path edges are rendered separately in the `pathD` element for styling, so skip them here.
          if (state === 'path') return null;

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
                    { // Conditionally apply classes based on the edge's state.
                      "stroke-[#38bdf8] stroke-2": state === 'active',
                    }
                  )}
                />
                 {/* Show the edge weight (distance) on non-mobile devices. */}
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

       {/* Render the final shortest path using the AI-generated style. */}
      {aiStyle && pathD && (
         <path 
            d={pathD}
            stroke={aiStyle.color}
            strokeWidth={aiStyle.thickness}
            strokeLinecap="round"
            fill="none"
            filter={aiStyle.glow ? "url(#glow)" : "none"} // Apply the glow filter if specified.
            className="transition-all duration-500"
         />
      )}

      {/* Render all the graph nodes on top of the edges. */}
      <g>
        {graph.nodes.map(node => {
          const state = nodeStates[node.id] || 'default';
          const isPathNode = state === 'path';
          const isStartOrEnd = state === 'start' || state === 'end';
          const isCurrent = state === 'current';

          // Use larger radii on mobile for better touch interaction.
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
               {/* Show the calculated distance during the visualization. */}
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
      {/* A small hint for the user on how to zoom. */}
      <text x={viewBox.x + 15} y={viewBox.y + viewBox.height - 15} className="text-[12px] fill-muted-foreground pointer-events-none">
        Use Ctrl/Cmd + Scroll to zoom
      </text>
    </svg>
  );
}
