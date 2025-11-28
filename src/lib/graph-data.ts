import type { Graph } from '@/lib/types';

const nodes = [
  { id: 'shivajinagar', name: 'Shivajinagar Bus Station', x: 250, y: 100 },
  { id: 'cubbon_park_metro', name: 'Cubbon Park Metro', x: 200, y: 250 },
  { id: 'st_marks_cathedral', name: "St. Mark's Cathedral", x: 350, y: 280 },
  { id: 'mg_road_metro', name: 'MG Road Metro', x: 450, y: 250 },
  { id: 'trinity_metro', name: 'Trinity Metro', x: 650, y: 240 },
  { id: 'visvesvaraya_museum', name: 'Visvesvaraya Museum', x: 220, y: 400 },
  { id: 'ub_city', name: 'UB City', x: 230, y: 500 },
  { id: 'st_marthas_hospital', name: "St. Martha's Hospital", x: 50, y: 450 },
  { id: 'corporation_circle', name: 'Corporation Circle', x: 100, y: 600 },
  { id: 'garuda_mall', name: 'Garuda Mall', x: 500, y: 450 },
  { id: 'richmond_circle', name: 'Richmond Circle', x: 350, y: 650 },
  { id: 'johnson_market', name: 'Johnson Market', x: 550, y: 680 },
  { id: 'shantinagar_bus', name: 'Shantinagar Bus Station', x: 450, y: 800 },
  { id: 'brigade_road_junction', name: 'Brigade Road Junction', x: 520, y: 350 },
  { id: 'commercial_street', name: 'Commercial Street', x: 380, y: 150 },
];

const edges = [
  // Shivajinagar area
  { source: 'shivajinagar', target: 'commercial_street' },
  { source: 'shivajinagar', target: 'cubbon_park_metro' },
  { source: 'commercial_street', target: 'mg_road_metro' },
  
  // MG Road / Cubbon Park
  { source: 'cubbon_park_metro', target: 'st_marks_cathedral' },
  { source: 'cubbon_park_metro', target: 'visvesvaraya_museum' },
  { source: 'st_marks_cathedral', target: 'mg_road_metro' },
  { source: 'st_marks_cathedral', target: 'visvesvaraya_museum' },
  { source: 'st_marks_cathedral', target: 'ub_city' },
  { source: 'mg_road_metro', target: 'trinity_metro' },
  { source: 'mg_road_metro', target: 'brigade_road_junction' },

  // Brigade Road / Richmond Town
  { source: 'brigade_road_junction', target: 'garuda_mall' },
  { source: 'trinity_metro', target: 'garuda_mall' },
  { source: 'garuda_mall', target: 'richmond_circle' },
  { source: 'garuda_mall', target: 'johnson_market' },
  
  // South area
  { source: 'visvesvaraya_museum', target: 'ub_city' },
  { source: 'visvesvaraya_museum', target: 'st_marthas_hospital' },
  { source: 'ub_city', target: 'richmond_circle' },
  { source: 'ub_city', target: 'corporation_circle' },
  { source: 'st_marthas_hospital', target: 'corporation_circle' },
  { source: 'corporation_circle', target: 'richmond_circle' },
  { source: 'richmond_circle', target: 'shantinagar_bus' },
  { source: 'richmond_circle', target: 'johnson_market' },
  { source: 'johnson_market', target: 'shantinagar_bus' },
];

const calculateDistance = (node1Id: string, node2Id: string) => {
  const node1 = nodes.find(n => n.id === node1Id);
  const node2 = nodes.find(n => n.id === node2Id);
  if (!node1 || !node2) return 0;
  return Math.sqrt(Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2));
};

export const bengaluruGraph: Graph = {
  nodes,
  edges: edges.map((edge, i) => ({
    ...edge,
    id: `e${i}`,
    weight: calculateDistance(edge.source, edge.target),
  })),
};
