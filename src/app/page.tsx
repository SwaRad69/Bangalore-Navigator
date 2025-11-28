
"use client";

import { DijkstraVisualizer } from '@/components/dijkstra-visualizer';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { bengaluruGraph } from '@/lib/graph-data';
import { DijkstraVisualizerProvider } from '@/hooks/use-dijkstra-visualizer.tsx';

export default function Home() {
  return (
    <DijkstraVisualizerProvider graph={bengaluruGraph}>
      <SidebarProvider>
        <Sidebar>
          <DijkstraVisualizer.Controls />
        </Sidebar>
        <SidebarInset>
          <main className="relative flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
            <div className="w-full max-w-7xl mx-auto">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                      <SidebarTrigger className="md:hidden"/>
                      <h1 className="text-2xl md:text-5xl font-headline font-bold text-foreground">
                      Bengaluru Navigator
                      </h1>
                  </div>
              </div>
              <div className="relative">
                <DijkstraVisualizer />
                <DijkstraVisualizer.Explanation />
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DijkstraVisualizerProvider>
  );
}
