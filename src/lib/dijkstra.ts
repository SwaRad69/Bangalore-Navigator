import type { Graph, DijkstraStep, Node } from './types';

class PriorityQueue {
  private values: { nodeId: string; distance: number }[] = [];

  enqueue(nodeId: string, distance: number) {
    this.values.push({ nodeId, distance });
    this.sort();
  }

  dequeue() {
    return this.values.shift();
  }

  sort() {
    this.values.sort((a, b) => a.distance - b.distance);
  }

  get length() {
    return this.values.length;
  }

  clone() {
    return [...this.values];
  }
}

export function dijkstra(graph: Graph, startNodeId: string, endNodeId: string): DijkstraStep[] {
  const steps: DijkstraStep[] = [];
  const distances: Record<string, number> = {};
  const pq = new PriorityQueue();
  const previous: Record<string, string | null> = {};
  const visited = new Set<string>();
  const adj: Record<string, { nodeId: string; weight: number }[]> = {};

  graph.nodes.forEach(node => {
    distances[node.id] = node.id === startNodeId ? 0 : Infinity;
    previous[node.id] = null;
    adj[node.id] = [];
  });

  graph.edges.forEach(edge => {
    adj[edge.source].push({ nodeId: edge.target, weight: edge.weight });
    adj[edge.target].push({ nodeId: edge.source, weight: edge.weight });
  });

  pq.enqueue(startNodeId, 0);

  steps.push({
    currentNodeId: null,
    type: 'visiting',
    distances: { ...distances },
    visited: new Set(visited),
    description: `Starting algorithm. Initializing distances. Start node is ${graph.nodes.find(n => n.id === startNodeId)?.name}.`,
    queue: pq.clone(),
  });

  while (pq.length > 0) {
    const dequeued = pq.dequeue();
    if (!dequeued) break;

    const { nodeId: currentNodeId } = dequeued;

    if (visited.has(currentNodeId)) continue;
    visited.add(currentNodeId);

    const currentNodeName = graph.nodes.find(n => n.id === currentNodeId)?.name;

    steps.push({
      currentNodeId,
      type: 'visiting',
      distances: { ...distances },
      visited: new Set(visited),
      description: `Visiting node: ${currentNodeName}.`,
      queue: pq.clone(),
    });

    if (currentNodeId === endNodeId) {
      break; 
    }

    adj[currentNodeId].forEach(neighbor => {
      const { nodeId: neighborId, weight } = neighbor;
      if (visited.has(neighborId)) {
        return;
      }
      
      const distance = distances[currentNodeId] + weight;
      const neighborName = graph.nodes.find(n => n.id === neighborId)?.name;

      steps.push({
          currentNodeId,
          type: 'neighbor',
          neighbor: neighborId,
          distances: { ...distances },
          visited: new Set(visited),
          description: `Checking neighbor: ${neighborName}. Current distance: ${distances[neighborId] === Infinity ? '∞' : Math.round(distances[neighborId])}. New Path: ${Math.round(distance)}`,
          queue: pq.clone(),
      });

      if (distance < distances[neighborId]) {
        distances[neighborId] = distance;
        previous[neighborId] = currentNodeId;
        pq.enqueue(neighborId, distance);
        steps.push({
          currentNodeId,
          type: 'neighbor',
          neighbor: neighborId,
          distances: { ...distances },
          visited: new Set(visited),
          description: `Shorter path to ${neighborName} found! Updating distance to ${Math.round(distance)}.`,
          queue: pq.clone(),
        });
      }
    });

    steps.push({
      currentNodeId,
      type: 'finished-node',
      distances: { ...distances },
      visited: new Set(visited),
      description: `Finished checking neighbors of ${currentNodeName}.`,
      queue: pq.clone(),
    });
  }

  // Reconstruct path
  const path: string[] = [];
  let current: string | null = endNodeId;
  while (current) {
    path.unshift(current);
    current = previous[current];
  }

  if (path[0] === startNodeId) {
    steps.push({
      currentNodeId: null,
      type: 'path',
      path: path,
      distances: { ...distances },
      visited: new Set(visited),
      description: `Shortest path found with total distance: ${Math.round(distances[endNodeId])}.`,
      queue: [],
    });
  } else {
     steps.push({
      currentNodeId: null,
      type: 'path',
      path: [],
      distances: { ...distances },
      visited: new Set(visited),
      description: 'No path found.',
      queue: [],
    });
  }

  return steps;
}
