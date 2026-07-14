/**
 * WorkflowStepCard Component
 * 工作流步骤卡片组件
 *
 * 功能：
 * - 显示单个工作流步骤的详细信息
 * - 支持展开/折叠
 * - 显示步骤状态和进度
 * - 展示工具调用详情
 * - 优雅的动画效果
 */

import React from 'react';
import { CheckCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Wrench, Brain, FileText, HelpCircle } from 'lucide-react';
import type { ExecutionStep } from './WorkflowExecutionView';

interface WorkflowStepCardProps {
  step: ExecutionStep;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const WorkflowStepCard: React.FC<WorkflowStepCardProps> = ({
  step,
  index,
  isExpanded,
  onToggle
}) => {
  const getStepIcon = () => {
    switch (step.type) {
      case 'step':
        return <Brain size={20} />;
      case 'processing':
        return <Clock size={20} />;
      case 'tool_call':
        return <Wrench size={20} />;
      case 'analysis':
        return <FileText size={20} />;
      case 'info_needed':
        return <HelpCircle size={20} />;
      default:
        return <Brain size={20} />;
    }
  };

  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle size={20} className="status-icon-completed" />;
      case 'running':
        return <div className="status-icon-running" />;
      case 'failed':
        return <AlertCircle size={20} className="status-icon-failed" />;
      case 'pending':
        return <Clock size={20} className="status-icon-pending" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={`workflow-step-card ${step.status} ${step.type} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* 卡片头部 */}
      <div className="workflow-step-card-header" onClick={onToggle}>
        <div className="workflow-step-card-header-left">
          {/* 步骤序号 */}
          <div className="workflow-step-number">
            {index + 1}
          </div>

          {/* 步骤图标 */}
          <div className="workflow-step-icon">
            {getStepIcon()}
          </div>

          {/* 步骤信息 */}
          <div className="workflow-step-info">
            <div className="workflow-step-title">
              {step.title}
            </div>
            <div className="workflow-step-description">
              {step.description}
            </div>
          </div>
        </div>

        <div className="workflow-step-card-header-right">
          {/* 状态图标 */}
          <div className="workflow-step-status">
            {getStatusIcon()}
          </div>

          {/* 展开/折叠图标 */}
          <div className="workflow-step-toggle">
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
        </div>
      </div>

      {/* 进度条（如果有） */}
      {step.progress !== undefined && step.status === 'running' && (
        <div className="workflow-step-progress">
          <div
            className="workflow-step-progress-bar"
            style={{ width: `${step.progress}%` }}
          />
        </div>
      )}

      {/* 展开的详细内容 */}
      {isExpanded && (
        <div className="workflow-step-card-content">
          {/* 时间戳 */}
          <div className="workflow-step-meta">
            <span className="workflow-step-timestamp">
              {formatTimestamp(step.timestamp)}
            </span>
            <span className="workflow-step-status-label">
              {getStatusText(step.status)}
            </span>
          </div>

          {/* 详细信息列表 */}
          {step.details && step.details.length > 0 && (
            <div className="workflow-step-details">
              <div className="workflow-step-details-title">详细信息</div>
              <ul className="workflow-step-details-list">
                {step.details.map((detail: string, idx: number) => (
                  <li key={idx} className="workflow-step-detail-item">
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 工具调用详情 */}
          {step.type === 'tool_call' && step.parameters && (
            <div className="workflow-step-tool-details">
              <div className="workflow-step-tool-details-title">工具参数</div>
              <pre className="workflow-step-tool-params">
                {JSON.stringify(step.parameters, null, 2)}
              </pre>
              {step.result !== undefined && (
                <div className="workflow-step-tool-result">
                  <div className="workflow-step-tool-details-title">执行结果</div>
                  <pre className="workflow-step-tool-result-value">
                    {JSON.stringify(step.result, null, 2)}
                  </pre>
                </div>
              )}
              {step.error && (
                <div className="workflow-step-tool-error">
                  <div className="workflow-step-tool-details-title error">错误信息</div>
                  <div className="workflow-step-tool-error-message">
                    {step.error}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 思考过程（如果是分析步骤） */}
          {step.type === 'analysis' && step.details && (
            <div className="workflow-step-thinking">
              <div className="workflow-step-thinking-title">思考过程</div>
              <div className="workflow-step-thinking-content">
                {step.details.map((detail: string, idx: number) => (
                  <div key={idx} className="thinking-line">
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function getStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    'completed': '已完成',
    'running': '执行中',
    'failed': '失败',
    'pending': '等待中'
  };
  return statusTexts[status] || status;
}
