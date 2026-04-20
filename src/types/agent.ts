// Agent configuration and types
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  tools: string[]; // Tool IDs that this agent can use
}

export interface AgentStore {
  agents: AgentConfig[];
  currentAgent: AgentConfig | null;

  // Actions
  addAgent: (agent: AgentConfig) => void;
  removeAgent: (agentId: string) => void;
  updateAgent: (agentId: string, updates: Partial<AgentConfig>) => void;
  setCurrentAgent: (agent: AgentConfig | null) => void;
}

export interface StreamChunk {
  type: 'content' | 'tool_call' | 'error' | 'done';
  content?: string;
  tool_call?: {
    id: string;
    tool_name: string;
    parameters: Record<string, unknown>;
  };
  error?: string;
}
