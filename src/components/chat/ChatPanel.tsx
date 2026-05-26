import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { MessageList, MessageInput, SessionList } from '@/components/chat/message';
import { WorkflowSection } from './WorkflowSection';
import { PlanWorkspace } from './PlanWorkspace';
import { WorkflowResumePrompt } from '@/components/workflow-resume/WorkflowResumePrompt';
import { useChat, useStream, useAgent, useWorkflow } from '@/hooks';
import { useChatStore, useSpaceStore } from '@/store';
import type { Message } from '@/types';
import { logger } from '@/logger';
import './ChatPanel.css';

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
    .flatMap(block => (block.props?.fields as CollectionFormField[] | undefined) || []) || [];

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

export const ChatPanel: React.FC = () => {
  const { messages, isStreaming, addUserMessage } = useChat();
  const { streamResponse, streamResume } = useStream();
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
    resetLatestCollectionFormSubmissionState
  } = useChatStore();

  const workspaceState = useChatStore(state => state.workspaceState);
  const workflowInterrupted = useChatStore(state => state.workflowInterrupted);
  const lastFormStep = useChatStore(state => state.lastFormStep);
  const activeFormStep = useChatStore(state => state.activeFormStep);
  const formStepsData = useChatStore(state => state.formStepsData);
  const setActiveFormStep = useChatStore(state => state.setActiveFormStep);
  const currentSessionId = useChatStore(state => state.currentSessionId);
  const { transitionToState, isWorkflowActive } = useWorkflow();
  const navigate = useNavigate();
  const { spaceId } = useParams();
  const { getCurrentSpace } = useSpaceStore();

  const currentSpace = getCurrentSpace();
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [localFormStep, setLocalFormStep] = useState<number | null>(null);

  const latestStateRef = useRef({
    workspaceState,
    workflowInterrupted,
    lastFormStep
  });

  useEffect(() => {
    latestStateRef.current = {
      workspaceState,
      workflowInterrupted,
      lastFormStep
    };
  }, [workspaceState, workflowInterrupted, lastFormStep]);

  const handleExitSpace = () => {
    setCurrentSpace(null);
    navigate('/workSpace');
  };

  const handleResumeWorkflow = () => {
    setShowResumePrompt(false);
    if (activeFormStep !== localFormStep && localFormStep !== null) {
      setActiveFormStep(localFormStep);
    }
  };

  const handleRestartWorkflow = () => {
    setShowResumePrompt(false);
    setLocalFormStep(0);
    resetFormCollection();
    setActiveFormStep(0);
    transitionToState('collecting');
  };

  const handleDismissResumePrompt = () => {
    setShowResumePrompt(false);
  };

  useEffect(() => {
    if (spaceId) {
      switchToSpaceSession(spaceId);
    } else if (!currentSessionId) {
      createNewSession();
    }
  }, [spaceId, currentSessionId, switchToSpaceSession, createNewSession]);

  useEffect(() => {
    const { workspaceState, workflowInterrupted, lastFormStep } = latestStateRef.current;

    if (workspaceState === 'collecting' && workflowInterrupted && lastFormStep !== null) {
      setLocalFormStep(lastFormStep);
      setShowResumePrompt(true);
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (workspaceState === 'collecting' && !workflowInterrupted) {
        console.log('Workflow collecting during page unload at step:', activeFormStep);
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
    markLatestCollectionFormSubmitted(summary);

    const store = useChatStore.getState();
    const execMessage = [...store.messages].reverse()
      .find(m => m.role === 'assistant' && m.agent_execution && m.agent_execution.status !== 'completed');

    if (!execMessage?.agent_execution) {
      throw new Error('No active agent execution found');
    }

    const { executionId } = execMessage.agent_execution;
    const messageId = execMessage.id;

    // Reset steps 3-5 to pending, keep 1-2 completed
    const resetSteps = execMessage.agent_execution.steps.map((step, i) =>
      i >= 2
        ? { ...step, status: 'pending' as const, summary: undefined }
        : { ...step, status: 'completed' as const, summary: step.summary || '信息已补充' }
    );
    store.updateAgentExecution(messageId, {
      ...execMessage.agent_execution,
      steps: resetSteps,
      status: 'running'
    });

    setWorkspaceState('analyzing');

    try {
      const result = await streamResume({
        threadId: spaceId,
        messageId,
        executionId,
        formData: allFormData
      });

      if (result.finalized) {
        setWorkspaceState('finalized');
      } else if (result.interrupted) {
        setWorkspaceState('paused');
      }
    } catch (error) {
      resetLatestCollectionFormSubmissionState();
      throw error;
    }
  };

  const handleSendMessage = async (content: string) => {
    if (spaceId) {
      const store = useChatStore.getState();
      const currentSession = store.currentSessionId
        ? store.sessions.find(session => session.id === store.currentSessionId)
        : null;

      if (!currentSession || currentSession.spaceId !== spaceId) {
        store.switchToSpaceSession(spaceId);
      }
    }

    addUserMessage(content);
    const messagesForApi: Message[] = useChatStore.getState().messages;
    logger.info(
      { 
        messages: messagesForApi, 
        position: "chanPanel" 
      }, 
      'chanPanel sendMessage'
    );
    try {
      await streamResponse(messagesForApi, 'deepseek');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const currentAgent = getCurrentAgentConfig();

  return (
    <div className="chat-panel-container">
      <SessionList />

      <div className="chat-workspace-layout">
        <div className="chat-panel">
          {showResumePrompt && (
            <WorkflowResumePrompt
              stepIndex={activeFormStep}
              totalSteps={3}
              onResume={handleResumeWorkflow}
              onRestart={handleRestartWorkflow}
              onDismiss={handleDismissResumePrompt}
            />
          )}

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

          <div className="chat-panel-messages">
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
