import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { MessageList,MessageInput,SessionList } from '@/components/chat/message';
import { WorkflowSection } from './WorkflowSection';
import { PlanWorkspace } from './PlanWorkspace';
import { WorkflowResumePrompt } from '@/components/workflow-resume/WorkflowResumePrompt';
import { useChat, useStream, useAgent, useWorkflow } from '@/hooks';
import { useLangGraphWorkflow } from '@/hooks/useLangGraphWorkflow';
import { useChatStore,useSpaceStore } from '@/store';
import { transformUIBlock, type WorkflowResponse } from '@/services/workflowApi';
import type { Message } from '@/types';

import './ChatPanel.css';

const RESUME_STATUS_TEXT = '正在分析你的考试时间、目标分数';
const RESUME_STEP_LABELS: Record<string, string> = {
  analyze_requirements: '已完成：分析考试时间和目标分数',
  generate_plan: '已完成：生成学习计划',
  build_ui_blocks: '已完成：构建计划展示'
};

type CollectionFormField = {
  name: string;
  label?: string;
};

function stringifySubmittedValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (value === null || value === undefined || value === '') {
    return '未填写';
  }

  return String(value);
}

function createSubmittedFormSummary(
  formData: Record<string, unknown>,
  messages: Message[]
) {
  const formMessage = [...messages].reverse().find(message =>
    message.role === 'assistant' &&
    message.ui_blocks?.some(block => block.type === 'collection-form') &&
    message.form_submission_state !== 'submitted'
  );
  const fields: CollectionFormField[] = formMessage?.ui_blocks
    ?.filter(block => block.type === 'collection-form')
    .flatMap(block => block.props?.fields || []) || [];

  if (fields.length === 0) {
    return Object.entries(formData).map(([key, value]) => ({
      label: key,
      value: stringifySubmittedValue(value)
    }));
  }

  return fields.map(field => ({
    label: field.label || field.name,
    value: stringifySubmittedValue(formData[field.name])
  }));
}

function formatResumeStatusMessage(response: WorkflowResponse): string {
  if (!response.success) {
    return `${RESUME_STATUS_TEXT}\n\n提交失败：${response.error || '未知错误'}`;
  }

  const completedNodes = new Set(response.state?.workflow.history?.map(item => item.node) || []);
  const lines = [RESUME_STATUS_TEXT, ''];

  Object.entries(RESUME_STEP_LABELS).forEach(([node, label]) => {
    if (completedNodes.has(node) || response.state?.workflow.stage === 'finalized') {
      lines.push(`- ${label}`);
    }
  });

  if (response.interrupted) {
    lines.push('- 还需要补充更多信息');
  } else if (response.state?.workflow.stage === 'finalized') {
    lines.push('- 已完成：学习计划已生成');
  }

  return lines.join('\n');
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ChatPanelProps {
  // 可以在这里添加面板相关的props
}

export const ChatPanel: React.FC<ChatPanelProps> = () => {
  const { messages, isStreaming, addUserMessage, addAssistantMessage } = useChat();
  const { streamResponse } = useStream();
  const { getCurrentAgentConfig } = useAgent();
  const {
    switchToSpaceSession,
    resetFormCollection,
    createNewSession,
    setCurrentSpace,
    uiBlocks,
    submitFormStep,
    setWorkspaceState,
    markLatestCollectionFormSubmitting,
    markLatestCollectionFormSubmitted,
    resetLatestCollectionFormSubmissionState,
    updateMessage
  } = useChatStore();
  
  // 🆕 使用精确 selector，只订阅需要的字段
  const workspaceState = useChatStore(state => state.workspaceState);
  const workflowInterrupted = useChatStore(state => state.workflowInterrupted);
  const lastFormStep = useChatStore(state => state.lastFormStep);
  const activeFormStep = useChatStore(state => state.activeFormStep);
  const formStepsData = useChatStore(state => state.formStepsData);
  const setActiveFormStep = useChatStore(state => state.setActiveFormStep);
  const currentSessionId = useChatStore(state => state.currentSessionId);
  const { transitionToState, isWorkflowActive } = useWorkflow();
  const { resume } = useLangGraphWorkflow();
  const navigate = useNavigate();
  const { spaceId } = useParams();
  const { getCurrentSpace } = useSpaceStore();

  const currentSpace = getCurrentSpace();

  // 🆕 本地状态：是否显示恢复提示
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [localFormStep, setLocalFormStep] = useState<number | null>(null);
  
  // 🆕 使用 ref 存储最新状态
  const latestStateRef = useRef({
    workspaceState,
    workflowInterrupted,
    lastFormStep,
  });
  
  // 同步最新状态到 ref
  useEffect(() => {
    latestStateRef.current = {
      workspaceState,
      workflowInterrupted,
      lastFormStep,
    };
  }, [workspaceState, workflowInterrupted, lastFormStep]);

  // 退出空间处理
  const handleExitSpace = () => {
    // 清除当前空间关联
    setCurrentSpace(null);
    navigate('/workSpace');
  };

  // 🆕 处理恢复工作流
  const handleResumeWorkflow = () => {
    console.log('▶️ 继续工作流，从步骤:', localFormStep);
    setShowResumePrompt(false);
    // 使用本地状态，避免不必要的 store 更新
    if (activeFormStep !== localFormStep && localFormStep !== null) {
      setActiveFormStep(localFormStep);
    }
  };

  // 🆕 处理重新开始工作流
  const handleRestartWorkflow = () => {
    console.log('🔄 重新开始工作流');
    setShowResumePrompt(false);
    setLocalFormStep(0);
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
      console.log('📝 创建新的通用会话');
      createNewSession();
    }
  }, [spaceId, currentSessionId, switchToSpaceSession]); // ✅ createNewSession 不需要作为依赖

  // 🆕 工作流恢复检测（使用 ref + 空依赖数组）
  useEffect(() => {
    const { workspaceState, workflowInterrupted, lastFormStep } = latestStateRef.current;
    
    if (workspaceState === 'collecting' && workflowInterrupted && lastFormStep !== null) {
      console.log('⚠️ 检测到中断的工作流，步骤:', lastFormStep);
      setLocalFormStep(lastFormStep);
      setShowResumePrompt(true);
    }
  }, []); // ✅ 空依赖数组，只在组件挂载时检查一次

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

  const handleCollectionFormSubmit = async (formData: Record<string, unknown>) => {
    submitFormStep(activeFormStep, formData);

    if (!spaceId) {
      alert('无法提交：缺少学习空间标识');
      return;
    }

    const previousFormData = Object.values(formStepsData).reduce<Record<string, unknown>>((acc, data) => {
      return { ...acc, ...(data as Record<string, unknown>) };
    }, {});
    const allFormData = { ...previousFormData, ...formData };
    const summary = createSubmittedFormSummary(allFormData, messages);

    markLatestCollectionFormSubmitting();
    setWorkspaceState('analyzing');
    const statusMessage = addAssistantMessage(RESUME_STATUS_TEXT);

    try {
      const response = await resume(spaceId, allFormData as Record<string, string | number>);

      if (!response.success) {
        throw new Error(response.error || '工作流恢复失败');
      }

      markLatestCollectionFormSubmitted(summary);
      updateMessage(statusMessage.id, formatResumeStatusMessage(response));

      const collectionForms = response.state?.uiBlocks
        ?.filter(block => block.type === 'collection-form')
        .map(transformUIBlock) || [];

      if (response.interrupted && collectionForms.length > 0) {
        addAssistantMessage(response.message || '还需要补充更多信息', undefined, {
          ui_blocks: collectionForms,
          form_submission_state: 'idle'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      resetLatestCollectionFormSubmissionState();
      updateMessage(statusMessage.id, `${RESUME_STATUS_TEXT}\n\n提交失败：${errorMessage}`);
      throw error;
    }
  };

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

      <div className="chat-workspace-layout">
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
            {/* 🆕 工作流过程区：表单、进度、工具状态 */}
            {isWorkflowActive && (
              <WorkflowSection
                workspaceState={workspaceState}
                uiBlocks={uiBlocks}
                onStateChange={transitionToState}
              />
            )}
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              onCollectionFormSubmit={handleCollectionFormSubmit}
            />
          </div>

          {/* Input */}
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={isStreaming}
          />
        </div>

        <PlanWorkspace
          workspaceState={workspaceState}
          uiBlocks={uiBlocks}
        />
      </div>
    </div>
  );
};
