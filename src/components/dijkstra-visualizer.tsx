"use client";

import { bengaluruGraph } from '@/lib/graph-data';
import { useDijkstraVisualizer } from '@/hooks/use-dijkstra-visualizer';
import { DijkstraMap } from '@/components/dijkstra-map';
import { DijkstraControls } from '@/components/dijkstra-controls';
import { Card, CardContent } from "@/components/ui/card";

export default function DijkstraVisualizer() {
  const hookData = useDijkstraVisualizer(bengaluruGraph);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full h-full">
      <Card className="lg:col-span-2 h-[600px] lg:h-auto">
        <CardContent className="p-2 h-full">
          <DijkstraMap
            graph={bengaluruGraph}
            nodeStates={hookData.nodeStates}
            edgeStates={hookData.edgeStates}
            onNodeClick={hookData.handleNodeClick}
            aiStyle={hookData.aiStyle}
            currentStep={hookData.currentStep}
          />
        </CardContent>
      </Card>
      <div className="lg:col-span-1">
        <DijkstraControls {...hookData} />
      </div>
    </div>
  );
}
