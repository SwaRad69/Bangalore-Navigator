"use client";

import { bengaluruGraph } from '@/lib/graph-data';
import { useDijkstraVisualizer, DijkstraVisualizerProvider } from '@/hooks/use-dijkstra-visualizer.tsx';
import { DijkstraMap } from '@/components/dijkstra-map';
import { DijkstraControls } from '@/components/dijkstra-controls';
import { Card, CardContent } from "@/components/ui/card";

function DijkstraVisualizerContainer() {
    return (
        <DijkstraVisualizerWithContext />
    );
}

function DijkstraVisualizerWithContext() {
    const hookData = useDijkstraVisualizer();
    return (
         <div className="w-full h-full">
            <Card className="h-[600px] lg:h-[80vh]">
                <CardContent className="p-2 h-full">
                <DijkstraMap
                    graph={hookData.graph}
                    nodeStates={hookData.nodeStates}
                    edgeStates={hookData.edgeStates}
                    onNodeClick={hookData.handleNodeClick}
                    aiStyle={hookData.aiStyle}
                    currentStep={hookData.currentStep}
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

// Attach the Controls component to the main visualizer component
DijkstraVisualizerContainer.Controls = Controls;

// Export the main component with the attached sub-component
export const DijkstraVisualizer = DijkstraVisualizerContainer;
