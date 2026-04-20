import type { Tool } from '../../types/tool';

export const calculatorTool: Tool = {
  id: 'calculator',
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: [
    {
      name: 'expression',
      type: 'string',
      description: 'Mathematical expression to evaluate (e.g., "2 + 2", "10 * 5")',
      required: true
    }
  ],
  execute: async (params) => {
    const { expression } = params as { expression: string };

    try {
      // Safe evaluation of mathematical expressions
      // Only allow basic math operations for security
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
      const result = Function(`"use strict"; return (${sanitized})`)();

      return {
        expression,
        result,
        success: true
      };
    } catch (error) {
      return {
        expression,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Invalid expression'
      };
    }
  }
};
