
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { useDijkstraVisualizer } from "@/hooks/use-dijkstra-visualizer";
import { MapPin, Play, Pause, StepForward, StepBack, RotateCcw, LocateFixed, Locate } from "lucide-react";

type DijkstraControlsProps = ReturnType<typeof useDijkstraVisualizer>;

const NodeSelector = ({ label, icon: Icon, nodes, value, onSelect, placeholder, disabled }: {
  label: string,
  icon: React.ElementType,
  nodes: { id: string, name: string }[],
  value: string | null,
  onSelect: (value: string) => void,
  placeholder: string,
  disabled?: boolean
}) => (
  <div className="flex items-center gap-3">
    <Icon className="h-5 w-5 text-muted-foreground" />
    <Select value={value || ''} onValueChange={onSelect} disabled={disabled}>
      <SelectTrigger className="flex-1">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {nodes.map(node => (
          <SelectItem key={node.id} value={node.id}>{node.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);


export function DijkstraControls({
  status,
  startNode,
  endNode,
  graph,
  currentStep,
  currentStepIndex,
  steps,
  isPlaying,
  setSelectionMode,
  run,
  reset,
  stepForward,
  stepBackward,
  togglePlayPause,
}: DijkstraControlsProps) {

  const isSelectionActive = status === 'selecting-start' || status === 'selecting-end';
  const isAlgorithmRunning = status === 'running' || status === 'paused';
  const isFinished = status === 'finished';

  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Controls
        </CardTitle>
        <CardDescription>
          {
            status === 'idle' ? "Select 'Set Start Point' to begin." :
            status === 'selecting-start' ? "Click on the map to choose a start location." :
            status === 'selecting-end' ? "Click on the map to choose an end location." :
            status === 'ready' ? "Start and end points selected. Press 'Run' to visualize." :
            (isAlgorithmRunning || isFinished) ? "Algorithm visualization in progress." : ""
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col gap-4">
        <div className="space-y-3">
            <Button 
                onClick={() => setSelectionMode('start')} 
                variant={status === 'selecting-start' ? "secondary" : "outline"} 
                className="w-full justify-start gap-2"
            >
                <Locate className="w-4 h-4" /> Set Start Point
            </Button>
             <Button 
                onClick={() => setSelectionMode('end')}
                variant={status === 'selecting-end' ? "secondary" : "outline"} 
                className="w-full justify-start gap-2"
                disabled={!startNode}
            >
                <LocateFixed className="w-4 h-4" /> Set End Point
            </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={run} disabled={status !== 'ready'} className="w-full">
            <Play className="mr-2 h-4 w-4" /> Run Dijkstra
          </Button>
          <Button onClick={reset} variant="ghost" size="icon">
            <RotateCcw className="h-4 w-4" />
            <span className="sr-only">Reset</span>
          </Button>
        </div>

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
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 border-t pt-4">
        <h3 className="font-semibold">Current State</h3>
        {currentStep ? (
            <ScrollArea className="h-24 w-full rounded-md border p-4 text-sm bg-muted/50">
                <p><strong>Step {currentStepIndex + 1}/{steps.length}:</strong> {currentStep.description}</p>
            </ScrollArea>
        ) : (
            <div className="flex items-center justify-center w-full h-24 rounded-md border p-4 text-sm text-muted-foreground bg-muted/50">
                <p>Waiting to start algorithm...</p>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}
