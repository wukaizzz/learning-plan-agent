import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ChatStore, Message } from '../types/chat';

export const useChatStore = create<ChatStore>()(
  persist(
    immer((set) => ({
      messages: [],
      currentAgentId: null,
      isStreaming: false,

      addMessage: (message: Message) => set((state) => {
        state.messages.push(message);
      }),
      clearMessages: () => set((state) => {
        state.messages = [];
      }),

      setCurrentAgent: (agentId: string | null) => set((state) => {
        state.currentAgentId = agentId;
      }),

      setStreaming: (isStreaming: boolean) => set((state) => {
        state.isStreaming = isStreaming;
      }),

      updateToolCall: (toolCallId: string, updates) => set((state) => {
        state.messages.forEach(msg => {
          if (msg.tool_calls) {
            const toolCall = msg.tool_calls.find(tc => tc.id === toolCallId);
            if (toolCall) {
              Object.assign(toolCall, updates);
            }
          }
        });
      }),

      updateMessage: (messageId: string, content: string) => set((state) => {
        const message = state.messages.find(msg => msg.id === messageId);
        if (message) {
          message.content = content;
        }
      }),

      deleteMessage: (messageId: string) => set((state) => {
        state.messages = state.messages.filter(msg => msg.id !== messageId);
      }),

      addToolCall: (messageId: string, toolCall) => set((state) => {
        const message = state.messages.find(msg => msg.id === messageId);
        if (message) {
          if (!message.tool_calls) {
            message.tool_calls = [];
          }
          message.tool_calls.push(toolCall);
        }
      }),

      updateLastAssistantMessage: (content: string) => set((state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = content;
        }
      })
    })),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        messages: state.messages,
        currentAgentId: state.currentAgentId
      })
    }
  )
);
