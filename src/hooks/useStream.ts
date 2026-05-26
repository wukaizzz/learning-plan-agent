import { useCallback, useRef } from 'react';
import { useChat } from './useChat';
import { useAgent } from './useAgent';
import { useChatStore } from '../store/chatStore';
import { API_ENDPOINT } from '../utils/constants';
import type { Message, ToolCall, AgentExecutionState } from '../types/chat';
import type { WorkflowStepEvent, InfoNeededEvent, ToolCallEvent, ProcessingEvent, AnalysisResultEvent, UIBlockUpdateEvent, ThinkingEvent, ThinkingEndEvent, IntentRoutedEvent, WorkflowEvent } from '../types/workflowEvents';

const createClientId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

type SSEChunkHandler = (chunk: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

async function consumeSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: SSEChunkHandler,
  signal?: AbortSignal
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    if (signal?.aborted) break;
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          const chunk = JSON.parse(data);
          onChunk(chunk);
        } catch (e) {
          console.error('Failed to parse chunk:', e);
        }
      }
    }
  }
}

export function useStream() {
  const { addAssistantMessage, setStreaming, 
  updateToolCall, updateLastAssistantMessage } = useChat();
  const { getCurrentAgentConfig } = useAgent();
  const {
    addUIBlock,
    clearUIBlocks,
    setWorkspaceState,
    addUIBlockToLastAssistantMessage,
    currentSpaceId,
    setCurrentWorkflowEvents,
    addWorkflowEvent,
    updateMessageWorkflowEvents
  } = useChatStore();
  const currentMessageRef = useRef<string>('');
  const currentToolCallsRef = useRef<ToolCall[]>([]);
  const hasStartedStreaming = useRef<boolean>(false);
  const currentMessageIdRef = useRef<string | null>(null);
  const activeRunIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentThinkingRef = useRef<string>('');
  const isThinkingActive = useRef<boolean>(false);

  // 工作流事件处理函数
  const handleWorkflowStep = useCallback((event: WorkflowStepEvent) => {
    console.log('🔄 Workflow step:', event);
    // 只同步后端工作流阶段，不从 workflowManager 注入本地 mock blocks。
    setWorkspaceState(event.step);

    if (event.step === 'collecting') {
      clearUIBlocks();
    }

    // 可以在这里添加进度条更新逻辑
    if (event.progress !== undefined) {
      console.log(`Progress: ${event.progress}%`);
    }
  }, [clearUIBlocks, setWorkspaceState]);

  const handleInfoNeeded = useCallback((event: InfoNeededEvent) => {
    console.log('❓ Info needed:', event);
    // 这里可以：
    // 1. 显示输入框给用户
    // 2. 在聊天中显示AI的问题
    // 3. 将问题添加到消息列表
    const questionMsg = `[需要信息] ${event.question}`;
    if (!hasStartedStreaming.current) {
      addAssistantMessage(questionMsg);
      hasStartedStreaming.current = true;
    } else {
      currentMessageRef.current += `\n\n${questionMsg}`;
      updateLastAssistantMessage(currentMessageRef.current);
    }
  }, [addAssistantMessage, updateLastAssistantMessage]);

  const handleToolCall = useCallback((event: ToolCallEvent) => {
    console.log('🔧 Tool call:', event);
    // 更新工具调用状态
    const statusMap: Record<string, ToolCall['status']> = {
      pending: 'pending',
      executing: 'pending',
      completed: 'completed',
      failed: 'failed'
    };
    const toolCallData: ToolCall = {
      id: `tool_${Date.now()}`,
      tool_name: event.toolName,
      parameters: event.parameters,
      status: statusMap[event.status] || 'pending',
      result: event.result,
      error: event.error
    };

    if (event.status === 'pending') {
      currentToolCallsRef.current.push(toolCallData);
    } else {
      const existingCall = currentToolCallsRef.current.find(
        tc => tc.tool_name === event.toolName
      );
      if (existingCall) {
        Object.assign(existingCall, toolCallData);
      }
    }
  }, []);

  const handleThinking = useCallback((event: ThinkingEvent) => {
    if (!event.content && event.content !== '') return;
    currentThinkingRef.current += event.content;
    isThinkingActive.current = true;
  }, []);

  const handleThinkingEnd = useCallback((_event: ThinkingEndEvent) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    isThinkingActive.current = false;
    currentThinkingRef.current = '';
  }, []);

  const handleProcessing = useCallback((event: ProcessingEvent) => {
    console.log('⚙️ Processing:', event);
    // 可以显示处理进度
    if (event.progress !== undefined) {
      console.log(`Processing progress: ${event.progress}%`);
    }
  }, []);

  const handleIntentRouted = useCallback((event: IntentRoutedEvent) => {
    console.log('🧭 Intent routed:', event);
  }, []);

  const handleAnalysisResult = useCallback((event: AnalysisResultEvent) => {
    console.log('📊 Analysis result:', event);
    // 将分析结果格式化为可读文本
    let resultText = `\n\n📊 ${event.summary}\n`;
    if (event.findings && event.findings.length > 0) {
      resultText += '\n发现：\n';
      event.findings.forEach(finding => {
        resultText += `• ${finding}\n`;
      });
    }
    if (event.recommendations && event.recommendations.length > 0) {
      resultText += '\n建议：\n';
      event.recommendations.forEach(rec => {
        resultText += `• ${rec}\n`;
      });
    }

    currentMessageRef.current += resultText;
    if (!hasStartedStreaming.current) {
      addAssistantMessage(currentMessageRef.current);
      hasStartedStreaming.current = true;
    } else {
      updateLastAssistantMessage(currentMessageRef.current);
    }
  }, [addAssistantMessage, updateLastAssistantMessage]);

  // 🆕 处理UI Block更新事件
  const handleUIBlockUpdate = useCallback((event: UIBlockUpdateEvent) => {
    console.log('🎨 UI Block update:', event);

    if (event.action === 'add' && event.block) {
      if (event.block.type === 'collection-form') {
        if (!hasStartedStreaming.current) {
          const msg = addAssistantMessage(currentMessageRef.current, undefined, {
            ui_blocks: [event.block],
            form_submission_state: 'idle'
          });
          currentMessageIdRef.current = msg.id;
          hasStartedStreaming.current = true;
        } else {
          addUIBlockToLastAssistantMessage(event.block);
        }
        return;
      }

      addUIBlock(event.block);
    } else if (event.action === 'update' && event.block) {
      if (event.block.type === 'collection-form') {
        addUIBlockToLastAssistantMessage(event.block);
        return;
      }

      // 更新现有block（需要先删除再添加，或者直接修改）
      // 简化实现：直接添加新block
      addUIBlock(event.block);
    } else if (event.action === 'remove' && event.blockId) {
      // 移除指定block（需要在chatStore中实现removeUIBlock方法）
      console.log('Remove block:', event.blockId);
    }
  }, [addAssistantMessage, addUIBlock, addUIBlockToLastAssistantMessage]);

  // Agent Execution handlers
  const handleAgentExecutionStart = useCallback((chunk: { executionId: string; messageId?: string; title: string; steps: Array<{ stepId: string; title: string }> }) => {
    const messageId = chunk.messageId || currentMessageIdRef.current;
    if (!messageId) return;
    const execution: AgentExecutionState = {
      executionId: chunk.executionId,
      title: chunk.title,
      steps: chunk.steps.map(s => ({ ...s, status: 'pending' as const })),
      status: 'running'
    };
    useChatStore.getState().updateAgentExecution(messageId, execution);
  }, []);

  const handleAgentStepUpdate = useCallback((chunk: { executionId: string; messageId?: string; stepId: string; status: string; title?: string; summary?: string; description?: string; metadata?: Record<string, unknown> }) => {
    const messageId = chunk.messageId || currentMessageIdRef.current;
    if (!messageId) return;
    const store = useChatStore.getState();
    const message = store.messages.find(m => m.id === messageId);
    if (!message?.agent_execution) {
      // Dynamic append for unknown stepId
      const execution: AgentExecutionState = {
        executionId: chunk.executionId,
        title: '执行中',
        steps: [{ stepId: chunk.stepId, title: chunk.title || chunk.stepId, status: chunk.status as AgentExecutionState['steps'][number]['status'], summary: chunk.summary, description: chunk.description, metadata: chunk.metadata }],
        status: 'running'
      };
      store.updateAgentExecution(messageId, execution);
      return;
    }
    const prev = message.agent_execution;
    const stepIndex = prev.steps.findIndex(s => s.stepId === chunk.stepId);
    const updatedStep = {
      stepId: chunk.stepId,
      title: chunk.title || (stepIndex >= 0 ? prev.steps[stepIndex].title : chunk.stepId),
      status: chunk.status as AgentExecutionState['steps'][number]['status'],
      summary: chunk.summary ?? (stepIndex >= 0 ? prev.steps[stepIndex].summary : undefined),
      description: chunk.description ?? (stepIndex >= 0 ? prev.steps[stepIndex].description : undefined),
      metadata: chunk.metadata ?? (stepIndex >= 0 ? prev.steps[stepIndex].metadata : undefined)
    };
    const newSteps = stepIndex >= 0
      ? prev.steps.map((s, i) => i === stepIndex ? updatedStep : s)
      : [...prev.steps, updatedStep];
    store.updateAgentExecution(messageId, { ...prev, steps: newSteps });
  }, []);

  const handleAgentExecutionFinish = useCallback((chunk: { executionId: string; messageId?: string; status: string; summary?: string }) => {
    const messageId = chunk.messageId || currentMessageIdRef.current;
    if (!messageId) return;
    const store = useChatStore.getState();
    const message = store.messages.find(m => m.id === messageId);
    if (!message?.agent_execution) return;
    const prev = message.agent_execution;

    const convergedSteps = prev.steps.map(step => {
      if (chunk.status === 'completed') {
        if (step.status === 'running') return { ...step, status: 'completed' as const };
        if (step.status === 'pending') return { ...step, status: 'completed' as const };
      } else if (chunk.status === 'failed') {
        if (step.status === 'running') return { ...step, status: 'failed' as const };
      }
      return step;
    });

    store.updateAgentExecution(messageId, {
      ...prev,
      steps: convergedSteps,
      status: chunk.status as AgentExecutionState['status'],
      summary: chunk.summary
    });
  }, []);

  const ensureAssistantMessage = useCallback(() => {
    if (hasStartedStreaming.current) {
      return;
    }

    const msg = addAssistantMessage(currentMessageRef.current, currentToolCallsRef.current, {
      id: currentMessageIdRef.current || undefined
    });
    currentMessageIdRef.current = msg.id;
    hasStartedStreaming.current = true;
  }, [addAssistantMessage]);

  const appendCurrentWorkflowEvent = useCallback((event: WorkflowEvent) => {
    if (event.runId && event.runId !== activeRunIdRef.current) {
      return;
    }

    addWorkflowEvent({ ...event });

    const messageId = currentMessageIdRef.current;
    if (!messageId) {
      return;
    }

    const store = useChatStore.getState();
    const message = store.messages.find(item => item.id === messageId);
    const nextEvents = [...(message?.workflow_events || []), { ...event }];
    updateMessageWorkflowEvents(messageId, nextEvents);
  }, [addWorkflowEvent, updateMessageWorkflowEvents]);

  // TODO 对话处理核心函数
  const streamResponse = useCallback(async (
    messages: Message[],
    apiProvider: 'deepseek' | 'doubao' = 'deepseek'
  ): Promise<void> => {
    const agentConfig = getCurrentAgentConfig();
    if (!agentConfig) {
      throw new Error('No agent configuration found');
    }

    abortControllerRef.current?.abort();
    const runId = createClientId('run');
    const assistantMessageId = createClientId('msg');
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    activeRunIdRef.current = runId;
    currentMessageIdRef.current = assistantMessageId;
    currentMessageRef.current = '';
    currentToolCallsRef.current = [];
    currentThinkingRef.current = '';
    isThinkingActive.current = false;
    hasStartedStreaming.current = false;
    setCurrentWorkflowEvents([]);
    setStreaming(true);
    
    try {
      const endpoint = apiProvider === 'doubao' ? '/doubao' : '/chat';
      const response = await fetch(`${API_ENDPOINT}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          agentConfig,
          studySpaceId: currentSpaceId,
          runId,
          messageId: assistantMessageId
        }),
        signal: abortController.signal
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Stream finished
              break;
            }

            try {
              const chunk = JSON.parse(data);
              if (chunk.runId && chunk.runId !== activeRunIdRef.current) {
                continue;
              }

              switch (chunk.type) {
                case 'content':
                  // Add content chunk
                  currentMessageRef.current += chunk.content;

                  // Start streaming on first content chunk
                  if (!hasStartedStreaming.current) {
                    const msg = addAssistantMessage(currentMessageRef.current, currentToolCallsRef.current, {
                      id: assistantMessageId
                    });
                    currentMessageIdRef.current = msg.id; // 🆕 保存消息ID
                    hasStartedStreaming.current = true;
                  } else {
                    // Update the existing message in real-time
                    updateLastAssistantMessage(currentMessageRef.current);
                  }

                  break;

                case 'workflow_step':
                  // 处理工作流步骤事件
                  ensureAssistantMessage();
                  handleWorkflowStep(chunk);
                  appendCurrentWorkflowEvent(chunk); // 🆕 添加事件
                  break;

                case 'info_needed':
                  // 处理信息收集事件
                  ensureAssistantMessage();
                  handleInfoNeeded(chunk);
                  appendCurrentWorkflowEvent(chunk); // 🆕 添加事件
                  break;

                case 'tool_call':
                  // 处理工具调用事件
                  ensureAssistantMessage();
                  handleToolCall(chunk);
                  appendCurrentWorkflowEvent(chunk); // 🆕 添加事件
                  break;

                case 'processing':
                  // 处理处理进度事件
                  ensureAssistantMessage();
                  handleProcessing(chunk);
                  appendCurrentWorkflowEvent(chunk); // 🆕 添加事件
                  break;

                case 'intent_routed':
                  // 处理最终意图路由事件
                  if (chunk.payload?.intent === 'general_chat') {
                    handleIntentRouted(chunk);
                    break;
                  }
                  ensureAssistantMessage();
                  handleIntentRouted(chunk);
                  appendCurrentWorkflowEvent(chunk);
                  break;

                case 'analysis_result':
                  // 处理分析结果事件
                  ensureAssistantMessage();
                  handleAnalysisResult(chunk);
                  appendCurrentWorkflowEvent(chunk); // 🆕 添加事件
                  break;

                case 'ui_block_update':
                  ensureAssistantMessage();
                  handleUIBlockUpdate(chunk);
                  appendCurrentWorkflowEvent(chunk);
                  break;

                case 'thinking':
                  ensureAssistantMessage();
                  handleThinking(chunk);
                  appendCurrentWorkflowEvent(chunk);
                  break;

                case 'thinking_end':
                  ensureAssistantMessage();
                  handleThinkingEnd(chunk);
                  appendCurrentWorkflowEvent(chunk);
                  break;

                case 'agent_execution_start':
                  handleAgentExecutionStart(chunk);
                  break;

                case 'agent_step_update':
                  handleAgentStepUpdate(chunk);
                  break;

                case 'agent_execution_finish':
                  handleAgentExecutionFinish(chunk);
                  break;

                case 'error':
                  console.error('Stream error:', chunk.error);
                  currentMessageRef.current += `\n\n[Error: ${chunk.error}]`;
                  if (!hasStartedStreaming.current) {
                    addAssistantMessage(currentMessageRef.current, undefined, { id: assistantMessageId });
                    hasStartedStreaming.current = true;
                  } else {
                    updateLastAssistantMessage(currentMessageRef.current);
                  }
                  appendCurrentWorkflowEvent(chunk); // 🆕 添加事件
                  break;

                case 'done':
                  // Final update to ensure all content is displayed
                  if (hasStartedStreaming.current) {
                    updateLastAssistantMessage(currentMessageRef.current);
                  } else {
                    addAssistantMessage(
                      currentMessageRef.current,
                      currentToolCallsRef.current.length > 0 ? currentToolCallsRef.current : undefined,
                      { id: assistantMessageId }
                    );
                  }
                  break;
              }
            } catch (e) {
              console.error('Failed to parse chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('Streaming failed:', error);
      addAssistantMessage(`[Error: ${error instanceof Error ? error.message : 'Unknown error'}]`, undefined, {
        id: assistantMessageId
      });
    } finally {
      if (activeRunIdRef.current === runId) {
        setStreaming(false);
        setCurrentWorkflowEvents([]);
        currentMessageIdRef.current = null; // 🆕 清空消息ID
        activeRunIdRef.current = null;
        abortControllerRef.current = null;
      }
    }
  }, [getCurrentAgentConfig, addAssistantMessage, setStreaming, updateLastAssistantMessage, currentSpaceId, ensureAssistantMessage, handleIntentRouted, appendCurrentWorkflowEvent, setCurrentWorkflowEvents, handleWorkflowStep, handleInfoNeeded, handleToolCall, handleProcessing, handleAnalysisResult, handleUIBlockUpdate, handleThinking, handleThinkingEnd]);

  const streamResume = useCallback(async (params: {
    threadId: string;
    messageId: string;
    executionId: string;
    formData: Record<string, unknown>;
  }): Promise<{ finalized: boolean; interrupted: boolean }> => {
    const { threadId, messageId, executionId, formData } = params;

    currentMessageIdRef.current = messageId;
    setStreaming(true);

    let finalized = false;
    let interrupted = false;

    try {
      const response = await fetch(`${API_ENDPOINT}/workflows/${threadId}/resume-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionId, messageId, ...formData }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      await consumeSSE(reader, (chunk) => {
        switch (chunk.type) {
          case 'agent_step_update':
            handleAgentStepUpdate(chunk);
            if (chunk.status === 'waiting_input') interrupted = true;
            break;
          case 'agent_execution_finish':
            handleAgentExecutionFinish(chunk);
            if (chunk.status === 'completed') finalized = true;
            break;
          case 'workflow_step':
            handleWorkflowStep(chunk);
            if (chunk.step === 'paused') interrupted = true;
            break;
          case 'info_needed':
            handleInfoNeeded(chunk);
            interrupted = true;
            break;
          case 'ui_block_update':
            handleUIBlockUpdate(chunk);
            break;
          case 'content': {
            const store = useChatStore.getState();
            const msg = store.messages.find(m => m.id === messageId);
            const nextContent = (msg?.content || '') + chunk.content;
            useChatStore.getState().updateMessage(messageId, nextContent);
            break;
          }
          case 'thinking':
            handleThinking(chunk);
            break;
          case 'thinking_end':
            handleThinkingEnd(chunk);
            break;
          case 'error':
            console.error('Resume stream error:', chunk.error);
            break;
        }
      });

      return { finalized, interrupted };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { finalized: false, interrupted: false };
      }
      console.error('Resume streaming failed:', error);
      throw error;
    } finally {
      setStreaming(false);
    }
  }, [setStreaming, handleAgentStepUpdate, handleAgentExecutionFinish, handleWorkflowStep, handleInfoNeeded, handleUIBlockUpdate, handleThinking, handleThinkingEnd]);

  const executeTool = useCallback(async (
    toolCallId: string,
    toolName: string,
    params: Record<string, unknown>
  ): Promise<void> => {
    updateToolCall(toolCallId, { status: 'pending' });

    try {
      const response = await fetch(`${API_ENDPOINT}/tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName,
          params
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      updateToolCall(toolCallId, {
        status: 'completed',
        result: result.data
      });
    } catch (error) {
      updateToolCall(toolCallId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [updateToolCall]);

  return {
    streamResponse,
    streamResume,
    executeTool,
    isStreaming: useChat().isStreaming
  };
}
