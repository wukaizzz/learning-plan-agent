import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { SessionList } from './SessionList';
import { useChat, useStream, useAgent } from '../../hooks';
import { useChatStore } from '../../store/chatStore';
import { useSpaceStore } from '../../store/spaceStore';
import type { Message } from '../../types/chat';
import './ChatPanel.css';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ChatPanelProps {
  // 可以在这里添加面板相关的props
}

export const ChatPanel: React.FC<ChatPanelProps> = () => {
  const { messages, isStreaming, addUserMessage } = useChat();
  const { streamResponse } = useStream();
  const { getCurrentAgentConfig } = useAgent();
  const { currentSessionId, createNewSession, switchToSpaceSession, setCurrentSpace } = useChatStore();
  const navigate = useNavigate();
  const { spaceId } = useParams();
  const { getCurrentSpace } = useSpaceStore();

  const currentSpace = getCurrentSpace();

  // 退出空间处理
  const handleExitSpace = () => {
    // 清除当前空间关联
    setCurrentSpace(null);
    navigate('/workSpace');
  };

  // 当进入空间时，切换到对应空间的聊天会话
  useEffect(() => {
    console.log('🚪 ChatPanel 进入空间调试:', {
      urlSpaceId: spaceId,
      currentSessionId: currentSessionId
    });

    if (spaceId) {
      console.log('🎯 调用 switchToSpaceSession:', spaceId);
      switchToSpaceSession(spaceId);
    } else if (!currentSessionId) {
      // 如果没有 spaceId 且没有当前会话，创建通用会话
      console.log('📝 创建新的通用会话');
      createNewSession();
    }
  }, [spaceId]); // 只依赖 spaceId，避免无限循环

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
    <div className="chat-panel-container">
      {/* Sidebar - Session List */}
      <SessionList />

      {/* Main Chat Panel */}
      <div className="chat-panel">
        {/* Header */}
        <div className="chat-panel-header">
          <div className="chat-panel-header-content">
            <div className="chat-panel-title-section">
              <div className="chat-panel-title-with-exit">
                <div className="chat-panel-title-info">
                  <h1 className="chat-panel-title">
                    {currentSpace?.name || currentAgent?.name || 'AI 学习空间'}
                  </h1>
                  <p className="chat-panel-subtitle">
                    {currentSpace ? currentSpace.description : (currentAgent?.description || 'Chat with AI agent powered by DeepSeek')}
                  </p>
                </div>
                <button
                  className="chat-panel-exit-btn"
                  onClick={handleExitSpace}
                  title="退出空间"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 13L5 8M5 8L10 3M5 8H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  退出空间
                </button>
              </div>
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
    </div>
  );
};
