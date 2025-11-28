export interface Node {
  id: string;
  x: number;
  y: number;
  name: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

export interface DijkstraStep {
  currentNodeId: string | null;
  type: 'visiting' | 'neighbor' | 'finished-node' | 'path';
  distances: Record<string, number>;
  visited: Set<string>;
  description: string;
  path?: string[];
  neighbor?: string;
  queue?: { nodeId: string; distance: number }[];
}

export interface AIStyle {
  color: string;
  thickness: number;
  glow: boolean;
}
