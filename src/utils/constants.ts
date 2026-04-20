// App constants
export const APP_NAME = 'React Agent Chat';
export const APP_VERSION = '1.0.0';

// Default agent settings
export const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 1024;

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
