
"use client";

import { useState, useCallback, useMemo, useEffect, useRef, createContext, useContext } from 'react';
import type { Graph, DijkstraStep, AIStyle } from '@/lib/types';
import { dijkstra } from '@/lib/dijkstra';
import { optimizeRouteRendering, type OptimizeRouteRenderingInput } from '@/ai/flows/optimize-route-rendering';
import { useToast } from "@/hooks/use-toast";

type Status = 'selecting-start' | 'selecting-end' | 'ready' | 'running' | 'paused' | 'finished';

const parseAIStyle = (styleString: string): AIStyle => {
  const style: AIStyle = { color: '#20B2AA', thickness: 3, glow: false };
  try {
    const instructions = styleString.toLowerCase().split('\n').map(s => s.replace(/^-/, '').trim());
    instructions.forEach(instruction => {
      const [key, value] = instruction.split(':').map(s => s.trim());
      if (key.includes('color')) {
        const colorMatch = value.match(/(#[0-9a-f]{6})/);
        if (colorMatch) style.color = colorMatch[0];
      } else if (key.includes('thickness')) {
        const thicknessMatch = value.match(/(\d+)/);
        if (thicknessMatch) style.thickness = parseInt(thicknessMatch[0], 10);
      } else if (key.includes('effects')) {
        if (value.includes('glow')) {
          style.glow = true;
        }
      }
    });
  } catch (error) {
    console.error("Failed to parse AI style string:", styleString, error);
    return { color: '#20B2AA', thickness: 4, glow: true };
  }
  return style;
};


type DijkstraVisualizerContextType = ReturnType<typeof useDijkstraVisualizerLogic>;

const DijkstraVisualizerContext = createContext<DijkstraVisualizerContextType | null>(null);

export const useDijkstraVisualizer = (graph?: Graph) => {
    const context = useContext(DijkstraVisualizerContext);
    if (!context) {
        if (!graph) {
            throw new Error("useDijkstraVisualizer must be used within a DijkstraVisualizerProvider or be provided with a graph");
        }
        // This path should not be taken if used correctly
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
  const [status, setStatus] = useState<Status>('selecting-start');
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
  
  const reset = useCallback(() => {
    clearTimer();
    setStatus('selecting-start');
    setStartNode(null);
    setEndNode(null);
    setSteps([]);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setShortestPath([]);
    setAiStyle(null);
  }, []);

  const run = useCallback(async (start: string, end: string) => {
    setStatus('running');
    setIsPlaying(true);
    setCurrentStepIndex(0);
    const dijkstraSteps = dijkstra(graph, start, end);
    setSteps(dijkstraSteps);
    const finalStep = dijkstraSteps[dijkstraSteps.length - 1];
    const finalPath = finalStep?.path ?? [];
    setShortestPath(finalPath);
    
    if (finalPath.length > 0) {
      if (process.env.NEXT_PUBLIC_ENABLE_AI_FEATURE === 'true') {
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
         setAiStyle({ color: '#20B2AA', thickness: 4, glow: true });
      }
    } else {
        toast({
          title: "No Path Found",
          description: "A path could not be found between the selected nodes.",
          variant: "destructive",
        });
    }

  }, [graph, toast]);

  useEffect(() => {
    if (startNode && endNode) {
        run(startNode, endNode);
    }
  }, [startNode, endNode, run]);

  useEffect(() => {
    if (isPlaying && (status === 'running' || status === 'paused')) {
        if (status === 'paused') {
            clearTimer();
            return;
        }
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
    if (status === 'running' || status === 'paused') return;

    if (status === 'selecting-start' || status === 'finished' || !startNode) {
      reset();
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
    }
  }, [status, startNode, toast, reset]);

  const stepForward = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setIsPlaying(false);
      setStatus('paused');
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      if(newIndex === steps.length - 1) {
        setStatus('finished');
      }
    }
  }, [currentStepIndex, steps.length]);

  const stepBackward = useCallback(() => {
    if (currentStepIndex > 0) {
      setIsPlaying(false);
      setStatus('paused');
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const togglePlayPause = useCallback(() => {
    if (status === 'finished') return;

    if (isPlaying) {
      setStatus('paused');
    } else {
      if(currentStepIndex === steps.length -1 && steps.length > 0) {
        setCurrentStepIndex(0);
      }
      setStatus('running');
    }
    setIsPlaying(prev => !prev);
  }, [isPlaying, status, currentStepIndex, steps.length]);

  const currentStep = useMemo(() => steps[currentStepIndex], [steps, currentStepIndex]);
  const nodeStates = useMemo(() => {
    const states: Record<string, string> = {};
    
    if (status === 'finished' && shortestPath.length > 0) {
        shortestPath.forEach(id => states[id] = 'path');
        if (startNode) states[startNode] = 'start';
        if (endNode) states[endNode] = 'end';
        return states;
    }

    if (!currentStep) {
      if (startNode) states[startNode] = 'start';
      if (endNode) states[endNode] = 'end';
      return states;
    };

    currentStep.visited.forEach(id => states[id] = 'visited');
    
    if (currentStep.currentNodeId) {
        states[currentStep.currentNodeId] = 'current';
    }
    if (currentStep.type === 'neighbor' && currentStep.neighbor) {
        states[currentStep.neighbor] = 'neighbor';
    }

    if (startNode) states[startNode] = 'start';
    if (endNode) states[endNode] = 'end';

    return states;
  }, [currentStep, startNode, endNode, status, shortestPath]);

  const edgeStates = useMemo(() => {
    const states: Record<string, string> = {};

    if (status === 'finished' && shortestPath.length > 1) {
      for (let i = 0; i < shortestPath.length - 1; i++) {
        const source = shortestPath[i];
        const target = shortestPath[i+1];
        const edge = graph.edges.find(e => (e.source === source && e.target === target) || (e.source === target && e.target === source));
        if (edge) states[edge.id] = 'path';
      }
      return states;
    }

    if(!currentStep) return states;

    if (currentStep.type === 'neighbor' && currentStep.currentNodeId && currentStep.neighbor) {
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
    run,
    reset,
    stepForward,
    stepBackward,
    togglePlayPause,
  };
};