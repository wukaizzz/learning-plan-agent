import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentStore, AgentConfig } from '../types/agent';
import { immer } from 'zustand/middleware/immer';
export const useAgentStore = create<AgentStore>()(
  persist(
    immer((set) => ({
      agents: [
        {
          id: 'default',
          name: 'Default Assistant',
          description: 'A helpful AI assistant with access to various tools',
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.7,
          max_tokens: 1024,
          system_prompt: 'You are a helpful AI assistant with access to various tools. Use tools when appropriate to help answer questions.',
          tools: ['weather', 'calculator', 'web_search']
        }
      ],
      currentAgent: null,
      addAgent: (agent) => set((state)=>{
        state.agents.push(agent)
      }),
      removeAgent: (agentId) => set((state) => {
        state.agents = state.agents.filter(agent => agent.id !== agentId);
        if (state.currentAgent?.id === agentId) {
          state.currentAgent = null;
        }
      }),
      updateAgent: (agentId, updates) => set((state) => {
        const agent = state.agents.find(agent => agent.id === agentId);
        if(agent){
          Object.assign(agent, updates)
        }
        if(state.currentAgent?.id === agentId){
          Object.assign(state.currentAgent, updates);
        }
      }),
        setCurrentAgent: (agent) => set((state)=>{
          state.currentAgent = agent;
        }),
    })),
    {
      name: 'agent-storage'
    }
  )
);
