import DijkstraVisualizer from '@/components/dijkstra-visualizer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="text-3xl text-center md:text-5xl font-headline font-bold text-foreground mb-6">
          Bengaluru Navigator
        </h1>
        <DijkstraVisualizer />
      </div>
    </main>
  );
}
