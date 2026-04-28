import type { Tool } from '../../types/tool';
import { weatherTool } from './weatherTool';
import { webSearchTool } from './webSearchTool';

export const availableTools: Tool[] = [
  weatherTool,
  webSearchTool
];

export { weatherTool,webSearchTool };
