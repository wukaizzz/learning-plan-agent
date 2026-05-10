import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { MessageList,MessageInput,SessionList } from '@/components/chat/message';
import { WorkflowSection } from './WorkflowSection';
import { WorkflowResumePrompt } from '@/components/workflow-resume/WorkflowResumePrompt';
import { useChat, useStream, useAgent, useWorkflow } from '@/hooks';
import { useChatStore,useSpaceStore } from '@/store';
import type { Message } from '@/types';

import './ChatPanel.css';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ChatPanelProps {
  // 可以在这里添加面板相关的props
}

export const ChatPanel: React.FC<ChatPanelProps> = () => {
  const { messages, isStreaming, addUserMessage } = useChat();
  const { streamResponse } = useStream();
  const { getCurrentAgentConfig } = useAgent();
  const {
    currentSessionId,
    createNewSession,
    switchToSpaceSession,
    setCurrentSpace,
    workspaceState,
    uiBlocks,
    activeFormStep,
    workflowInterrupted,
    lastFormStep,
    setActiveFormStep,
    resetFormCollection
  } = useChatStore();
  const { transitionToState, isWorkflowActive } = useWorkflow();
  const navigate = useNavigate();
  const { spaceId } = useParams();
  const { getCurrentSpace } = useSpaceStore();

  const currentSpace = getCurrentSpace();

  // 🆕 状态：是否显示恢复提示
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // 退出空间处理
  const handleExitSpace = () => {
    // 清除当前空间关联
    setCurrentSpace(null);
    navigate('/workSpace');
  };

  // 🆕 处理恢复工作流
  const handleResumeWorkflow = () => {
    console.log('▶️ 继续工作流，从步骤:', activeFormStep);
    setShowResumePrompt(false);
    // 继续显示当前的表单
  };

  // 🆕 处理重新开始工作流
  const handleRestartWorkflow = () => {
    console.log('🔄 重新开始工作流');
    setShowResumePrompt(false);
    resetFormCollection();
    setActiveFormStep(0);
    transitionToState('collecting');
  };

  // 🆕 关闭恢复提示
  const handleDismissResumePrompt = () => {
    console.log('🚫 忽略恢复提示');
    setShowResumePrompt(false);
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

  // 🆕 工作流恢复检测
  useEffect(() => {
    if (workspaceState === 'collecting' && workflowInterrupted && lastFormStep !== null) {
      console.log('⚠️ 检测到中断的工作流，步骤:', lastFormStep);
      setShowResumePrompt(true);
      setActiveFormStep(lastFormStep);
    }
  }, [workspaceState, workflowInterrupted, lastFormStep, setActiveFormStep]);

  // 🆕 组件卸载时标记工作流中断
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (workspaceState === 'collecting' && !workflowInterrupted) {
        // 标记工作流中断
        console.log('⚠️ 页面即将卸载，标记工作流在步骤', activeFormStep, '中断');
        // 注意：这里不能直接调用 store 的方法，因为页面即将卸载
        // 实际的中断标记应该在其他地方完成，比如在 submitFormStep 时
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [workspaceState, workflowInterrupted, activeFormStep]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage = addUserMessage(content);
    //TODO 消息队列，信息压缩
    // Prepare messages for API 
    const messagesForApi: Message[] = [
      ...messages,
      userMessage
    ];

    try {
      // Stream response (default to deepseek) /api/chat
      // 🆕 不再传递事件回调，因为 useStream 内部会自动处理
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
        {/* 🆕 工作流恢复提示 */}
        {showResumePrompt && (
          <WorkflowResumePrompt
            stepIndex={activeFormStep}
            totalSteps={3}
            onResume={handleResumeWorkflow}
            onRestart={handleRestartWorkflow}
            onDismiss={handleDismissResumePrompt}
          />
        )}

        {/* 🆕 工作流展示区域 - 根据状态自动显示 */}
        {isWorkflowActive && (
          <WorkflowSection
            workspaceState={workspaceState}
            uiBlocks={uiBlocks}
            onStateChange={transitionToState}
          />
        )}

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
