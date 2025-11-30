'use server';

/**
 * @fileOverview Optimizes the rendering of the shortest path on a map for better visibility.
 *
 * - optimizeRouteRendering - A function that takes the map data, shortest path, graph complexity, and point occlusion information and returns rendering instructions.
 * - OptimizeRouteRenderingInput - The input type for the optimizeRouteRendering function.
 * - OptimizeRouteRenderingOutput - The return type for the optimizeRouteRendering function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const OptimizeRouteRenderingInputSchema = z.object({
  mapWidth: z.number().describe('The width of the map in pixels.'),
  mapHeight: z.number().describe('The height of the map in pixels.'),
  shortestPath: z.string().describe('The shortest path as a sequence of node IDs.'),
  graphComplexity: z.enum(['low', 'medium', 'high']).describe('The complexity of the road graph.'),
  pointOcclusion: z.boolean().describe('Whether the shortest path is likely to be occluded by other points on the map.'),
});
export type OptimizeRouteRenderingInput = z.infer<typeof OptimizeRouteRenderingInputSchema>;

const OptimizeRouteRenderingOutputSchema = z.object({
  renderingInstructions: z.string().describe('Instructions on how to render the shortest path for optimal visibility, including color, line thickness, and any special effects like dashed lines or glows.'),
});
export type OptimizeRouteRenderingOutput = z.infer<typeof OptimizeRouteRenderingOutputSchema>;

export async function optimizeRouteRendering(input: OptimizeRouteRenderingInput): Promise<OptimizeRouteRenderingOutput> {
  return optimizeRouteRenderingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeRouteRenderingPrompt',
  input: {schema: OptimizeRouteRenderingInputSchema},
  output: {schema: OptimizeRouteRenderingOutputSchema},
  prompt: `You are an expert cartographer specializing in creating visually clear and informative maps.  You are helping to render the shortest path on a map of a city. Your goal is to provide rendering instructions that will make the shortest path easily visible to the user, even if the map is complex or the path overlaps with other points.\n
Consider the following factors:\n
- Map dimensions: The map is {{mapWidth}} pixels wide and {{mapHeight}} pixels high.\n- Shortest path: The shortest path is: {{{shortestPath}}}.\n- Graph complexity: The road graph has {{graphComplexity}} complexity.\n- Point occlusion: It is {{#if pointOcclusion}}likely{{else}}unlikely{{/if}} that the shortest path will be occluded by other points on the map.\n
Based on these factors, provide rendering instructions that specify the color, line thickness, and any special effects (e.g., dashed lines, glows) that should be used to render the shortest path. Be concise and specific.\n
Example rendering instructions:\n
- Color: #20B2AA (Light Sea Green)\n- Line thickness: 3 pixels\n- Special effects: Add a subtle glow effect to the line.\n
Rendering Instructions:`, 
});

const optimizeRouteRenderingFlow = ai.defineFlow(
  {
    name: 'optimizeRouteRenderingFlow',
    inputSchema: OptimizeRouteRenderingInputSchema,
    outputSchema: OptimizeRouteRenderingOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
         throw new Error("AI output was empty.");
      }
      return output;
    } catch (error) {
      console.error("AI flow failed, returning default style:", error);
      // Fallback to a default style if the AI call fails. This prevents server crashes.
      return {
        renderingInstructions: `
- Color: #20B2AA (Light Sea Green)
- Line thickness: 4 pixels
- Special effects: glow
        `,
      };
    }
  }
);
