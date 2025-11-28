import type { Graph, DijkstraStep } from './types';

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

  const startNodeName = graph.nodes.find(n => n.id === startNodeId)?.name || 'start';

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
    type: 'initial',
    distances: { ...distances },
    visited: new Set(visited),
    description: 'Algorithm started.',
    reasoning: `We begin by setting the distance to the start node '${startNodeName}' to 0 and all other nodes to infinity. The start node is added to a priority queue, which always keeps the node with the smallest known distance at the front.`,
    queue: pq.clone(),
  });

  while (pq.length > 0) {
    const dequeued = pq.dequeue();
    if (!dequeued) break;

    const { nodeId: currentNodeId } = dequeued;

    if (visited.has(currentNodeId)) continue;
    visited.add(currentNodeId);

    const currentNodeName = graph.nodes.find(n => n.id === currentNodeId)?.name || 'current node';

    steps.push({
      currentNodeId,
      type: 'visiting',
      distances: { ...distances },
      visited: new Set(visited),
      description: `Visiting ${currentNodeName}.`,
      reasoning: `We pull '${currentNodeName}' from the priority queue because it has the smallest distance (${Math.round(distances[currentNodeId])}) of all unvisited nodes. We mark it as visited and will now explore its neighbors.`,
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
      const neighborName = graph.nodes.find(n => n.id === neighborId)?.name || 'a neighbor';

      const currentDist = distances[neighborId] === Infinity ? '∞' : Math.round(distances[neighborId]);

      steps.push({
          currentNodeId,
          type: 'neighbor',
          neighbor: neighborId,
          distances: { ...distances },
          visited: new Set(visited),
          description: `Checking neighbor: ${neighborName}.`,
          reasoning: `We look at '${neighborName}', a neighbor of '${currentNodeName}'. The path to this neighbor through our current node has a total distance of ${Math.round(distance)}. The previously known shortest distance to this neighbor is ${currentDist}.`,
          queue: pq.clone(),
      });

      if (distance < distances[neighborId]) {
        const oldDist = distances[neighborId] === Infinity ? 'infinity' : `${Math.round(distances[neighborId])}`;
        distances[neighborId] = distance;
        previous[neighborId] = currentNodeId;
        pq.enqueue(neighborId, distance);
        steps.push({
          currentNodeId,
          type: 'neighbor',
          neighbor: neighborId,
          distances: { ...distances },
          visited: new Set(visited),
          description: `Updating distance for ${neighborName}.`,
          reasoning: `The new path to '${neighborName}' (${Math.round(distance)}) is shorter than the old one (${oldDist}). We update its distance and add it to the priority queue so it can be visited later.`,
          queue: pq.clone(),
        });
      }
    });

    steps.push({
      currentNodeId,
      type: 'finished-node',
      distances: { ...distances },
      visited: new Set(visited),
      description: `Finished with ${currentNodeName}.`,
      reasoning: `We have now checked all unvisited neighbors of '${currentNodeName}'. We will now select the next unvisited node with the smallest distance from the priority queue.`,
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
      description: 'Shortest path found!',
      reasoning: `The algorithm is complete. The final path has a total distance of ${Math.round(distances[endNodeId])}. The path is highlighted on the map.`,
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
      reasoning: `The destination node could not be reached from the start node, as there is no connecting path between them.`,
      queue: [],
    });
  }

  return steps;
}
