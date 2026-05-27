/**
 * User-facing Agent progress stream.
 *
 * Converts raw SSE events into readable steps. Internal event names stay in the
 * data layer; users see what the Agent is currently doing.
 */

import React, { useEffect, useMemo, useState } from 'react';
import type {
  AnalysisResultEvent,
  InfoNeededEvent,
  IntentRoutedEvent,
  ProcessingEvent,
  ThinkingEvent,
  ToolCallEvent,
  UIBlockUpdateEvent,
  WorkflowEvent,
  WorkflowStepEvent
} from '@/types/workflowEvents';
import './WorkflowEvents.css';

interface WorkflowEventsProps {
  events: WorkflowEvent[];
  isStreaming?: boolean;
  hasAgentExecution?: boolean;
}

type StepStatus = 'running' | 'completed' | 'pending' | 'failed';

interface AgentProgressStep {
  id: string;
  title: string;
  detail?: string;
  status: StepStatus;
  type: string;
  streamText?: string;
  result?: unknown;
}

const WORKFLOW_STEP_LABELS: Record<string, string> = {
  collecting: '检查学习计划所需信息',
  analyzing: '分析目标和时间压力',
  generating: '生成学习任务和计划结构',
  reviewing: '整理计划展示',
  finalized: '学习计划已生成',
  paused: '等待补充信息'
};

const PROCESSING_LABELS: Record<string, string> = {
  intent_detection: '分析请求',
  public_process: '识别需求',
  intent_classification: '确定处理方式',
  rule_fallback: '确认处理意图'
};

const TOOL_LABELS: Record<string, string> = {
  calculator: '计算工具',
  weather: '天气工具',
  web_search: '搜索工具'
};

function getFieldLabel(event: InfoNeededEvent & { field?: string; fieldLabel?: string }) {
  const field = event.fieldLabel || event.fieldName || event.field || '';
  const labels: Record<string, string> = {
    'goal.examDate': '考试日期',
    examDate: '考试日期',
    'goal.targetScore': '目标分数',
    targetScore: '目标分数',
    subjects: '考试科目',
    intent: '处理意图',
    'availability.dailyHours': '每日学习时间',
    dailyHours: '每日学习时间'
  };

  return labels[field] || field || '必要信息';
}

function upsertStep(steps: AgentProgressStep[], next: AgentProgressStep) {
  const index = steps.findIndex(step => step.id === next.id);
  if (index === -1) {
    steps.push(next);
    return;
  }

  steps[index] = {
    ...steps[index],
    ...next,
    streamText: next.streamText ?? steps[index].streamText
  };
}

function completePreviousRunningSteps(steps: AgentProgressStep[], activeStepId: string) {
  steps.forEach(step => {
    if (step.id !== activeStepId && step.status === 'running') {
      step.status = 'completed';
    }
  });
}

function createProcessSteps(events: WorkflowEvent[]): AgentProgressStep[] {
  const steps: AgentProgressStep[] = [];
  let activeStepId: string | null = null;

  for (const event of events) {
    switch (event.type) {
      case 'processing': {
        const processing = event as ProcessingEvent;
        const id = `processing:${processing.stage}`;
        activeStepId = id;
        completePreviousRunningSteps(steps, id);
        upsertStep(steps, {
          id,
          type: 'processing',
          title: PROCESSING_LABELS[processing.stage] || '处理请求',
          detail: processing.details,
          status: 'running'
        });
        break;
      }

      case 'intent_routed': {
        const routed = event as IntentRoutedEvent;
        const id = 'intent:routed';
        activeStepId = id;
        completePreviousRunningSteps(steps, id);
        upsertStep(steps, {
          id,
          type: 'intent_routed',
          title: '选择处理流程',
          detail: routed.payload.message,
          status: 'completed'
        });
        break;
      }

      case 'workflow_step': {
        const workflowStep = event as WorkflowStepEvent;
        const id = `workflow:${workflowStep.step}`;
        activeStepId = id;
        completePreviousRunningSteps(steps, id);
        upsertStep(steps, {
          id,
          type: 'workflow_step',
          title: WORKFLOW_STEP_LABELS[workflowStep.step] || '推进学习计划流程',
          detail: workflowStep.message,
          status: workflowStep.step === 'finalized' ? 'completed' : 'running'
        });
        break;
      }

      case 'ui_block_update': {
        const uiBlock = event as UIBlockUpdateEvent;
        if (uiBlock.action !== 'add' || uiBlock.block?.type !== 'collection-form') {
          break;
        }
        const id = 'ui:collection-form';
        activeStepId = id;
        completePreviousRunningSteps(steps, id);
        upsertStep(steps, {
          id,
          type: 'ui_block_update',
          title: '准备信息收集表单',
          detail: '我已经整理好需要你补充的信息。',
          status: 'completed'
        });
        break;
      }

      case 'info_needed': {
        const infoNeeded = event as InfoNeededEvent & { field?: string; fieldLabel?: string };
        const label = getFieldLabel(infoNeeded);
        const id = `info_needed:${infoNeeded.fieldName || infoNeeded.field || label}`;
        activeStepId = id;
        completePreviousRunningSteps(steps, id);
        upsertStep(steps, {
          id,
          type: 'info_needed',
          title: `需要补充${label}`,
          detail: infoNeeded.question,
          status: 'pending'
        });
        break;
      }

      case 'tool_call': {
        const toolCall = event as ToolCallEvent & { id?: string; reason?: string; message?: string };
        const id = `tool:${toolCall.id || toolCall.toolName}`;
        activeStepId = id;
        completePreviousRunningSteps(steps, id);
        const toolLabel = TOOL_LABELS[toolCall.toolName] || toolCall.toolName;
        const status: StepStatus =
          toolCall.status === 'failed' ? 'failed' :
          toolCall.status === 'completed' ? 'completed' :
          'running';
        upsertStep(steps, {
          id,
          type: 'tool_call',
          title: status === 'completed' ? `${toolLabel}调用完成` : `正在调用${toolLabel}`,
          detail: toolCall.message || toolCall.reason,
          status,
          result: toolCall.result || toolCall.error
        });
        break;
      }

      case 'thinking': {
        if (!activeStepId) {
          activeStepId = 'processing:thinking';
          upsertStep(steps, {
            id: activeStepId,
            type: 'thinking',
          title: '分析处理方式',
            status: 'running'
          });
        }
        const thinking = event as ThinkingEvent;
        const activeStep = steps.find(step => step.id === activeStepId);
        if (activeStep && thinking.content) {
          activeStep.streamText = `${activeStep.streamText || ''}${thinking.content}`;
        }
        break;
      }

      case 'thinking_end': {
        if (activeStepId) {
          const activeStep = steps.find(step => step.id === activeStepId);
          if (activeStep && activeStep.status === 'running') {
            activeStep.status = 'completed';
          }
        }
        break;
      }

      case 'analysis_result': {
        const analysis = event as AnalysisResultEvent;
        const id = 'analysis:result';
        activeStepId = id;
        completePreviousRunningSteps(steps, id);
        upsertStep(steps, {
          id,
          type: 'analysis_result',
          title: '整理分析结果',
          detail: analysis.summary,
          status: 'completed',
          result: {
            findings: analysis.findings,
            recommendations: analysis.recommendations
          }
        });
        break;
      }

      case 'error': {
        const id = 'error';
        activeStepId = id;
        completePreviousRunningSteps(steps, id);
        upsertStep(steps, {
          id,
          type: 'error',
          title: '处理遇到问题',
          detail: (event as { error?: string }).error,
          status: 'failed'
        });
        break;
      }

      case 'content':
      case 'done':
        break;
    }
  }

  return steps;
}

const EVENTS_DUPLICATED_BY_AGENT_EXECUTION = new Set([
  'workflow_step',
  'ui_block_update',
  'analysis_result'
]);

export const WorkflowEvents: React.FC<WorkflowEventsProps> = ({
  events,
  isStreaming = false,
  hasAgentExecution = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const filteredEvents = useMemo(() => {
    const withoutThinking = events.filter(
      e => e.type !== 'thinking' && e.type !== 'thinking_end'
    );
    if (!hasAgentExecution) return withoutThinking;
    return withoutThinking.filter(e => !EVENTS_DUPLICATED_BY_AGENT_EXECUTION.has(e.type));
  }, [events, hasAgentExecution]);
  const steps = useMemo(() => createProcessSteps(filteredEvents), [filteredEvents]);

  useEffect(() => {
    if (isStreaming && steps.length > 0) {
      setIsExpanded(true); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [isStreaming, steps.length]);

  if (steps.length === 0) {
    return null;
  }

  const hasRunningStep = steps.some(step => step.status === 'running');
  const completedCount = steps.filter(step => step.status === 'completed').length;

  return (
    <div className={`workflow-events ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button
        className="workflow-events-header"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <span className="workflow-events-title">
          <span className={`workflow-events-status-dot ${hasRunningStep ? 'running' : 'done'}`} />
          <span>{hasRunningStep ? 'Agent 正在处理' : 'Agent 处理过程'}</span>
          <span className="workflow-events-count">
            {completedCount}/{steps.length}
          </span>
        </span>
        <span className={`workflow-events-toggle ${isExpanded ? 'open' : 'closed'}`}>
          ▾
        </span>
      </button>

      {isExpanded && (
        <div className="workflow-events-content">
          {steps.map(step => (
            <AgentProgressStepItem key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  );
};

const AgentProgressStepItem: React.FC<{ step: AgentProgressStep }> = ({ step }) => {
  return (
    <div className={`workflow-event-item ${step.type} ${step.status}`}>
      <div className="workflow-event-header">
        <span className="workflow-event-icon">
          {step.status === 'completed' && '✓'}
          {step.status === 'running' && <span className="workflow-event-spinner" />}
          {step.status === 'pending' && '?'}
          {step.status === 'failed' && '!'}
        </span>
        <span className="workflow-event-title">{step.title}</span>
      </div>

      {(step.detail || step.streamText || step.result !== undefined) && (
        <div className="workflow-event-details">
          {step.detail && <div className="workflow-event-message">{step.detail}</div>}
          {step.streamText && (
            <pre className="workflow-event-stream-text">
              {step.streamText}
              {step.status === 'running' && <span className="workflow-event-cursor">▍</span>}
            </pre>
          )}
          {step.result !== undefined && (
            <details className="workflow-event-result">
              <summary className="workflow-event-result-label">查看结果</summary>
              <pre className="workflow-event-result-value">
                {JSON.stringify(step.result, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};
