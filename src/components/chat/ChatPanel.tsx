import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useChat, useStream, useAgent } from '../../hooks';
import type { Message } from '../../types/chat';
import './ChatPanel.css';

interface ChatPanelProps {
}

export const ChatPanel: React.FC<ChatPanelProps> = () => {
  const { messages, isStreaming, addUserMessage } = useChat();
  const { streamResponse } = useStream();
  const { getCurrentAgentConfig } = useAgent();

  const handleSendMessage = async (content: string) => {
    // Add user message 
    const userMessage = addUserMessage(content);

    // Prepare messages for API
    const messagesForApi: Message[] = [
      ...messages,
      userMessage
    ];

    try {
      // Stream response (default to deepseek)
      await streamResponse(messagesForApi, 'deepseek');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const currentAgent = getCurrentAgentConfig();

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-panel-header">
        <div className="chat-panel-header-content">
          <div className="chat-panel-title-section">
            <h1 className="chat-panel-title">
              {currentAgent?.name || 'AI Agent Chat'}
            </h1>
            <p className="chat-panel-subtitle">
              {currentAgent?.description || 'Chat with AI agent powered by DeepSeek'}
            </p>
          </div>
          {isStreaming && (
            <div className="chat-panel-streaming">
              <LoadingSpinner size="sm" />
              <span className="chat-panel-streaming-text">Thinking...</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-panel-messages">
        <MessageList messages={messages} isStreaming={isStreaming} />
      </div>

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isStreaming}
      />
    </div>
  );
};
