
"use client";

import { useState, useCallback, useMemo, useEffect, useRef, createContext, useContext } from 'react';
import type { Graph, DijkstraStep, AIStyle } from '@/lib/types';
import { dijkstra } from '@/lib/dijkstra';
import { optimizeRouteRendering, type OptimizeRouteRenderingInput } from '@/ai/flows/optimize-route-rendering';
import { useToast } from "@/hooks/use-toast";

// Define the possible states of the visualizer.
type Status = 'selecting-start' | 'selecting-end' | 'running' | 'paused' | 'finished';

/**
 * A helper function to parse the AI's natural language response for styling
 * into a structured `AIStyle` object.
 * @param styleString The string response from the AI model.
 * @returns An `AIStyle` object. Returns a default style if parsing fails.
 */
const parseAIStyle = (styleString: string): AIStyle => {
  // Start with a default style.
  const style: AIStyle = { color: '#20B2AA', thickness: 3, glow: false };
  try {
    // Clean up the string and split it into lines.
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
    // If anything goes wrong, return a safe, hardcoded default style.
    return { color: '#20B2AA', thickness: 4, glow: true };
  }
  return style;
};

// --- React Context Setup ---
// Context provides a way to pass data through the component tree without having to
// pass props down manually at every level.

// Define the type for our context. It will be the return type of our main hook.
type DijkstraVisualizerContextType = ReturnType<typeof useDijkstraVisualizerLogic>;

// Create the context with an initial value of `null`.
const DijkstraVisualizerContext = createContext<DijkstraVisualizerContextType | null>(null);

/**
 * Custom hook to easily access the Dijkstra visualizer context.
 * It's a consumer hook that components will use.
 */
export const useDijkstraVisualizer = () => {
    const context = useContext(DijkstraVisualizerContext);
    if (!context) {
        // If a component tries to use this hook outside of the provider, throw an error.
        throw new Error("useDijkstraVisualizer must be used within a DijkstraVisualizerProvider");
    }
    return context;
};

/**
 * The Provider component. It will wrap any components that need access to the
 * visualizer's state and logic. It runs the main logic and provides the value to its children.
 */
export const DijkstraVisualizerProvider = ({ graph, children }: { graph: Graph, children: React.ReactNode }) => {
    // Run the main logic hook to get the state and functions.
    const value = useDijkstraVisualizerLogic(graph);
    // Provide this `value` to all child components.
    return (
        <DijkstraVisualizerContext.Provider value={value}>
            {children}
        </DijkstraVisualizerContext.Provider>
    );
};

/**
 * This is the core custom hook that encapsulates all the state and logic
 * for the Dijkstra map visualizer.
 */
const useDijkstraVisualizerLogic = (graph: Graph) => {
  // === STATE MANAGEMENT ===
  const [status, setStatus] = useState<Status>('selecting-start');
  const [startNode, setStartNode] = useState<string | null>(null);
  const [endNode, setEndNode] = useState<string | null>(null);
  const [steps, setSteps] = useState<DijkstraStep[]>([]); // Stores all steps of the algorithm for playback.
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // For the play/pause functionality.
  const [shortestPath, setShortestPath] = useState<string[]>([]); // Stores the final path node IDs.
  const [aiStyle, setAiStyle] = useState<AIStyle | null>(null); // Stores the AI-generated path style.

  const { toast } = useToast(); // Hook for showing toast notifications.
  const timerRef = useRef<NodeJS.Timeout | null>(null); // A ref to hold the timer for animated playback.
  
  // Helper to ensure any active timer is cleared.
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  /**
   * Resets the entire visualizer state to its initial values.
   * `useCallback` memoizes the function to prevent unnecessary re-renders.
   */
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

  /**
   * Runs the Dijkstra algorithm and prepares the steps for visualization.
   */
  const run = useCallback(async (start: string, end: string) => {
    // The `dijkstra` function from `lib/dijkstra.ts` does the heavy lifting.
    const dijkstraSteps = dijkstra(graph, start, end);
    setSteps(dijkstraSteps);
    setShortestPath([]);
    setAiStyle(null);
    setCurrentStepIndex(0);
    setStatus('running');
    setIsPlaying(true);
  }, [graph]);


  /**
   * Fetches the AI-generated style for the path and sets the final path for rendering.
   * This is called only after the visualization is complete.
   */
  const fetchAIStyleAndSetPath = useCallback(async () => {
    // Only run if we have steps and the visualization is finished.
    if (steps.length === 0 || status !== 'finished') return;

    const finalStep = steps[steps.length - 1];
    const finalPath = finalStep?.path ?? [];
    setShortestPath(finalPath); // Set the final path to be rendered.

    if (finalPath.length > 0) {
      let style: AIStyle | null = null;
      try {
        // Prepare the input for the AI model.
        const input: OptimizeRouteRenderingInput = {
          mapWidth: 800,
          mapHeight: 900,
          shortestPath: finalPath.join(' -> '),
          graphComplexity: 'medium',
          pointOcclusion: false,
        };
        // Call the AI flow.
        const result = await optimizeRouteRendering(input);
        // Parse the AI's text response into a usable style object.
        style = parseAIStyle(result.renderingInstructions);
      } catch (e) {
        console.error("AI style generation failed:", e);
        toast({
          title: "AI Feature Offline",
          description: "Could not generate optimal route style. Using default.",
          variant: "default"
        });
      } finally {
        // Ensure a style is always set, even if the AI fails.
        if (!style) {
            style = { color: '#20B2AA', thickness: 4, glow: true };
        }
        setAiStyle(style);
      }
    } else {
        toast({
          title: "No Path Found",
          description: "A path could not be found between the selected nodes.",
          variant: "destructive",
        });
    }
  }, [steps, status, toast]);


  /**
   * `useEffect` for handling the visualization playback timer.
   * This effect runs whenever `isPlaying` or `status` changes.
   */
  useEffect(() => {
    if (isPlaying && (status === 'running')) {
      // Set up an interval to advance the steps.
      timerRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev < steps.length - 1) {
            return prev + 1; // Go to the next step.
          } else {
            // If we're at the last step, stop the animation.
            clearTimer();
            setIsPlaying(false);
            setStatus('finished'); // This will trigger the AI style fetching effect.
            return prev;
          }
        });
      }, 500); // 500ms delay between steps.
    } else {
      clearTimer(); // If not playing, clear any existing timer.
    }
    return clearTimer; // Cleanup function: clear the timer when the component unmounts.
  }, [isPlaying, status, steps.length]);
  
  /**
   * `useEffect` to safely call the AI flow after the visualization is finished.
   * This separates the animation logic from the AI call logic.
   */
  useEffect(() => {
    if (status === 'finished') {
        fetchAIStyleAndSetPath();
    }
  }, [status, fetchAIStyleAndSetPath]);


  /**
   * Handles clicks on the map nodes.
   */
  const handleNodeClick = useCallback((nodeId: string) => {
    // Ignore clicks if the animation is running.
    if (status === 'running' || status === 'paused') return;

    // If we're selecting a start node (or starting over)...
    if (status === 'selecting-start' || status === 'finished' || !startNode) {
      reset(); // Reset everything first.
      setStartNode(nodeId);
      setStatus('selecting-end');
      toast({ title: "Start node selected", description: "Now select the end node." });
    } else if (status === 'selecting-end') {
      // If we're selecting an end node...
      if (nodeId === startNode) {
        toast({ title: "Invalid Selection", description: "End node cannot be the same as the start node.", variant: "destructive" });
        return;
      }
      setEndNode(nodeId);
      run(startNode, nodeId); // Start the algorithm.
    }
  }, [status, startNode, toast, reset, run]);

  // === Playback Control Functions ===

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
      setShortestPath([]); // Clear the final path when stepping back.
      setAiStyle(null);
      if (status === 'finished') {
        setStatus('paused');
      }
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex, status]);

  const togglePlayPause = useCallback(() => {
    if (status === 'finished') return;

    if (isPlaying) {
      setStatus('paused');
    } else {
      // If paused at the end, restart from the beginning.
      if(currentStepIndex === steps.length -1 && steps.length > 0) {
        setCurrentStepIndex(0);
        setShortestPath([]);
        setAiStyle(null);
      }
      setStatus('running');
    }
    setIsPlaying(prev => !prev);
  }, [isPlaying, status, currentStepIndex, steps.length]);

  // === MEMOIZED DERIVED STATE ===
  // `useMemo` is a performance optimization. These values are only recalculated
  // when their dependencies change, not on every render.

  // The current step object from the `steps` array.
  const currentStep = useMemo(() => steps[currentStepIndex], [steps, currentStepIndex]);
  
  // Calculate the visual state of each node based on the current step.
  const nodeStates = useMemo(() => {
    const states: Record<string, string> = {};
    
    // If finished, just show the final path.
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

  // Calculate the visual state of each edge.
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


  // Return all state and functions to be used by components.
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
