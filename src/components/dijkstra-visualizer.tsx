
"use client";

// This file acts as a "barrel" file and a composition layer for the
// various components that make up the Dijkstra map visualizer.

import { useDijkstraVisualizer, DijkstraVisualizerProvider } from '@/hooks/use-dijkstra-visualizer.tsx';
import { DijkstraMap } from '@/components/dijkstra-map';
import { DijkstraControls } from '@/components/dijkstra-controls';
import { DijkstraExplanation } from '@/components/dijkstra-explanation';
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";


/**
 * The main container component for the visualizer.
 * In a more complex setup, this might be the place to fetch data,
 * but here it just sets up the context provider.
 * 
 * Note: The actual component is `DijkstraVisualizerWithContext`. This pattern
 * is used to ensure that any component trying to use the `useDijkstraVisualizer`
 * hook is a child of the `DijkstraVisualizerProvider`.
 */
function DijkstraVisualizerContainer() {
    // This is the component that will be exported and used in `page.tsx`.
    // It's a simple wrapper that renders the component containing the actual logic.
    return (
        <DijkstraVisualizerWithContext />
    );
}

/**
 * This component contains the actual layout of the visualizer.
 * It uses the `useDijkstraVisualizer` hook to get all the data and functions
 * it needs to pass down to the child components (`DijkstraMap`).
 */
function DijkstraVisualizerWithContext() {
    // `useDijkstraVisualizer` is a custom hook that encapsulates all the state
    // and logic for the visualization (e.g., status, startNode, steps, event handlers).
    const hookData = useDijkstraVisualizer();
    
    return (
         <div className="w-full h-full">
            <Card>
                <CardContent className="p-0 h-full">
                {/* 
                  The `DijkstraMap` component is responsible for rendering the SVG map.
                  We pass it all the necessary data from our hook, such as the graph itself,
                  the current states of nodes and edges, and the click handler.
                */}
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

/**
 * A "sub-component" for the controls.
 * It's defined here and then attached to the main `DijkstraVisualizerContainer`.
 * This pattern allows for a clean and declarative API, like `<DijkstraVisualizer.Controls />`.
 * Because it's rendered inside the provider tree, it can safely use the context hook.
 */
function Controls() {
    const hookData = useDijkstraVisualizer();
    // Spreads all properties from `hookData` as props to `DijkstraControls`.
    return <DijkstraControls {...hookData} />
}

type ExplanationProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * A sub-component for the explanation panel, following the same pattern as `Controls`.
 */
function Explanation({ open, onOpenChange }: ExplanationProps) {
    const hookData = useDijkstraVisualizer();
    return <DijkstraExplanation {...hookData} graph={hookData.graph} open={open} onOpenChange={onOpenChange} />
}

// By attaching the `Controls` and `Explanation` components as properties of the main component,
// we create a clear and organized component API. This makes it easy to understand
// how the different parts of the visualizer are related and used in `page.tsx`.
DijkstraVisualizerContainer.Controls = Controls;
DijkstraVisualizerContainer.Explanation = Explanation;

// Export the main container component, which now has `Controls` and `Explanation` attached to it.
export const DijkstraVisualizer = DijkstraVisualizerContainer;
