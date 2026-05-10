import { useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import type { Message, ToolCall } from '../types/chat';
import type { WorkflowEvent } from '../types/workflowEvents';

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
    updateLastAssistantMessage,
    setCurrentWorkflowEvents, // 🆕
    addWorkflowEvent, // 🆕
    updateMessageWorkflowEvents // 🆕
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
      tool_calls: toolCalls,
      workflow_events: [] // 🆕 初始化空事件数组
    };
    addMessage(message);

    // 🆕 重置当前工作流事件
    setCurrentWorkflowEvents([]);

    return message;
  }, [addMessage, setCurrentWorkflowEvents]);

  // 🆕 添加工作流事件到当前消息
  const appendWorkflowEvent = useCallback((event: WorkflowEvent) => {
    addWorkflowEvent(event);

    // 🆕 实时更新最后一条消息的事件
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        updateMessageWorkflowEvents(lastMessage.id, [...(lastMessage.workflow_events || []), event]);
      }
    }
  }, [addWorkflowEvent, messages, updateMessageWorkflowEvents]);

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
    updateLastAssistantMessage,
    appendWorkflowEvent // 🆕 导出
  };
}
