import { useCallback } from 'react';
import { useAgentStore } from '../store/agentStore';
import type { AgentConfig } from '../types/agent';

export function useAgent() {
  const { agents, currentAgent, addAgent, removeAgent, updateAgent, setCurrentAgent } = useAgentStore();

  const getCurrentAgentConfig = useCallback((): AgentConfig | null => {
    return currentAgent || agents[0] || null;
  }, [currentAgent, agents]);

  return {
    agents,
    currentAgent,
    addAgent,
    removeAgent,
    updateAgent,
    setCurrentAgent,
    getCurrentAgentConfig
  };
}
