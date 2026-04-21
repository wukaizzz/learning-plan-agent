import React from 'react';
import type { Message } from '../../types/chat';
import { MessageItem } from './MessageItem';

import './MessageList.css';

interface MessageListProps {
  messages: Message[];
  isStreaming?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming = false
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

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

  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      {isStreaming && (
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



