
"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { useDijkstraVisualizer } from "@/hooks/use-dijkstra-visualizer";
import { Separator } from "@/components/ui/separator";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type DijkstraExplanationProps = ReturnType<typeof useDijkstraVisualizer>;

export function DijkstraExplanation({ steps, currentStepIndex }: DijkstraExplanationProps) {
  const hasSteps = steps.length > 0;

  return (
    <Sheet>
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
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-6">
          <SheetTitle>Algorithm Explanation</SheetTitle>
          <SheetDescription>
            A step-by-step breakdown of Dijkstra's algorithm in action.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-80px)]">
          <div className="flex flex-col gap-2 p-6 pt-0">
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
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
