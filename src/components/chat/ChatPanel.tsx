import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router';
import { MessageList, MessageInput } from '@/components/chat/message';
import { WorkflowSection } from './WorkflowSection';
import { WorkflowResumePrompt } from '@/components/workflow-resume/WorkflowResumePrompt';
import { useChat, useStream, useAgent, useWorkflow } from '@/hooks';
import { useChatStore, useSpaceStore } from '@/store';
import { traceAgent } from '@/shared/debug/agentTrace';
import { mapSpaceToContext } from '@/utils/spaceContextMapper';
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
  const { spaceId } = useParams();
  const { getCurrentSpace } = useSpaceStore();
  const spaces = useSpaceStore(state => state.spaces);

  const currentSpace = spaceId
    ? spaces.find(space => space.id === spaceId) || null
    : getCurrentSpace();
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
    traceAgent({
      layer: 'frontend:ChatPanel', label: 'handleCollectionFormSubmit',
      threadId: spaceId,
      data: { activeFormStep, formDataKeys: Object.keys(formData) }
    });
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

    traceAgent({
      layer: 'frontend:ChatPanel', label: 'active execution found',
      messageId, executionId,
      data: { stepStatuses: execMessage.agent_execution.steps.map(s => `${s.stepId}:${s.status}`) }
    });

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
        traceAgent({
          layer: 'frontend:ChatPanel', label: 'streamResume result',
          threadId: spaceId, messageId, executionId,
          data: { finalized: true, interrupted: false, workspaceState: 'finalized' }
        });
        setWorkspaceState('finalized');
      } else if (result.interrupted) {
        traceAgent({
          layer: 'frontend:ChatPanel', label: 'streamResume result',
          threadId: spaceId, messageId, executionId,
          data: { finalized: false, interrupted: true, workspaceState: 'paused' }
        });
        setWorkspaceState('paused');
      }
    } catch (error) {
      resetLatestCollectionFormSubmissionState();
      throw error;
    }
  };

  const handleSendMessage = async (content: string) => {
    traceAgent({
      layer: 'frontend:ChatPanel', label: 'handleSendMessage',
      threadId: spaceId,
      data: { contentLength: content.length }
    });
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
    const spaceForRequest = spaceId
      ? useSpaceStore.getState().spaces.find(space => space.id === spaceId)
      : null;
    const studySpaceContext = spaceForRequest
      ? mapSpaceToContext(spaceForRequest)
      : undefined;
    logger.info(
      { 
        messageCount: messagesForApi.length,
        hasStudySpaceContext: !!studySpaceContext,
        position: "chanPanel" 
      }, 
      'chanPanel sendMessage'
    );
    try {
      await streamResponse(messagesForApi, 'deepseek', { studySpaceContext });
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const currentAgent = getCurrentAgentConfig();

  return (
    <div className="chat-panel-container">
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
              <div className="chat-panel-title-info">
                <h1 className="chat-panel-title">
                  {currentSpace?.name || currentAgent?.name || 'AI 学习空间'}
                </h1>
                <p className="chat-panel-subtitle">
                  {currentSpace ? currentSpace.description : (currentAgent?.description || 'Chat with AI agent powered by DeepSeek')}
                </p>
              </div>
            </div>
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
    </div>
  );
};
