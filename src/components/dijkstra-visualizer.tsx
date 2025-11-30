
"use client";

import { useDijkstraVisualizer } from '@/hooks/use-dijkstra-visualizer.tsx';
import { DijkstraMap } from '@/components/dijkstra-map';
import { DijkstraControls } from '@/components/dijkstra-controls';
import { DijkstraExplanation } from '@/components/dijkstra-explanation';
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

function DijkstraVisualizerContainer() {
    return (
        <DijkstraVisualizerWithContext />
    );
}

function DijkstraVisualizerWithContext() {
    const hookData = useDijkstraVisualizer();
    return (
         <div className="w-full h-full">
            <Card>
                <CardContent className="p-0 h-full">
                <DijkstraMap
                    graph={hookData.graph}
                    nodeStates={hookData.nodeStates}
                    edgeStates={hookData.edgeStates}
                    onNodeClick={hookData.handleNodeClick}
                    aiStyle={hookData.aiStyle}
                    currentStep={hookData.currentStep}
                    shortestPath={hookData.shortestPath}
                />
                </CardContent>
            </Card>
        </div>
    )
}

function Controls() {
    // This is a consumer component that will be rendered inside the Provider
    // So it can safely use the context.
    const hookData = useDijkstraVisualizer();
    return <DijkstraControls {...hookData} />
}

type ExplanationProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function Explanation({ open, onOpenChange }: ExplanationProps) {
    const hookData = useDijkstraVisualizer();
    return <DijkstraExplanation {...hookData} graph={hookData.graph} open={open} onOpenChange={onOpenChange} />
}

// Attach the Controls component to the main visualizer component
DijkstraVisualizerContainer.Controls = Controls;
DijkstraVisualizerContainer.Explanation = Explanation;

// Export the main component with the attached sub-component
export const DijkstraVisualizer = DijkstraVisualizerContainer;
