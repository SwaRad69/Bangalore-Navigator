
"use client";

import { DijkstraVisualizer } from '@/components/dijkstra-visualizer';
import { DijkstraVisualizerProvider } from '@/hooks/use-dijkstra-visualizer';
import { bengaluruGraph } from '@/lib/graph-data';
import React, { useEffect, useState } from 'react';
import './dijkstra-guide.css';

export default function Home() {

  const [gridMode, setGridMode] = useState('select'); // 'select' or 'wall'

  useEffect(() => {
    const gridWrapper = document.getElementById('grid-wrapper');
    const grid = document.getElementById('grid');
    if (!grid || !gridWrapper) return;

    let startCell: HTMLElement | null = null;
    let endCell: HTMLElement | null = null;
    let cells: HTMLElement[][] = [];
    let isRunning = false;

    let size = { rows: 20, cols: 20 };
    
    function updateToggleButton() {
        const toggleBtn = document.getElementById('toggle-wall-btn');
        if (!toggleBtn) return;
        
        if (gridMode === 'wall') {
            toggleBtn.classList.add('active');
        } else {
            toggleBtn.classList.remove('active');
        }
    }
    updateToggleButton();


    function handleCellClick(cell: HTMLElement) {
      if (isRunning) return;

      if (gridMode === 'wall') {
        if (cell.classList.contains('start')) startCell = null;
        if (cell.classList.contains('end')) endCell = null;
        cell.classList.toggle('wall');
        cell.classList.remove('start', 'end', 'visited', 'path');
      } else { // This block handles start/end cell selection
        if (cell.classList.contains('wall')) return;
        
        if (!startCell) {
            cell.classList.remove('wall', 'visited', 'path', 'end');
            cell.classList.add('start');
            startCell = cell;
        } else if (!endCell && cell !== startCell) {
            cell.classList.remove('wall', 'visited', 'path', 'start');
            cell.classList.add('end');
            endCell = cell;
            runDijkstra();
        } else if (cell === startCell) {
            // User clicked on start cell again, do nothing or allow reset
        } else if (cell === endCell) {
            // User clicked on end cell again
        }
      }
    }
    
    function createGrid() {
      if (!grid || !gridWrapper) return;
      
      const cellWidth = 26; // width + gap
      const wrapperWidth = gridWrapper.clientWidth;
      size.cols = Math.max(5, Math.floor(wrapperWidth / cellWidth));
      
      grid.innerHTML = '';
      grid.style.gridTemplateColumns = `repeat(${size.cols}, 1fr)`;
      cells = [];
      
      for (let r = 0; r < size.rows; r++) {
        cells[r] = [];
        for (let c = 0; c < size.cols; c++) {
          const cell = document.createElement('div');
          cell.classList.add('cell');
          cell.dataset.row = String(r);
          cell.dataset.col = String(c);
          cell.onclick = () => handleCellClick(cell);
          grid.appendChild(cell);
          cells[r][c] = cell;
        }
      }
      
      startCell = null;
      endCell = null;
      document.getElementById('grid-meta-size')!.textContent = `Grid: ${size.rows}x${size.cols}`;
    }

    function getNeighbors(r: number, c: number) {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const neighbors: [number, number][] = [];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size.rows && nc >= 0 && nc < size.cols) {
          if (!cells[nr][nc].classList.contains('wall')) {
            neighbors.push([nr, nc]);
          }
        }
      }
      return neighbors;
    }

    async function runDijkstra() {
      if (!startCell || !endCell) {
        // This case should not be hit with the new UX flow, but as a safeguard
        alert("Please select a start and an end cell.");
        return;
      }
      if(isRunning) return;
      isRunning = true;
      document.querySelectorAll('#controls button').forEach(b => (b as HTMLButtonElement).disabled = true);

      // Clear previous run visualization
      for (let r = 0; r < size.rows; r++) {
        for (let c = 0; c < size.cols; c++) {
          const cell = cells[r][c];
          if (!cell.classList.contains('start') && !cell.classList.contains('end') && !cell.classList.contains('wall')) {
             cell.classList.remove('visited', 'path');
          }
        }
      }

      const startR = +startCell.dataset.row!;
      const startC = +startCell.dataset.col!;
      const endR = +endCell.dataset.row!;
      const endC = +endCell.dataset.col!;

      const dist = Array(size.rows).fill(null).map(() => Array(size.cols).fill(Infinity));
      const prev: ([number, number] | null)[][] = Array(size.rows).fill(null).map(() => Array(size.cols).fill(null));
      
      dist[startR][startC] = 0;
      const pq: [number, number, number][] = [[0, startR, startC]]; // [distance, r, c]

      while (pq.length > 0) {
        pq.sort((a, b) => a[0] - b[0]);
        const [d, r, c] = pq.shift()!;

        if (d > dist[r][c]) continue;

        if (r === endR && c === endC) break; // Found the end

        const cell = cells[r][c];
        if (cell !== startCell && cell !== endCell) {
          cell.classList.add('visited');
          await new Promise(res => setTimeout(res, 10));
        }

        for (const [nr, nc] of getNeighbors(r, c)) {
          const nd = d + 1;
          if (nd < dist[nr][nc]) {
            dist[nr][nc] = nd;
            prev[nr][nc] = [r, c];
            pq.push([nd, nr, nc]);
          }
        }
      }

      // Reconstruct path
      let cr = endR, cc = endC;
      if (!prev[cr][cc] && !(cr === startR && cc === startC)) {
        alert("No path exists between START and END with the current walls.");
        isRunning = false;
        document.querySelectorAll('#controls button').forEach(b => (b as HTMLButtonElement).disabled = false);
        return;
      }

      while (prev[cr][cc]) {
        const [pr, pc] = prev[cr][cc]!;
        const cell = cells[pr][pc];
        if (cell !== startCell) {
          cell.classList.add('path');
        }
        cr = pr;
        cc = pc;
        await new Promise(res => setTimeout(res, 20));
      }
      isRunning = false;
      document.querySelectorAll('#controls button').forEach(b => (b as HTMLButtonElement).disabled = false);

    }

    function resetGrid() {
        if(isRunning) return;
        createGrid();
    }
    
    // Initial setup
    createGrid();

    // Re-create grid on resize
    const resizeObserver = new ResizeObserver(() => {
        if (!isRunning) createGrid();
    });
    resizeObserver.observe(gridWrapper);


    // Attach functions to window for onclick handlers
    (window as any).resetGrid = resetGrid;

    return () => {
        delete (window as any).resetGrid;
        resizeObserver.disconnect();
    }
  }, [gridMode]); // Rerun setup logic when mode changes

  return (
    <DijkstraVisualizerProvider graph={bengaluruGraph}>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-inner">
          <div className="nav-left">
            <div className="logo-circle"><span>D</span></div>
            <div className="nav-title">
              <strong>Dijkstra’s Algorithm</strong>
              <span>Shortest Path • AD Project</span>
            </div>
          </div>
          <div className="nav-links">
            <a href="#intro">Intro</a>
            <a href="#theory">Theory</a>
            <a href="#algo">Steps</a>
            <a href="#visualizer" className="primary-link">Visualizer</a>
            <a href="#applications">Applications</a>
            <a href="#comparison">Comparison</a>
            <a href="#implementation">Code</a>
            <a href="#documentation">Documentation</a>
          </div>
        </div>
      </nav>

      <main className="page-shell">
        {/* HERO */}
        <section className="hero" id="top">
          <div className="hero-text">
            <h1>Dijkstra’s Algorithm<br />Complete Guide & Visualizer</h1>
            <p>
              Learn how Dijkstra’s Algorithm finds the shortest path in weighted graphs,
              see the step-by-step logic, and explore interactive visualizers –
              all in one website.
            </p>
            <div className="hero-badges">
              <div className="pill">
                <span className="pill-dot"></span>
                <span>Non-negative weighted graphs</span>
              </div>
              <div className="pill">
                <span>Time:</span><strong>O(E log V)</strong>
              </div>
              <div className="pill">
                <span>Use cases:</span> GPS • Networks • Robotics
              </div>
            </div>
            <div className="hero-actions">
              <a href="#visualizer" className="btn btn-primary">
                <span className="btn-icon">▶</span>
                <span>Launch Interactive Visualizer</span>
              </a>
              <a href="#algo" className="btn btn-outline">
                <span className="btn-icon">📜</span>
                <span>View Algorithm Steps</span>
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-header">
              <div>
                <small className="text-muted">Algorithm Snapshot</small><br />
                <strong>Dijkstra’s Shortest Path</strong>
              </div>
              <div className="hero-visual-tags">
                <span className="tag">Greedy Strategy</span>
                <span className="tag">Single Source</span>
              </div>
            </div>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
              Dijkstra’s algorithm maintains a set of nodes whose minimum distance from
              the source is already known and repeatedly selects the node with the
              smallest tentative distance to relax its outgoing edges.
            </p>
            <div className="hero-metrics">
              <span className="metric">Input: Graph G(V, E)</span>
              <span className="metric">Output: dist[v] for all v</span>
              <span className="metric">Constraint: w(u, v) ≥ 0</span>
            </div>
          </div>
        </section>

        {/* INTRODUCTION */}
        <section className="section" id="intro">
          <div className="section-header">
            <div className="section-title">
              <span className="dot"></span>
              <span>1. Introduction & Purpose</span>
            </div>
            <span className="section-kicker">What problem does Dijkstra solve?</span>
          </div>

          <div className="section-grid-2">
            <div className="card">
              <p>
                In many real-world systems – like maps, networks, and transportation –
                we need to move from one place to another using the <span className="highlight">
                lowest possible cost</span> (distance, time, or any other weight).
                Dijkstra’s Algorithm is a classic solution to the
                <strong>single-source shortest path</strong> problem in a graph with
                non-negative edge weights.
              </p>
              <p>
                <strong>Goal:</strong> Given a weighted graph and a
                <strong>source node</strong>, find the shortest path from the source
                to every other node.
              </p>
              <div className="chips-row">
                <span className="chip">Single source</span>
                <span className="chip">Weighted graph</span>
                <span className="chip">No negative weights</span>
                <span className="chip">Greedy choice</span>
              </div>
            </div>

            <div className="card">
              <p><strong>Project / Assignment Purpose</strong></p>
              <ul>
                <li>Understand the logic behind Dijkstra’s Algorithm.</li>
                <li>Implement and visualize shortest path computation.</li>
                <li>Study its complexity, limitations, and applications.</li>
                <li>Compare it with other search algorithms like A* and Greedy BFS.</li>
              </ul>
              <p className="text-muted" style={{ marginTop: '6px' }}>
                This website acts as a combined <strong>report + visual tool</strong>
                for your Dijkstra assignment or mini-project.
              </p>
            </div>
          </div>
        </section>

        {/* THEORY */}
        <section className="section" id="theory">
            <div className="section-header">
                <div className="section-title">
                    <span className="dot"></span>
                    <span>2. Theory & Concepts</span>
                </div>
                <span className="section-kicker">Graph, weights & shortest paths</span>
            </div>
            <div className="section-grid-2">
              <div className="card">
                <p><strong>2.1 Graph Model</strong></p>
                <ul>
                  <li><strong>Vertices (V):</strong> represent cities, routers, locations, etc.</li>
                  <li><strong>Edges (E):</strong> represent connections (roads, links, paths).</li>
                  <li><strong>Weights w(u, v):</strong> cost of going from node u to v.</li>
                </ul>
                <p>
                  Dijkstra’s algorithm assumes that
                  <span className="highlight">all edge weights are non-negative</span>.
                  If negative edges are present, the algorithm may produce incorrect
                  results.
                </p>

                <p><strong>2.2 Key Ideas</strong></p>
                <ul>
                  <li>
                    Maintain an array <code>dist[v]</code>: best known distance from source
                    to node <code>v</code>.
                  </li>
                  <li>
                    Start with <code>dist[source] = 0</code> and all others as
                    <code>∞</code>.
                  </li>
                  <li>
                    Use a <strong>priority queue</strong> (min-heap) to always expand the
                    node with minimal tentative distance.
                  </li>
                  <li>
                    Once a node is taken out of the priority queue, its shortest distance
                    is finalized.
                  </li>
                </ul>
              </div>

              <div className="card">
                <p><strong>2.3 Data Structures Used</strong></p>
                <ul>
                  <li><strong>Adjacency list</strong> to store the graph efficiently.</li>
                  <li>
                    <strong>Distance array:</strong> <code>dist[v]</code> for every node.
                  </li>
                  <li>
                    <strong>Predecessor array:</strong> <code>prev[v]</code> to reconstruct
                    paths.
                  </li>
                  <li>
                    <strong>Priority Queue (Min-Heap):</strong> to pick the next best node.
                  </li>
                </ul>
                <p><strong>2.4 Complexity</strong></p>
                <ul>
                  <li>
                    Using a simple array / linear search: <code>O(V²)</code>
                  </li>
                  <li>
                    Using a min-heap (binary heap): <code>O(E log V)</code> –
                    preferred for sparse graphs.
                  </li>
                </ul>
              </div>
            </div>
        </section>

        {/* ALGORITHM STEPS & PSEUDOCODE */}
        <section className="section" id="algo">
          <div className="section-header">
            <div className="section-title">
              <span className="dot"></span>
              <span>3. Algorithm Steps & Pseudocode</span>
            </div>
            <span className="section-kicker">From initialization to path reconstruction</span>
          </div>
          <div className="section-grid-2">
            <div className="card">
              <p><strong>3.1 Step-by-Step Logic</strong></p>
              <ol>
                <li>
                  <strong>Initialization:</strong><br />
                  For every node <code>v</code>, set <code>dist[v] = ∞</code> and
                  <code>prev[v] = NULL</code>. Set <code>dist[source] = 0</code>.
                </li>
                <li>
                  <strong>Insert source in priority queue:</strong><br />
                  Push the pair <code>(0, source)</code> into the min-heap.
                </li>
                <li>
                  <strong>Pick node with minimum distance:</strong><br />
                  Extract the node <code>u</code> from the priority queue with the
                  smallest <code>dist[u]</code>.
                </li>
                <li>
                  <strong>Relax neighbors:</strong><br />
                  For each neighbor <code>v</code> of <code>u</code>, check if going
                  through <code>u</code> is better:
                  <br />
                  <code>alt = dist[u] + w(u, v)</code><br />
                  If <code>alt &lt; dist[v]</code>, update:
                  <br />
                  <code>dist[v] = alt</code> and <code>prev[v] = u</code>; push
                  <code>v</code> into the queue.
                </li>
                <li>
                  <strong>Repeat:</strong><br />
                  Continue until the priority queue is empty (all reachable nodes
                  processed) or until you have extracted the destination node.
                </li>
                <li>
                  <strong>Path Reconstruction:</strong><br />
                  To get the shortest path to some target <code>t</code>, follow
                  <code>prev[t]</code> backwards until the source is reached.
                </li>
              </ol>
            </div>
            <div className="card">
              <p><strong>3.2 Pseudocode</strong></p>
              <pre>
{`DIJKSTRA(G, source):
    for each vertex v in G:
        dist[v] = ∞
        prev[v] = NULL

    dist[source] = 0
    PQ = empty min-priority-queue
    PQ.insert(source, 0)

    while PQ is not empty:
        u = PQ.extract_min()

        if u is already visited:
            continue
        mark u as visited

        for each neighbor v of u:
            alt = dist[u] + weight(u, v)
            if alt < dist[v]:
                dist[v] = alt
                prev[v] = u
                PQ.insert(v, alt)

    return dist, prev`}
              </pre>
              <p className="text-muted" style={{marginTop: '4px'}}>
                Note: if the graph has negative edge weights, use algorithms like
                <strong>Bellman–Ford</strong> instead of Dijkstra.
              </p>
            </div>
          </div>
        </section>

        {/* VISUALIZER */}
        <section className="section" id="visualizer">
          <div className="section-header">
            <div className="section-title">
              <span className="dot"></span>
              <span>4. Interactive Visualizers</span>
            </div>
            <span className="section-kicker">Watch Dijkstra explore the grid and the map</span>
          </div>
        
          {/* GRID VISUALIZER */}
           <div className="card" style={{marginBottom: '2rem'}}>
                <p style={{marginTop: 0}}><strong>4.1 Unweighted Grid Visualizer</strong></p>
                <p className="text-muted" style={{fontSize: '0.9rem'}}>
                    This visualizer shows Dijkstra on a simple grid where every move costs 1.
                    Click a cell to set the start, click another to set the end and start the algorithm. Click the 'Toggle Wall' button to draw obstacles.
                </p>
                <div id="controls">
                    <button 
                        id="toggle-wall-btn" 
                        onClick={() => setGridMode(gridMode === 'wall' ? 'select' : 'wall')}
                        className={gridMode === 'wall' ? 'active' : ''}
                    >
                        Toggle Wall
                    </button>
                    <button className="danger" onClick={() => (window as any).resetGrid()}>Reset</button>
                </div>
                
                <div id="legend">
                    <div className="legend-item"><span className="legend-swatch legend-start"></span> Start</div>
                    <div className="legend-item"><span className="legend-swatch legend-end"></span> End</div>
                    <div className="legend-item"><span className="legend-swatch legend-wall"></span> Wall</div>
                    <div className="legend-item"><span className="legend-swatch legend-visited"></span> Visited</div>
                    <div className="legend-item"><span className="legend-swatch legend-path"></span> Shortest Path</div>
                </div>

                <div id="grid-wrapper">
                    <div id="grid"></div>
                </div>

                <div className="meta-row">
                    <span id="grid-meta-size" className="meta-chip">Grid: 20×20</span>
                    <span className="meta-chip">Cost: 1 per move (unweighted)</span>
                    <span className="meta-chip">Moves: Up / Down / Left / Right</span>
                </div>
            </div>

          {/* MAP VISUALIZER */}
          <div className="card">
            <p style={{marginTop: 0}}><strong>4.2 Bengaluru Map Visualizer (Weighted Graph)</strong></p>
            <p className="text-muted" style={{fontSize: '0.9rem'}}>
                This visualizer runs Dijkstra on a weighted graph representing key locations in Bengaluru.
                The distance between locations is the weight of the edge.
            </p>
             <div className="visualizer-container">
              <div className="controls-column">
                  <DijkstraVisualizer.Controls />
              </div>
              <div className="map-column">
                  <DijkstraVisualizer />
                  <DijkstraVisualizer.Explanation />
              </div>
          </div>
          </div>
         
        </section>

        {/* APPLICATIONS */}
        <section className="section" id="applications">
          <div className="section-header">
            <div className="section-title">
              <span className="dot"></span>
              <span>5. Applications of Dijkstra’s Algorithm</span>
            </div>
            <span className="section-kicker">Where is it used in real life?</span>
          </div>
          <div className="section-grid-2">
            <div className="card">
              <p><strong>Real-World Use Cases</strong></p>
              <ul>
                <li>
                  <strong>GPS Navigation:</strong> Find the shortest driving route between
                  two locations on a map.
                </li>
                <li>
                  <strong>Computer Networks:</strong> Link-state routing protocols (e.g.
                  OSPF) compute least-cost paths between routers.
                </li>
                <li>
                  <strong>Robotics:</strong> Robots use it for path planning to avoid
                  obstacles and minimize distance or time.
                </li>
                <li>
                  <strong>Video Games:</strong> NPC movement and AI pathfinding in grid-based
                  maps.
                </li>
                <li>
                  <strong>Public Transport Planning:</strong> Minimum travel time routes
                  across transport networks.
                </li>
              </ul>
            </div>
            <div className="card">
              <p><strong>Advantages</strong></p>
              <ul>
                <li>Guarantees shortest path for non-negative weights.</li>
                <li>Efficient for sparse graphs with a priority queue.</li>
                <li>Can compute shortest paths to all nodes in a single run.</li>
              </ul>
              <p><strong>Limitations</strong></p>
              <ul>
                <li>Does not handle negative edge weights.</li>
                <li>Not ideal for dynamic graphs where weights change frequently.</li>
                <li>Explores more nodes than necessary if only a single target is needed.</li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* COMPARISON */}
        <section className="section" id="comparison">
            <div className="section-header">
                <div className="section-title"><span className="dot"></span><span>6. Comparison with Other Algorithms</span></div>
                <span className="section-kicker">Greedy, A*, BFS, heuristic search</span>
            </div>
            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>Algorithm</th>
                            <th>Type</th>
                            <th>Uses Weights?</th>
                            <th>Heuristic?</th>
                            <th>Guarantees Shortest Path?</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Dijkstra</strong></td>
                            <td>Greedy, uniform-cost search</td>
                            <td>Yes (non-negative)</td>
                            <td>No</td>
                            <td>Yes (for non-negative weights)</td>
                            <td>Expands nodes in order of increasing distance.</td>
                        </tr>
                        <tr>
                            <td><strong>Greedy Best-First Search</strong></td>
                            <td>Greedy heuristic search</td>
                            <td>Optional</td>
                            <td>Yes</td>
                            <td>No (may give suboptimal path)</td>
                            <td>Expands node that appears closest to goal using heuristic only.</td>
                        </tr>
                        <tr>
                          <td><strong>A*</strong></td>
                          <td>Informed search</td>
                          <td>Yes (non-negative)</td>
                          <td>Yes (admissible heuristic)</td>
                          <td>Yes, if heuristic is admissible &amp; consistent</td>
                          <td>Uses <code>f(n) = g(n) + h(n)</code> to focus the search.</td>
                        </tr>
                        <tr>
                            <td><strong>BFS (Unweighted)</strong></td>
                            <td>Uninformed search</td>
                            <td>No (or all weights = 1)</td>
                            <td>No</td>
                            <td>Yes (in unweighted graphs)</td>
                            <td>Equivalent to Dijkstra on graphs with all weights = 1.</td>
                        </tr>
                        <tr>
                            <td><strong>Bellman–Ford</strong></td>
                            <td>Dynamic programming</td>
                            <td>Yes (can handle negative)</td>
                            <td>No</td>
                            <td>Yes (even with negative edges, but not negative cycles)</td>
                            <td>Slower: <code>O(V × E)</code>.</td>
                        </tr>
                    </tbody>
                </table>
                 <p style={{marginTop:'10px'}}>
                  <strong>Heuristic Search</strong> means the algorithm uses additional
                  knowledge (like straight-line distance to goal) to guide the search.
                  <strong>A*</strong> is basically <span className="highlight">Dijkstra + heuristic</span>.
                </p>
            </div>
        </section>

        {/* IMPLEMENTATION */}
        <section className="section" id="implementation">
          <div className="section-header">
            <div className="section-title">
              <span className="dot"></span>
              <span>7. Sample Implementations</span>
            </div>
            <span className="section-kicker">Python & C++ code snippets</span>
          </div>

          <div className="section-grid-2">
            <div className="card">
              <p><strong>7.1 Python Implementation (Adjacency List + Heap)</strong></p>
              <pre>
{`import heapq

def dijkstra(graph, source):
    """
    graph: adjacency list
           graph[u] = list of (v, weight)
    """
    n = len(graph)
    INF = float('inf')
    dist = [INF] * n
    prev = [-1] * n

    dist[source] = 0
    pq = [(0, source)]  # (distance, node)

    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue

        for v, w in graph[u]:
            alt = dist[u] + w
            if alt < dist[v]:
                dist[v] = alt
                prev[v] = u
                heapq.heappush(pq, (alt, v))

    return dist, prev`}
              </pre>
            </div>

            <div className="card">
              <p><strong>7.2 C++ Implementation (Adjacency List + Priority Queue)</strong></p>
              <pre>
{`#include <bits/stdc++.h>
using namespace std;

void dijkstra(int n, vector<vector<pair<int,int>>> &graph, int source) {
    const int INF = 1e9;
    vector<int> dist(n, INF), parent(n, -1);
    dist[source] = 0;

    priority_queue<pair<int,int>,
                   vector<pair<int,int>>,
                   greater<pair<int,int>>> pq;

    pq.push({0, source});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;

        for (auto [v, w] : graph[u]) {
            int alt = dist[u] + w;
            if (alt < dist[v]) {
                dist[v] = alt;
                parent[v] = u;
                pq.push({alt, v});
            }
        }
    }

    // dist[i] contains shortest distance from source to i
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* DOCUMENTATION / SRS STYLE */}
        <section className="section" id="documentation">
          <div className="section-header">
            <div className="section-title">
              <span className="dot"></span>
              <span>8. Project Documentation (SRS Style Summary)</span>
            </div>
            <span className="section-kicker">Purpose, scope, requirements</span>
          </div>

          <div className="section-grid-2">
            <div className="card">
              <p><strong>8.1 Scope</strong></p>
              <ul>
                <li>Take a weighted graph as input.</li>
                <li>Allow the user to select a source node.</li>
                <li>Compute shortest distances to all nodes using Dijkstra.</li>
                <li>Display distances and reconstructed paths.</li>
                <li>Visualize algorithm behaviour on a grid.</li>
              </ul>
              <p><strong>8.2 Functional Requirements</strong></p>
              <ul>
                <li>Input: number of nodes, edges, edge weights.</li>
                <li>Input: source node.</li>
                <li>Process: run Dijkstra and store <code>dist[]</code>, <code>prev[]</code>.</li>
                <li>Output: shortest distance and path for each node.</li>
              </ul>
            </div>
            <div className="card">
              <p><strong>8.3 Non-Functional Requirements</strong></p>
              <ul>
                <li>Correctness for all graphs with non-negative weights.</li>
                <li>Time: approximately <code>O(E log V)</code> for sparse graphs.</li>
                <li>Usability: clear interface and understandable outputs.</li>
                <li>Portability: works on typical OS platforms.</li>
              </ul>
              <p><strong>8.4 Use Case (Shortest Path)</strong></p>
              <ul>
                <li>User enters graph and source node.</li>
                <li>System runs Dijkstra and computes shortest paths.</li>
<li>System displays distances and path sequences.</li>
                <li>Optional: visualize the search process (as in this website).</li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* FAQ / CONCLUSION */}
        <section className="section" id="faq">
          <div className="section-header">
            <div className="section-title">
              <span className="dot"></span>
              <span>9. FAQ & Conclusion</span>
            </div>
            <span className="section-kicker">Quick questions about Dijkstra</span>
          </div>

          <div className="card">
            <p><strong>Q1. Can Dijkstra handle negative weights?</strong></p>
            <p className="text-muted">
              No. Dijkstra’s algorithm assumes all edge weights are non-negative.
              Negative edges can make the greedy choice invalid and break correctness.
            </p>

            <p><strong>Q2. Is Dijkstra same as BFS?</strong></p>
            <p className="text-muted">
              BFS is equivalent to Dijkstra only when all edge weights are equal
              (for example, all weights = 1). For general weights, BFS cannot be used.
            </p>

            <p><strong>Q3. How is A* related to Dijkstra?</strong></p>
            <p className="text-muted">
              A* is like Dijkstra but adds a heuristic <code>h(n)</code> that estimates
              the distance to the goal. When the heuristic is admissible and consistent,
              A* still guarantees shortest path but explores fewer nodes.
            </p>

            <p><strong>Conclusion:</strong></p>
            <p>
              Dijkstra’s Algorithm is one of the most important algorithms in graph
              theory and pathfinding. It forms the foundation of many real-world
              systems from routing protocols to navigation apps. Understanding its
              steps, complexity and limitations is essential for every computer
              science student.
            </p>
          </div>
        </section>
        
        <footer>
            <span>
                Built as a complete Dijkstra learning page – theory, visualizer,
                applications &amp; project documentation.
            </span>
            <span>Shortest Path • Greedy Strategy • Non-negative Weights</span>
        </footer>
      </main>
    </DijkstraVisualizerProvider>
  );
}

    