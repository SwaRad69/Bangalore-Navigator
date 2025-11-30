
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { useDijkstraVisualizer } from "@/hooks/use-dijkstra-visualizer";
import { Play, Pause, StepForward, StepBack, RotateCcw } from "lucide-react";

/**
 * Type definition for the props passed to this component.
 * It uses TypeScript's `ReturnType` to infer the shape of the object
 * returned by the `useDijkstraVisualizer` hook. This ensures that the
 * component always receives the correct data and functions.
 */
type DijkstraControlsProps = ReturnType<typeof useDijkstraVisualizer>;

/**
 * The `DijkstraControls` component provides the user interface for controlling
 * the map-based Dijkstra visualization. It includes buttons for play/pause,
 * stepping, and resetting, as well as displaying status information and results.
 */
export function DijkstraControls({
  // Destructuring the props to easily access them.
  status,
  startNode,
  endNode,
  graph,
  currentStepIndex,
  steps,
  isPlaying,
  reset,
  stepForward,
  stepBackward,
  togglePlayPause,
}: DijkstraControlsProps) {

  // A boolean flag to simplify checking if the algorithm is in a running or paused state.
  const isAlgorithmRunning = status === 'running' || status === 'paused';
  const isFinished = status === 'finished';

  // Calculate the progress of the visualization as a percentage.
  // This is used to update the width of the progress bar.
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;
  
  // A helper function to get a human-readable description of the current status.
  const getStatusDescription = () => {
    switch (status) {
      case 'selecting-start':
        return "Click on the map to choose a start location.";
      case 'selecting-end':
        const startNodeName = graph.nodes.find(n => n.id === startNode)?.name || 'start';
        return `Start point: ${startNodeName}. Now click on the map to choose an end location.`;
      case 'ready': // This state is very brief and might not even be visible.
        return "Start and end points selected. Running algorithm...";
      case 'running':
      case 'paused':
      case 'finished':
         if (isFinished) {
          return "Algorithm finished. The shortest path is highlighted.";
        }
        return "Algorithm visualization in progress.";
      default:
        return "Select a start point to begin.";
    }
  };
  
  // Get the final step of the algorithm to display the result.
  const finalStep = isFinished && steps.length > 0 ? steps[steps.length - 1] : null;
  // Calculate the final distance from the final step's data.
  const finalDistance = finalStep && endNode ? Math.round(finalStep.distances[endNode]) : null;

  // Get the names of the start and end nodes for display.
  const startNodeName = graph.nodes.find(n => n.id === startNode)?.name;
  const endNodeName = graph.nodes.find(n => n.id === endNode)?.name;

  // The JSX for the component. It uses `Card` components from shadcn/ui for styling.
  return (
    // The main card is a flex container that will hold the header, content, and footer.
    // `flex-col` makes its children stack vertically.
    <Card className="h-full flex flex-col">
      {/* `flex-shrink-0` prevents the header from shrinking if content grows. */}
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          Controls
        </CardTitle>
        <CardDescription>
          {/* Display the current status message. */}
          {getStatusDescription()}
        </CardDescription>
      </CardHeader>

      {/* 
        `flex-grow` allows this content area to expand and fill available space.
        `overflow-hidden` is crucial for the inner `ScrollArea` to work correctly.
      */}
      <CardContent className="flex-grow overflow-hidden">
        {/* `ScrollArea` adds a scrollbar if the content inside becomes too tall. */}
        <ScrollArea className="h-full pr-6">
          <div className="flex flex-col gap-4">
            {/* This section is only visible when the algorithm is running or finished. */}
            {(isAlgorithmRunning || isFinished) && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Visualization</h3>
                <div className="flex justify-center items-center gap-2">
                  {/* Step Backward Button */}
                  <Button onClick={stepBackward} variant="outline" size="icon" disabled={currentStepIndex === 0}>
                    <StepBack className="h-4 w-4" />
                  </Button>
                  {/* Play/Pause Button */}
                  <Button onClick={togglePlayPause} variant="outline" size="icon" className="w-16 h-16 rounded-full text-primary border-primary border-2 hover:bg-primary/10" disabled={isFinished}>
                    {/* The icon changes based on the `isPlaying` state. */}
                    {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                  </Button>
                  {/* Step Forward Button */}
                  <Button onClick={stepForward} variant="outline" size="icon" disabled={currentStepIndex >= steps.length - 1}>
                    <StepForward className="h-4 w-4" />
                  </Button>
                </div>
                 {/* Progress Bar */}
                 <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                    />
                </div>
              </div>
            )}
            
            {/* This section is only visible when the algorithm is finished and a path was found. */}
            {isFinished && finalDistance !== null && (
              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-semibold">Shortest Path Result</h3>
                <div className="text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">From:</span> {startNodeName}</p>
                  <p><span className="font-medium text-foreground">To:</span> {endNodeName}</p>
                </div>
                <div className="pt-2">
                  <p className="text-lg font-bold text-primary">{finalDistance} <span className="text-sm font-medium text-muted-foreground">km</span></p>
                  <p className="text-xs text-muted-foreground">Approx. distance</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      {/* `flex-shrink-0` prevents the footer from shrinking. */}
      <CardFooter className="flex-col gap-2 border-t pt-6 flex-shrink-0">
         {/* Reset Button */}
         <Button onClick={reset} variant="outline" className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
      </CardFooter>
    </Card>
  );
}
