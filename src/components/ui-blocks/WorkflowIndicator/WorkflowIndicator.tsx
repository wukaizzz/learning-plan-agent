/**
 * WorkflowIndicator UI Block Component
 * 显示工作流当前阶段和进度的可视化指示器
 *
 * 功能：
 * - 水平步骤条显示各个阶段
 * - 当前阶段高亮显示
 * - 已完成的阶段显示完成图标
 * - 支持动画过渡效果
 * - 响应式布局
 */

import React from 'react';
import type { WorkflowIndicatorProps } from '../../../types/uiBlocks';

interface WorkflowIndicatorComponentProps extends WorkflowIndicatorProps {
  title?: string;
  meta?: {
    timestamp: number;
    confidence?: number;
    agent?: string;
  };
}

export const WorkflowIndicator: React.FC<WorkflowIndicatorComponentProps> = ({
  currentState,
  currentStep,
  steps,
  title
}) => {
  // 获取步骤状态
  const getStepStatus = (index: number, currentStateIndex: number) => {
    if (index < currentStateIndex) return 'completed';
    if (index === currentStateIndex) return 'current';
    return 'pending';
  };

  // 找到当前状态在步骤列表中的索引
  const getCurrentStateIndex = () => {
    return steps.findIndex(step => step.state === currentState);
  };

  const currentStateIndex = getCurrentStateIndex();

  return (
    <div className="workflow-indicator-container">
      {title && <h4 className="workflow-indicator-title">{title}</h4>}

      <div className="workflow-indicator-content">
        {/* 水平步骤条 */}
        <div className="workflow-steps-horizontal">
          {steps.map((step, index) => {
            const status = getStepStatus(index, currentStateIndex);
            const isCurrentStep = status === 'current';

            return (
              <div key={step.state} className={`workflow-step workflow-step-${status}`}>
                {/* 步骤圆圈 */}
                <div className="workflow-step-circle">
                  {status === 'completed' ? (
                    <span className="workflow-step-icon completed">✓</span>
                  ) : status === 'current' ? (
                    <span className="workflow-step-icon current">
                      {step.icon || '●'}
                    </span>
                  ) : (
                    <span className="workflow-step-icon pending">○</span>
                  )}
                </div>

                {/* 步骤标签 */}
                <div className="workflow-step-label">
                  <span className="workflow-step-label-text">{step.label}</span>
                  {isCurrentStep && currentStep && (
                    <span className="workflow-step-current-action">{currentStep}</span>
                  )}
                </div>

                {/* 连接线（除了最后一个步骤） */}
                {index < steps.length - 1 && (
                  <div className={`workflow-step-line ${status === 'completed' ? 'completed' : ''}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* 当前状态描述 */}
        {currentStep && (
          <div className="workflow-current-state">
            <span className="workflow-current-state-label">当前状态:</span>
            <span className="workflow-current-state-value">{currentStep}</span>
          </div>
        )}
      </div>
    </div>
  );
};
