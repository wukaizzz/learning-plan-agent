import type { Tool } from '../../types/tool';

export const weatherTool: Tool = {
  id: 'weather',
  name: 'get_weather',
  description: 'Get the current weather information for a specific location',
  parameters: [
    {
      name: 'location',
      type: 'string',
      description: 'The city name or location (e.g., "New York", "London")',
      required: true
    },
    {
      name: 'unit',
      type: 'string',
      description: 'Temperature unit (celsius or fahrenheit)',
      required: false,
      default: 'celsius'
    }
  ],
  execute: async (params) => {
    const { location, unit = 'celsius' } = params as { location: string; unit?: string };

    // Simulate weather data (in production, call a real weather API)
    const mockWeatherData = {
      location,
      temperature: unit === 'celsius' ? 22 : 72,
      condition: 'Partly Cloudy',
      humidity: 65,
      wind_speed: 12,
      unit
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return mockWeatherData;
  }
};
