
"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { useDijkstraVisualizer } from "@/hooks/use-dijkstra-visualizer";
import { Separator } from "@/components/ui/separator";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Graph } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

type DijkstraExplanationProps = ReturnType<typeof useDijkstraVisualizer> & {
    graph: Graph;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function DijkstraExplanation({ steps, currentStepIndex, graph, open, onOpenChange }: DijkstraExplanationProps) {
  const hasSteps = steps.length > 0;

  const getNodeName = (nodeId: string) => {
    return graph.nodes.find(n => n.id === nodeId)?.name || nodeId;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="absolute top-4 right-4 z-10"
          disabled={!hasSteps}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Explanation
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col sheet-in-layout">
        <SheetHeader className="p-6 pb-0 flex-shrink-0">
          <SheetTitle>Algorithm Explanation</SheetTitle>
          <SheetDescription>
            A step-by-step breakdown of Dijkstra's algorithm in action.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow">
          <div className="flex flex-col gap-2 p-6">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={cn(
                  "p-4 rounded-md border text-sm transition-all",
                  index === currentStepIndex 
                    ? "bg-primary/10 border-primary" 
                    : "bg-muted/50"
                )}
              >
                <p className="font-bold">{step.description}</p>
                <Separator className="my-2" />
                <p className="text-muted-foreground">{step.reasoning}</p>
                {step.queue && step.queue.length > 0 && (
                    <div className="mt-3">
                        <p className="font-semibold text-xs mb-1">Priority Queue:</p>
                        <div className="flex flex-wrap gap-1">
                            {step.queue.map(item => (
                                <Badge variant="secondary" key={item.nodeId} className="font-mono">
                                    {getNodeName(item.nodeId)}: {item.distance === Infinity ? '∞' : Math.round(item.distance)}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            ))}
            {steps.length === 0 && (
                <div className="text-center text-muted-foreground p-8">
                    Run the algorithm to see the explanation.
                </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
