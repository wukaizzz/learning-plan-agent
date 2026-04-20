import type { Tool } from '../../types/tool';

export const webSearchTool: Tool = {
  id: 'web_search',
  name: 'web_search',
  description: 'Search the web for information (simulated - in production connect to real search API)',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'Search query',
      required: true
    },
    {
      name: 'num_results',
      type: 'number',
      description: 'Number of results to return',
      required: false,
      default: 5
    }
  ],
  execute: async (params) => {
    const { query, num_results = 5 } = params as { query: string; num_results?: number };

    // Simulate web search results (in production, call real search API)
    const mockResults = Array.from({ length: num_results }, (_, i) => ({
      title: `Search Result ${i + 1} for "${query}"`,
      url: `https://example.com/result-${i + 1}`,
      snippet: `This is a simulated search result snippet for the query "${query}". In production, this would contain actual search results from a search API.`,
      relevance: Math.random() * 0.5 + 0.5
    }));

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      query,
      results: mockResults,
      total_results: mockResults.length
    };
  }
};
