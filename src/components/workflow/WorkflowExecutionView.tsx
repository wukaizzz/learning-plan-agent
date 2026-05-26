/**
 * WorkflowExecutionView Component
 * Claude 风格的逐步执行流式工作流视图
 *
 * 功能：
 * - 实时显示工作流执行步骤
 * - 展示每个步骤的详细信息和思考过程
 * - 支持步骤展开/折叠
 * - 显示整体进度和动画效果
 * - 优雅的视觉反馈
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WorkflowStepCard } from './WorkflowStepCard';
import { WorkflowProgressBar } from './WorkflowProgressBar';
import type { WorkflowEvent, ToolCallEvent, AnalysisResultEvent } from '@/types/workflowEvents';
import './WorkflowExecutionView.css';

interface WorkflowExecutionViewProps {
  events: WorkflowEvent[];
  currentStep: string;
  totalSteps: number;
  isStreaming?: boolean;
  onComplete?: () => void;
}

export interface ExecutionStep {
  id: string;
  type: 'step' | 'processing' | 'tool_call' | 'analysis' | 'info_needed';
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: number;
  details?: string[];
  progress?: number;
  toolName?: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

export const WorkflowExecutionView: React.FC<WorkflowExecutionViewProps> = ({
  events,
  currentStep,
  totalSteps,
  isStreaming = false,
  onComplete
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const [now] = useState(() => Date.now());

  // Derive steps from events
  const steps = useMemo(() => {
    const newSteps: ExecutionStep[] = [];

    events.forEach((event, index) => {
      const baseStep: Partial<ExecutionStep> = {
        id: `step-${index}`,
        timestamp: now
      };

      switch (event.type) {
        case 'workflow_step':
          newSteps.push({
            ...baseStep,
            type: 'step',
            title: getStepTitle(event.step),
            description: event.message,
            status: getStepStatus(event.step, currentStep),
            progress: event.progress
          } as ExecutionStep);
          break;

        case 'processing':
          newSteps.push({
            ...baseStep,
            type: 'processing',
            title: event.stage,
            description: event.details || '正在处理...',
            status: 'running',
            progress: event.progress
          } as ExecutionStep);
          break;

        case 'tool_call': {
          const toolEvent = event as ToolCallEvent;
          newSteps.push({
            ...baseStep,
            type: 'tool_call',
            title: `调用工具: ${toolEvent.toolName}`,
            description: getToolDescription(toolEvent),
            status: toolEvent.status === 'pending' ? 'pending' :
                     toolEvent.status === 'executing' ? 'running' :
                     toolEvent.status === 'completed' ? 'completed' : 'failed',
            toolName: toolEvent.toolName,
            parameters: toolEvent.parameters,
            result: toolEvent.result,
            error: toolEvent.error
          } as ExecutionStep);
          break;
        }

        case 'analysis_result': {
          const analysisEvent = event as AnalysisResultEvent;
          newSteps.push({
            ...baseStep,
            type: 'analysis',
            title: '分析结果',
            description: analysisEvent.summary,
            status: 'completed',
            details: [
              ...analysisEvent.findings.map(f => `• ${f}`),
              ...(analysisEvent.recommendations || []).map(r => `建议: ${r}`)
            ]
          } as ExecutionStep);
          break;
        }

        case 'info_needed':
          newSteps.push({
            ...baseStep,
            type: 'info_needed',
            title: '需要补充信息',
            description: event.question,
            status: 'pending',
            details: [`字段: ${event.fieldName}`, `类型: ${event.fieldType}`, `必填: ${event.required ? '是' : '否'}`]
          } as ExecutionStep);
          break;
      }
    });

    return newSteps;
  }, [events, currentStep, now]);

  // Derive progress from steps
  const overallProgress = useMemo(() => {
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  }, [steps, totalSteps]);

  // Auto-expand running steps
  useEffect(() => {
    const runningStepId = steps.find(s => s.status === 'running')?.id;
    if (runningStepId) {
      setExpandedSteps(prev => new Set([...prev, runningStepId])); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [steps]);

  // Check completion
  useEffect(() => {
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    if (!isStreaming && completedSteps === steps.length && steps.length > 0) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [steps, isStreaming, onComplete]);

  // 自动滚动到最新步骤
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [steps]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedSteps(new Set(steps.map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="workflow-execution-view" ref={containerRef}>
      {/* 头部区域 */}
      <div className="workflow-execution-header">
        <div className="workflow-execution-header-left">
          <div className={`workflow-execution-status ${isStreaming ? 'running' : 'completed'}`}>
            <div className="status-indicator" />
            <span className="status-text">
              {isStreaming ? '正在执行工作流' : '工作流执行完成'}
            </span>
          </div>
          <div className="workflow-execution-stats">
            <span className="stat-item">
              {steps.filter(s => s.status === 'completed').length} / {totalSteps} 步骤完成
            </span>
          </div>
        </div>
        <div className="workflow-execution-actions">
          <button
            className="workflow-execution-action-btn"
            onClick={expandAll}
            title="展开所有"
          >
            展开全部
          </button>
          <button
            className="workflow-execution-action-btn"
            onClick={collapseAll}
            title="折叠所有"
          >
            折叠全部
          </button>
        </div>
      </div>

      {/* 进度条 */}
      <WorkflowProgressBar
        progress={overallProgress}
        steps={steps}
        currentStep={currentStep}
      />

      {/* 步骤列表 */}
      <div className="workflow-execution-steps">
        {steps.map((step, index) => (
          <WorkflowStepCard
            key={step.id}
            step={step}
            index={index}
            isExpanded={expandedSteps.has(step.id)}
            onToggle={() => toggleStep(step.id)}
          />
        ))}
      </div>

      {/* 流式输出指示器 */}
      {isStreaming && (
        <div className="workflow-execution-streaming">
          <div className="streaming-dots">
            <div className="streaming-dot" style={{ animationDelay: '0ms' }} />
            <div className="streaming-dot" style={{ animationDelay: '150ms' }} />
            <div className="streaming-dot" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="streaming-text">正在处理...</span>
        </div>
      )}
    </div>
  );
};

function getStepTitle(step: string): string {
  const titles: Record<string, string> = {
    'collecting': '收集信息',
    'analyzing': '分析数据',
    'generating': '生成计划',
    'reviewing': '审核计划',
    'finalized': '完成',
    'paused': '已暂停'
  };
  return titles[step] || step;
}

function getStepStatus(step: string, currentStep: string): 'pending' | 'running' | 'completed' | 'failed' {
  const stepOrder = ['collecting', 'analyzing', 'generating', 'reviewing', 'finalized', 'paused'];
  const currentIndex = stepOrder.indexOf(currentStep);
  const stepIndex = stepOrder.indexOf(step);

  if (stepIndex < currentIndex) {
    return 'completed';
  } else if (stepIndex === currentIndex) {
    return 'running';
  } else {
    return 'pending';
  }
}

function getToolDescription(event: ToolCallEvent): string {
  if (event.status === 'pending') {
    return '准备执行工具调用...';
  } else if (event.status === 'executing') {
    return '正在执行工具...';
  } else if (event.status === 'completed') {
    return event.result ? `执行成功: ${JSON.stringify(event.result)}` : '执行完成';
  } else {
    return event.error ? `执行失败: ${event.error}` : '执行失败';
  }
}

// 🆕 导出 ExecutionStep 接口（已在上面定义）


