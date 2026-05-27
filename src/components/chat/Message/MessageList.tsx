import React, { useEffect, useRef, useLayoutEffect } from 'react';
import type { Message } from '../../../types/chat';
import { MessageItem } from './MessageItem';
import { useChatStore } from '../../../store/chatStore';

import './MessageList.css';

interface MessageListProps {
  messages: Message[];
  isStreaming?: boolean;
  onCollectionFormSubmit?: (data: Record<string, unknown>) => Promise<void>;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming = false,
  onCollectionFormSubmit
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(0);
  const isNewSessionRef = useRef<boolean>(true);

  // 🆕 使用精确 selector，只订阅需要的字段
  const currentSessionId = useChatStore(state => state.currentSessionId);
  const saveScrollPosition = useChatStore(state => state.saveScrollPosition);
  const getScrollPosition = useChatStore(state => state.getScrollPosition);

  // 🆕 使用useLayoutEffect在组件挂载时恢复滚动位置
  useLayoutEffect(() => {
    if (currentSessionId && messagesContainerRef.current) {
      const savedPosition = getScrollPosition(currentSessionId);

      // 如果有保存的滚动位置，恢复到该位置
      if (savedPosition > 0 && !isNewSessionRef.current) {
        messagesContainerRef.current.scrollTop = savedPosition;
      } else if (messages.length > 0) {
        // 新会话或没有保存的位置，滚动到底部
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        isNewSessionRef.current = false;
      }
    }
  }, [currentSessionId, getScrollPosition, messages.length, saveScrollPosition]);

  // 🆕 组件卸载时保存当前滚动位置
  useEffect(() => {
    const sessionId = currentSessionId;
    const container = messagesContainerRef.current;
    return () => {
      if (sessionId && container) {
        saveScrollPosition(sessionId, container.scrollTop);
      }
    };
  }, [currentSessionId, saveScrollPosition]);

  // 🆕 实时保存滚动位置（用于会话切换时保存位置）
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !currentSessionId) return;

    const handleScroll = () => {
      saveScrollPosition(currentSessionId, container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [currentSessionId, saveScrollPosition]); // ✅ 函数引用现在是稳定的（由于 selector）

  // 有新消息时，如果用户已经在底部，则自动滚动到底部
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      // 如果用户已经在底部附近，自动滚动到新消息
      if (isNearBottom) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }

      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="message-list-empty">
        <div className="message-list-empty-content">
          <svg
            className="message-list-empty-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="message-list-empty-title">Start a conversation</p>
          <p className="message-list-empty-subtitle">Send a message to begin chatting with the AI agent</p>
        </div>
      </div>
    );
  }

  const lastAssistantMessage = [...messages].reverse().find(message => message.role === 'assistant');
  const hasVisibleWorkflowEvents = lastAssistantMessage?.workflow_events?.some(
    event => event.type !== 'thinking' && event.type !== 'thinking_end'
  );
  const shouldShowStreamingDots = isStreaming && (
    !lastAssistantMessage ||
    (
      !lastAssistantMessage.content &&
      !lastAssistantMessage.thinkingContent &&
      !(lastAssistantMessage.ui_blocks?.length) &&
      !hasVisibleWorkflowEvents &&
      !(lastAssistantMessage.tool_calls?.length) &&
      !lastAssistantMessage.agent_execution
    )
  );

  return (
    <div className="message-list" ref={messagesContainerRef}>
      {messages.map((message) => {
        const isUser = message.role === 'user';
        const messageClassName = isUser ? 'message-wrapper-sticky' : 'message-wrapper';
        return (
          <div
            key={message.id}
            className={messageClassName}
          >
            <MessageItem
              message={message}
              onCollectionFormSubmit={onCollectionFormSubmit}
            />
          </div>
        );
      })}
      {shouldShowStreamingDots && (
        <div className="message-streaming">
          <div className="message-streaming-dots">
            <div className="message-streaming-dot" style={{ animationDelay: '0ms' }} />
            <div className="message-streaming-dot" style={{ animationDelay: '150ms' }} />
            <div className="message-streaming-dot" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
