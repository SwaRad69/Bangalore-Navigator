# **App Name**: Bengaluru Navigator

## Core Features:

- Map Loading: Load a map of Bengaluru City Center (MG Road, Brigade Road, Shivajinagar, Richmond Town area) using Leaflet, restricted to the specified bounding box. The user may specify a location by clicking on the map.
- Start/End Selection: Allow users to select start and end locations by clicking on the map.
- Graph Visualization: Visualize the road network as a graph with lines (roads) and points (intersections).
- Dijkstra Execution: Implement Dijkstra’s shortest-path algorithm to find the shortest path between the selected start and end points.
- Algorithm Visualization: Show the step-by-step execution of Dijkstra’s algorithm, highlighting visited nodes and calculated distances.
- Shortest Path Highlighting: Highlight the shortest path on the map once the algorithm completes. An LLM acts as a tool and determines how to optimally render the route given map size, graph complexity, and whether rendering the path directly will occlude points.
- UI Controls: Provide UI controls for: Select Start, Select End, Run Dijkstra, Step-by-step/Play/Pause to control the algorithm visualization.

## Style Guidelines:

- Primary color: Deep sky blue (#00BFFF) for calmness and clarity, reflective of cityscapes.
- Background color: Very light cyan (#E0FFFF), provides a clean backdrop for map data.
- Accent color: Light sea green (#20B2AA), emphasizes interactive elements and highlighted routes.
- Body and headline font: 'Inter', a grotesque-style sans-serif with a modern look suitable for all text.
- Use simple, clear icons for start and end markers, play/pause buttons, and other controls.
- Divide the UI into two main sections: a map on the left and algorithm steps/controls on the right.
- Use subtle animations to highlight the nodes and edges visited by Dijkstra's algorithm step-by-step.