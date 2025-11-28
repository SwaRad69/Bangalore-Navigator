
"use client";

import { useState, useCallback, useMemo, useEffect, useRef, createContext, useContext } from 'react';
import type { Graph, DijkstraStep, AIStyle } from '@/lib/types';
import { dijkstra } from '@/lib/dijkstra';
import { optimizeRouteRendering, type OptimizeRouteRenderingInput } from '@/ai/flows/optimize-route-rendering';
import { useToast } from "@/hooks/use-toast";

type Status = 'idle' | 'selecting-start' | 'selecting-end' | 'ready' | 'running' | 'paused' | 'finished';

const parseAIStyle = (styleString: string): AIStyle => {
  const style: AIStyle = { color: '#20B2AA', thickness: 3, glow: false };
  try {
    styleString.split(';').forEach(part => {
      const [key, value] = part.split(':').map(s => s.trim());
      if (key.toLowerCase() === 'color') style.color = value;
      else if (key.toLowerCase() === 'line thickness') style.thickness = parseInt(value, 10) || 3;
      else if (key.toLowerCase() === 'special effects' && value.toLowerCase().includes('glow')) {
        style.glow = true;
      }
    });
  } catch (error) {
    console.error("Failed to parse AI style string:", error);
    return { color: '#20B2AA', thickness: 4, glow: true };
  }
  return style;
};


type DijkstraVisualizerContextType = ReturnType<typeof useDijkstraVisualizerLogic>;

const DijkstraVisualizerContext = createContext<DijkstraVisualizerContextType | null>(null);

export const useDijkstraVisualizer = (graph?: Graph) => {
    const context = useContext(DijkstraVisualizerContext);
    if (!context) {
        // This is a bit of a hack to allow the component to be used without a provider
        // for the simple case where the graph is passed in directly.
        // In a real app, you'd likely enforce the provider.
        if (!graph) {
            throw new Error("useDijkstraVisualizer must be used within a DijkstraVisualizerProvider or be provided with a graph");
        }
        // This is a special case to create a "local" instance of the hook.
        // We can't call the hook conditionally, so we have this workaround.
        // This is not ideal and in a larger app, we'd enforce the provider pattern.
        return useDijkstraVisualizerLogic(graph);
    }
    return context;
};

export const DijkstraVisualizerProvider = ({ graph, children }: { graph: Graph, children: React.ReactNode }) => {
    const value = useDijkstraVisualizerLogic(graph);
    return (
        <DijkstraVisualizerContext.Provider value={value}>
            {children}
        </DijkstraVisualizerContext.Provider>
    );
};


const useDijkstraVisualizerLogic = (graph: Graph) => {
  const [status, setStatus] = useState<Status>('idle');
  const [startNode, setStartNode] = useState<string | null>(null);
  const [endNode, setEndNode] = useState<string | null>(null);
  const [steps, setSteps] = useState<DijkstraStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shortestPath, setShortestPath] = useState<string[]>([]);
  const [aiStyle, setAiStyle] = useState<AIStyle | null>(null);

  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (isPlaying && status === 'running') {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            setStatus('finished');
            clearTimer();
            return prev;
          }
        });
      }, 500);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isPlaying, status, steps.length]);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (status === 'selecting-start') {
      setStartNode(nodeId);
      setStatus('selecting-end');
      toast({ title: "Start node selected", description: "Now select the end node." });
    } else if (status === 'selecting-end') {
      if (nodeId === startNode) {
        toast({ title: "Invalid Selection", description: "End node cannot be the same as the start node.", variant: "destructive" });
        return;
      }
      setEndNode(nodeId);
      setStatus('ready');
      toast({ title: "End node selected", description: "Ready to run the algorithm." });
    }
  }, [status, startNode, toast]);

  const setSelectionMode = useCallback((mode: 'start' | 'end') => {
    if (mode === 'start') {
      setStatus('selecting-start');
      setStartNode(null);
      setEndNode(null);
      setShortestPath([]);
      setAiStyle(null);
      setCurrentStepIndex(0);
      setSteps([]);
      setIsPlaying(false);
      clearTimer();
      toast({ title: "Select Start Node", description: "Click a node on the map to set it as the starting point." });
    } else if (mode === 'end') {
      if (!startNode) {
        toast({ title: "Select Start First", description: "You must select a start point before an end point.", variant: "destructive" });
      } else {
        setStatus('selecting-end');
        toast({ title: "Select End Node", description: "Click a node on the map to set it as the destination." });
      }
    }
  }, [startNode, toast]);

  const run = useCallback(async () => {
    if (!startNode || !endNode) return;
    setStatus('running');
    setIsPlaying(true);
    const dijkstraSteps = dijkstra(graph, startNode, endNode);
    setSteps(dijkstraSteps);
    const finalPath = dijkstraSteps[dijkstraSteps.length - 1]?.path ?? [];
    setShortestPath(finalPath);
    
    if (finalPath.length > 0) {
      try {
        const input: OptimizeRouteRenderingInput = {
          mapWidth: 800,
          mapHeight: 900,
          shortestPath: finalPath.join(' -> '),
          graphComplexity: 'medium',
          pointOcclusion: false,
        };
        const result = await optimizeRouteRendering(input);
        const style = parseAIStyle(result.renderingInstructions);
        setAiStyle(style);
      } catch (e) {
        console.error("AI style generation failed:", e);
        setAiStyle({ color: '#20B2AA', thickness: 4, glow: true });
        toast({
          title: "AI Feature Offline",
          description: "Could not generate optimal route style. Using default style.",
          variant: "destructive",
        });
      }
    } else {
        toast({
          title: "No Path Found",
          description: "A path could not be found between the selected nodes.",
          variant: "destructive",
        });
    }

  }, [graph, startNode, endNode, toast]);

  const reset = useCallback(() => {
    setStatus('idle');
    setStartNode(null);
    setEndNode(null);
    setSteps([]);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setShortestPath([]);
    setAiStyle(null);
    clearTimer();
  }, []);

  const stepForward = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      if(currentStepIndex === steps.length - 2) {
        setStatus('finished');
        setIsPlaying(false);
      }
    }
  }, [currentStepIndex, steps.length]);

  const stepBackward = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const togglePlayPause = useCallback(() => {
    if (status === 'finished') return;
    if (isPlaying) {
      setStatus('paused');
    } else {
      if(currentStepIndex === steps.length -1) {
        setCurrentStepIndex(0);
      }
      setStatus('running');
    }
    setIsPlaying(prev => !prev);
  }, [isPlaying, status, currentStepIndex, steps.length]);

  const currentStep = useMemo(() => steps[currentStepIndex], [steps, currentStepIndex]);
  const nodeStates = useMemo(() => {
    const states: Record<string, string> = {};
    if (!currentStep) {
        if (startNode) states[startNode] = 'start';
        if (endNode) states[endNode] = 'end';
        return states;
    }

    if(status === 'finished') {
      shortestPath.forEach(id => states[id] = 'path');
    } else {
       currentStep.visited.forEach(id => states[id] = 'visited');
       if (currentStep.currentNodeId) {
        states[currentStep.currentNodeId] = 'current';
       }
       if (currentStep.type === 'neighbor' && currentStep.neighbor) {
        states[currentStep.neighbor] = 'neighbor';
       }
    }
    if (startNode) states[startNode] = 'start';
    if (endNode) states[endNode] = 'end';

    return states;
  }, [currentStep, startNode, endNode, status, shortestPath]);

  const edgeStates = useMemo(() => {
    const states: Record<string, string> = {};
    if(!currentStep) return states;

    if (status === 'finished' && shortestPath.length > 1) {
      for (let i = 0; i < shortestPath.length - 1; i++) {
        const source = shortestPath[i];
        const target = shortestPath[i+1];
        const edge = graph.edges.find(e => (e.source === source && e.target === target) || (e.source === target && e.target === source));
        if (edge) states[edge.id] = 'path';
      }
    } else if (currentStep.type === 'neighbor' && currentStep.currentNodeId && currentStep.neighbor) {
      const edge = graph.edges.find(e => (e.source === currentStep.currentNodeId && e.target === currentStep.neighbor) || (e.source === currentStep.neighbor && e.target === currentStep.currentNodeId));
      if (edge) states[edge.id] = 'active';
    }

    return states;
  }, [currentStep, status, shortestPath, graph.edges]);


  return {
    status,
    startNode,
    endNode,
    graph,
    currentStep,
    steps,
    currentStepIndex,
    isPlaying,
    shortestPath,
    aiStyle,
    nodeStates,
    edgeStates,
    handleNodeClick,
    setSelectionMode,
    run,
    reset,
    stepForward,
    stepBackward,
    togglePlayPause,
  };
};
