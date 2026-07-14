// App constants
export const APP_NAME = 'AI 学习规划 Agent';
export const APP_VERSION = '1.0.0';

// API endpoint
export const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001/api';

// Storage keys
export const STORAGE_KEYS = {
  CHAT_HISTORY: 'chat-storage',
  AGENT_CONFIG: 'agent-storage'
} as const;

// UI constants
export const UI_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 5000,
  TYPING_INDICATOR_DELAY: 300,
  STREAM_UPDATE_INTERVAL: 50
} as const;
