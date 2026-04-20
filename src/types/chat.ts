// Chat message types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  tool_name: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface ChatStore {
  messages: Message[];
  currentAgentId: string | null;
  isStreaming: boolean;

  // Actions
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setCurrentAgent: (agentId: string | null) => void;
  setStreaming: (isStreaming: boolean) => void;
  updateToolCall: (toolCallId: string, updates: Partial<ToolCall>) => void;
  updateMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  addToolCall: (messageId: string, toolCall: ToolCall) => void;
  updateLastAssistantMessage: (content: string) => void;
}
