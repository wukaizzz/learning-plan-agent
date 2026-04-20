import type { Tool } from '../../types/tool';
import { weatherTool } from './weatherTool';
import { calculatorTool } from './calculatorTool';
import { webSearchTool } from './webSearchTool';

export const availableTools: Tool[] = [
  weatherTool,
  calculatorTool,
  webSearchTool
];

export { weatherTool, calculatorTool, webSearchTool };
