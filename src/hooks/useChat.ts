import { useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import type { Message, ToolCall } from '../types/chat';
import type { WorkflowEvent } from '../types/workflowEvents';

export function useChat() {
  const messages = useChatStore(s => s.messages);
  const currentAgentId = useChatStore(s => s.currentAgentId);
  const isStreaming = useChatStore(s => s.isStreaming);
  const addMessage = useChatStore(s => s.addMessage);
  const clearMessages = useChatStore(s => s.clearMessages);
  const setCurrentAgent = useChatStore(s => s.setCurrentAgent);
  const setStreaming = useChatStore(s => s.setStreaming);
  const updateToolCall = useChatStore(s => s.updateToolCall);
  const updateLastAssistantMessage = useChatStore(s => s.updateLastAssistantMessage);
  const setCurrentWorkflowEvents = useChatStore(s => s.setCurrentWorkflowEvents);
  const addWorkflowEvent = useChatStore(s => s.addWorkflowEvent);
  const updateMessageWorkflowEvents = useChatStore(s => s.updateMessageWorkflowEvents);

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

  const addAssistantMessage = useCallback((content: string, toolCalls?: ToolCall[], extras?: Partial<Message>) => {
    const bufferedWorkflowEvents = useChatStore.getState().currentWorkflowEvents;
    const message: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
      tool_calls: toolCalls,
      ...extras,
      workflow_events: extras?.workflow_events ?? bufferedWorkflowEvents
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
    const store = useChatStore.getState();
    const lastMessage = store.messages[store.messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      updateMessageWorkflowEvents(lastMessage.id, [...(lastMessage.workflow_events || []), event]);
    }
  }, [addWorkflowEvent, updateMessageWorkflowEvents]);

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
