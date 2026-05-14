/**
 * WorkflowEvents Component
 * 消息内联的工作流事件展示组件
 *
 * 功能：
 * - 在消息内容上方显示工作流事件
 * - 简化的卡片样式
 * - 支持展开/折叠
 */

import React, { useState, useEffect } from 'react';
import type { WorkflowEvent, WorkflowStepEvent, 
  ToolCallEvent, ProcessingEvent, 
  AnalysisResultEvent, InfoNeededEvent } from '@/types/workflowEvents';
import './WorkflowEvents.css';

interface WorkflowEventsProps {
  events: WorkflowEvent[];
  isStreaming?: boolean;
}

export const WorkflowEvents: React.FC<WorkflowEventsProps> = ({
  events,
  isStreaming = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // 🆕 流式传输时自动展开
  useEffect(() => {
    if (isStreaming && events.length > 0) {
      setIsExpanded(true);
    }
  }, [isStreaming, events.length]);

  // 🆕 自动展开最新的步骤
  useEffect(() => {
    if (events.length > 0) {
      const lastStepIndex = events.length - 1;
      setExpandedSteps(prev => new Set([...prev, `event-${lastStepIndex}`]));
    }
  }, [events.length]);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className={`workflow-events ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div
        className="workflow-events-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="workflow-events-title">
          <span className="workflow-events-icon">💭</span>
          思考过程
          <span className="workflow-events-count">
            {events.length} 个步骤
          </span>
        </span>
        <span className={`workflow-events-toggle ${isExpanded ? 'open' : 'closed'}`}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div className="workflow-events-content">
          {events.map((event, index) => (
            <WorkflowEventItem
              key={`event-${index}`}
              event={event}
              isExpanded={expandedSteps.has(`event-${index}`)}
              onToggle={() => {
                setExpandedSteps(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(`event-${index}`)) {
                    newSet.delete(`event-${index}`);
                  } else {
                    newSet.add(`event-${index}`);
                  }
                  return newSet;
                });
              }}
            />
          ))}

          {isStreaming && (
            <div className="workflow-events-streaming">
              <span className="streaming-dot" />
              <span className="streaming-dot" />
              <span className="streaming-dot" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface WorkflowEventItemProps {
  event: WorkflowEvent;
  isExpanded: boolean;
  onToggle: () => void;
}

const WorkflowEventItem: React.FC<WorkflowEventItemProps> = ({
  event,
  isExpanded,
  onToggle
}) => {
  const getEventIcon = () => {
    switch (event.type) {
      case 'workflow_step': return '🔄';
      case 'tool_call': return '🔧';
      case 'processing': return '⚙️';
      case 'analysis_result': return '📊';
      case 'info_needed': return '❓';
      default: return '📝';
    }
  };

  const getEventTitle = () => {
    switch (event.type) {
      case 'workflow_step': return (event as WorkflowStepEvent).step || '工作流步骤';
      case 'tool_call': return `工具调用: ${(event as ToolCallEvent).toolName}`;
      case 'processing': return (event as ProcessingEvent).stage || '处理中';
      case 'analysis_result': return (event as AnalysisResultEvent).summary || '分析结果';
      case 'info_needed': return `需要信息: ${(event as InfoNeededEvent).fieldName}`;
      default: return '未知事件';
    }
  };

  return (
    <div
      className={`workflow-event-item ${event.type} ${isExpanded ? 'expanded' : 'collapsed'}`}
      onClick={onToggle}
    >
      <div className="workflow-event-header">
        <span className="workflow-event-icon">{getEventIcon()}</span>
        <span className="workflow-event-title">{getEventTitle()}</span>
        <span className="workflow-event-toggle">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div className="workflow-event-details">
          {event.type === 'workflow_step' && renderWorkflowStep(event as WorkflowStepEvent)}
          {event.type === 'tool_call' && renderToolCall(event as ToolCallEvent)}
          {event.type === 'processing' && renderProcessing(event as ProcessingEvent)}
          {event.type === 'analysis_result' && renderAnalysisResult(event as AnalysisResultEvent)}
          {event.type === 'info_needed' && renderInfoNeeded(event as InfoNeededEvent)}
          {event.type === 'content' && <div className="workflow-event-message">{(event as any).content}</div>}
          {event.type === 'done' && <div className="workflow-event-message">完成</div>}
          {event.type === 'error' && <div className="workflow-event-message error">错误: {(event as any).error}</div>}
        </div>
      )}
    </div>
  );
};

function renderWorkflowStep(event: WorkflowStepEvent) {
  return (
    <>
      <div className="workflow-event-message">{event.message}</div>
      {event.progress !== undefined && (
        <div className="workflow-event-progress">
          <div
            className="workflow-event-progress-bar"
            style={{ width: `${event.progress}%` }}
          />
          <span className="workflow-event-progress-text">{event.progress}%</span>
        </div>
      )}
    </>
  );
}

function renderToolCall(event: ToolCallEvent) {
  return (
    <>
      <div className="workflow-event-status">状态: {event.status}</div>
      {event.parameters && (
        <pre className="workflow-event-params">
          {JSON.stringify(event.parameters, null, 2)}
        </pre>
      )}
      {event.result && (
        <div className="workflow-event-result">
          <div className="workflow-event-result-label">结果:</div>
          <pre className="workflow-event-result-value">
            {JSON.stringify(event.result, null, 2)}
          </pre>
        </div>
      )}
      {event.error && (
        <div className="workflow-event-error">
          <div className="workflow-event-error-label">错误:</div>
          <div className="workflow-event-error-message">{event.error}</div>
        </div>
      )}
    </>
  );
}

function renderProcessing(event: ProcessingEvent) {
  return (
    <>
      <div className="workflow-event-stage">{event.stage}</div>
      {event.details && (
        <div className="workflow-event-details-text">{event.details}</div>
      )}
      {event.progress !== undefined && (
        <div className="workflow-event-progress">
          <div
            className="workflow-event-progress-bar"
            style={{ width: `${event.progress}%` }}
          />
          <span className="workflow-event-progress-text">{event.progress}%</span>
        </div>
      )}
    </>
  );
}

function renderAnalysisResult(event: AnalysisResultEvent) {
  return (
    <>
      <div className="workflow-event-summary">{event.summary}</div>
      {event.findings && event.findings.length > 0 && (
        <div className="workflow-event-findings">
          <div className="workflow-event-findings-label">发现:</div>
          <ul>
            {event.findings.map((finding, idx) => (
              <li key={idx}>{finding}</li>
            ))}
          </ul>
        </div>
      )}
      {event.recommendations && event.recommendations.length > 0 && (
        <div className="workflow-event-recommendations">
          <div className="workflow-event-recommendations-label">建议:</div>
          <ul>
            {event.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function renderInfoNeeded(event: InfoNeededEvent) {
  return (
    <>
      <div className="workflow-event-question">{event.question}</div>
      <div className="workflow-event-field">
        <div className="workflow-event-field-label">字段:</div>
        <div className="workflow-event-field-name">{event.fieldName}</div>
      </div>
      <div className="workflow-event-field">
        <div className="workflow-event-field-label">类型:</div>
        <div className="workflow-event-field-type">{event.fieldType}</div>
      </div>
      {event.options && event.options.length > 0 && (
        <div className="workflow-event-options">
          <div className="workflow-event-options-label">选项:</div>
          <ul>
            {event.options.map((option, idx) => (
              <li key={idx}>{option}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
