
import type { Graph, DijkstraStep } from './types';

/**
 * A simple Priority Queue implementation using an array.
 * For a production-grade application with very large graphs, a binary heap
 * would be more efficient, but this is sufficient and easier to understand
 * for this visualization project.
 */
class PriorityQueue {
  // The queue stores objects with a node ID and its distance.
  private values: { nodeId: string; distance: number }[] = [];

  // Adds a new item to the queue and re-sorts it.
  enqueue(nodeId: string, distance: number) {
    this.values.push({ nodeId, distance });
    this.sort();
  }

  // Removes and returns the item with the smallest distance.
  dequeue() {
    return this.values.shift();
  }

  // Sorts the queue to ensure the item with the smallest distance is always at the front.
  sort() {
    this.values.sort((a, b) => a.distance - b.distance);
  }

  // A getter for the queue's length.
  get length() {
    return this.values.length;
  }

  // Creates a copy of the queue's current state, used for visualization steps.
  clone() {
    return [...this.values];
  }
}

/**
 * Implements Dijkstra's algorithm to find the shortest path between two nodes in a graph.
 * @param graph The graph data, including nodes and edges.
 * @param startNodeId The ID of the starting node.
 * @param endNodeId The ID of the ending node.
 * @returns An array of `DijkstraStep` objects that describe each step of the
 *          algorithm's execution, which can be used for visualization.
 */
export function dijkstra(graph: Graph, startNodeId: string, endNodeId: string): DijkstraStep[] {
  // `steps` will store a log of the algorithm's execution for visualization.
  const steps: DijkstraStep[] = [];
  
  // `distances`: Stores the shortest distance found so far from the start node to every other node.
  const distances: Record<string, number> = {};
  
  // `pq`: The priority queue to decide which node to visit next.
  const pq = new PriorityQueue();
  
  // `previous`: Stores the "parent" of each node in the shortest path, to reconstruct it later.
  const previous: Record<string, string | null> = {};
  
  // `visited`: A set to keep track of nodes whose shortest path has been finalized.
  const visited = new Set<string>();
  
  // `adj`: An adjacency list representation of the graph for efficient neighbor lookup.
  const adj: Record<string, { nodeId: string; weight: number }[]> = {};

  const startNodeName = graph.nodes.find(n => n.id === startNodeId)?.name || 'start';

  // --- 1. Initialization ---
  graph.nodes.forEach(node => {
    // Set initial distance to all nodes as Infinity, except for the start node which is 0.
    distances[node.id] = node.id === startNodeId ? 0 : Infinity;
    previous[node.id] = null;
    adj[node.id] = [];
  });

  // Build the adjacency list from the graph's edges.
  graph.edges.forEach(edge => {
    adj[edge.source].push({ nodeId: edge.target, weight: edge.weight });
    adj[edge.target].push({ nodeId: edge.source, weight: edge.weight }); // Since the graph is undirected.
  });

  // Add the starting node to the priority queue.
  pq.enqueue(startNodeId, 0);

  // Record the initial state as the first step for visualization.
  steps.push({
    currentNodeId: null,
    type: 'initial',
    distances: { ...distances },
    visited: new Set(visited),
    description: 'Algorithm started.',
    reasoning: `We begin by setting the distance to the start node '${startNodeName}' to 0 and all other nodes to infinity. The start node is added to a priority queue, which always keeps the node with the smallest known distance at the front.`,
    queue: pq.clone(),
  });

  // --- 2. Main Algorithm Loop ---
  // The loop continues as long as there are nodes to visit in the priority queue.
  while (pq.length > 0) {
    const dequeued = pq.dequeue();
    if (!dequeued) break;

    const { nodeId: currentNodeId } = dequeued;

    // If we've already finalized the shortest path for this node, skip it.
    if (visited.has(currentNodeId)) continue;
    
    // Mark the current node as visited. Its shortest path is now considered final.
    visited.add(currentNodeId);

    const currentNodeName = graph.nodes.find(n => n.id === currentNodeId)?.name || 'current node';

    // Record this "visiting" action as a step.
    steps.push({
      currentNodeId,
      type: 'visiting',
      distances: { ...distances },
      visited: new Set(visited),
      description: `Visiting ${currentNodeName}.`,
      reasoning: `We pull '${currentNodeName}' from the priority queue because it has the smallest distance (${Math.round(distances[currentNodeId])}) of all unvisited nodes. We mark it as visited and will now explore its neighbors.`,
      queue: pq.clone(),
    });

    // If we've reached the destination, we can stop early.
    if (currentNodeId === endNodeId) {
      break;
    }

    // --- 3. Relaxation Step ---
    // For each neighbor of the current node...
    adj[currentNodeId].forEach(neighbor => {
      const { nodeId: neighborId, weight } = neighbor;
      
      // Skip neighbors that have already been visited.
      if (visited.has(neighborId)) {
        return;
      }
      
      // Calculate the distance to the neighbor *through* the current node.
      const distance = distances[currentNodeId] + weight;
      const neighborName = graph.nodes.find(n => n.id === neighborId)?.name || 'a neighbor';

      const currentDist = distances[neighborId] === Infinity ? '∞' : Math.round(distances[neighborId]);

      // Record the "checking neighbor" action.
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

      // If the new path is shorter than any previously found path...
      if (distance < distances[neighborId]) {
        const oldDist = distances[neighborId] === Infinity ? 'infinity' : `${Math.round(distances[neighborId])}`;
        // ...update the distance.
        distances[neighborId] = distance;
        // ...update the predecessor to reconstruct the path later.
        previous[neighborId] = currentNodeId;
        // ...add the neighbor to the priority queue to be visited.
        pq.enqueue(neighborId, distance);

        // Record the "updating distance" action.
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

    // Record that we are done processing the current node.
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

  // --- 4. Path Reconstruction ---
  const path: string[] = [];
  let current: string | null = endNodeId;
  // Work backwards from the end node using the `previous` map.
  while (current) {
    path.unshift(current);
    current = previous[current];
  }

  // If the path starts with the start node, we found a valid path.
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
     // Otherwise, no path exists.
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
