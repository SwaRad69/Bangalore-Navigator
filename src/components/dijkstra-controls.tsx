
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { useDijkstraVisualizer } from "@/hooks/use-dijkstra-visualizer";
import { Play, Pause, StepForward, StepBack, RotateCcw } from "lucide-react";

type DijkstraControlsProps = ReturnType<typeof useDijkstraVisualizer>;

export function DijkstraControls({
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

  const isAlgorithmRunning = status === 'running' || status === 'paused';
  const isFinished = status === 'finished';

  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;
  
  const getStatusDescription = () => {
    switch (status) {
      case 'selecting-start':
        return "Click on the map to choose a start location.";
      case 'selecting-end':
        const startNodeName = graph.nodes.find(n => n.id === startNode)?.name || 'start';
        return `Start point: ${startNodeName}. Now click on the map to choose an end location.`;
      case 'ready': // This state is now very brief
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
  
  const finalStep = isFinished && steps.length > 0 ? steps[steps.length - 1] : null;
  const finalDistance = finalStep && endNode ? Math.round(finalStep.distances[endNode]) : null;

  const startNodeName = graph.nodes.find(n => n.id === startNode)?.name;
  const endNodeName = graph.nodes.find(n => n.id === endNode)?.name;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Controls
        </CardTitle>
        <CardDescription>
          {getStatusDescription()}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="h-full pr-6">
          <div className="flex flex-col gap-4">
            {(isAlgorithmRunning || isFinished) && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Visualization</h3>
                <div className="flex justify-center items-center gap-2">
                  <Button onClick={stepBackward} variant="outline" size="icon" disabled={currentStepIndex === 0}>
                    <StepBack className="h-4 w-4" />
                  </Button>
                  <Button onClick={togglePlayPause} variant="outline" size="icon" className="w-16 h-16 rounded-full text-primary border-primary border-2 hover:bg-primary/10" disabled={isFinished}>
                    {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                  </Button>
                  <Button onClick={stepForward} variant="outline" size="icon" disabled={currentStepIndex >= steps.length - 1}>
                    <StepForward className="h-4 w-4" />
                  </Button>
                </div>
                 <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                    />
                </div>
              </div>
            )}
            
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
      <CardFooter className="flex-col gap-2 border-t pt-6">
         <Button onClick={reset} variant="outline" className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
      </CardFooter>
    </Card>
  );
}
