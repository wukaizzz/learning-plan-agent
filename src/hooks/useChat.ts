import { useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import type { Message, ToolCall } from '../types/chat';

export function useChat() {
  const {
    messages,
    currentAgentId,
    isStreaming,
    addMessage,
    clearMessages,
    setCurrentAgent,
    setStreaming,
    updateToolCall,
    updateLastAssistantMessage
  } = useChatStore();

  const addUserMessage = useCallback((content: string) => {
    const message: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now()
    };
    addMessage(message);
    return message;
  }, [addMessage]);

  const addAssistantMessage = useCallback((content: string, toolCalls?: ToolCall[]) => {
    const message: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
      tool_calls: toolCalls
    };
    addMessage(message);
    return message;
  }, [addMessage]);

  const updateAssistantMessage = useCallback((messageId: string, content: string) => {
    // This would be implemented if we needed to update existing messages
    // For now, we just append new content
  }, []);

  return {
    messages,
    currentAgentId,
    isStreaming,
    addUserMessage,
    addAssistantMessage,
    clearMessages,
    setCurrentAgent,
    setStreaming,
    updateToolCall,
    updateLastAssistantMessage
  };
}
