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

export interface ChatSession {
  id: string;
  spaceId: string | null; // 关联的学习空间ID，null表示通用会话
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  draftMessage: string; // ChatInput输入框草稿
}

export interface ChatStore {
  messages: Message[];
  currentAgentId: string | null;
  isStreaming: boolean;
  currentSessionId: string | null;
  currentSpaceId: string | null; // 当前关联的学习空间ID
  sessions: ChatSession[];

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

  // Session management
  createNewSession: (title?: string, spaceId?: string | null) => string;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  getAllSessions: () => ChatSession[];
  getSessionsBySpace: (spaceId: string) => ChatSession[]; // 获取特定空间的会话

  // Space management
  setCurrentSpace: (spaceId: string | null) => void; // 切换当前空间
  switchToSpaceSession: (spaceId: string) => void; // 切换到特定空间的最新会话

  //  Draft management
  setSessionDraft: (sessionId: string, draft: string) => void;
  getSessionDraft: (sessionId: string) => string;
  clearSessionDraft: (sessionId: string) => void;
}
