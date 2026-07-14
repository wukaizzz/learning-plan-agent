/**
 * WorkflowProgressBar Component
 * 工作流进度条组件
 *
 * 功能：
 * - 显示整体工作流进度
 * - 显示各个步骤的状态
 * - 支持点击跳转到指定步骤
 * - 优雅的动画效果
 */

import React from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import type { ExecutionStep } from './WorkflowExecutionView';

interface WorkflowProgressBarProps {
  progress: number;
  steps: ExecutionStep[];
  currentStep: string;
}

export const WorkflowProgressBar: React.FC<WorkflowProgressBarProps> = ({
  progress,
  steps,
  currentStep
}) => {
  const stepOrder = ['collecting', 'analyzing', 'generating', 'reviewing', 'finalized', 'paused'];
  const currentStepIndex = stepOrder.indexOf(currentStep);

  const getStepStatus = (step: ExecutionStep): 'completed' | 'running' | 'pending' => {
    if (step.status === 'completed') return 'completed';
    if (step.status === 'running') return 'running';
    return 'pending';
  };

  const getStepIcon = (status: 'completed' | 'running' | 'pending') => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="step-icon-completed" />;
      case 'running':
        return <Loader2 size={16} className="step-icon-running" />;
      case 'pending':
        return <Circle size={16} className="step-icon-pending" />;
    }
  };

  // 获取主要步骤（类型为 'step' 的）
  const mainSteps = steps.filter(s => s.type === 'step');

  return (
    <div className="workflow-progress-bar-container">
      {/* 整体进度条 */}
      <div className="workflow-progress-bar-wrapper">
        <div className="workflow-progress-bar">
          <div
            className="workflow-progress-bar-fill"
            style={{ width: `${progress}%` }}
          >
            <div className="workflow-progress-bar-shine" />
          </div>
        </div>
        <div className="workflow-progress-text">
          {Math.round(progress)}% 完成
        </div>
      </div>

      {/* 步骤指示器 */}
      {mainSteps.length > 1 && (
        <div className="workflow-progress-steps">
          {mainSteps.map((step, index) => {
            const status = getStepStatus(step);
            const isActive = index === currentStepIndex;

            return (
              <div
                key={step.id}
                className={`workflow-progress-step ${status} ${isActive ? 'active' : ''}`}
              >
                <div className="workflow-progress-step-icon">
                  {getStepIcon(status)}
                </div>
                <div className="workflow-progress-step-label">
                  {step.title}
                </div>
                {isActive && (
                  <div className="workflow-progress-step-indicator" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 步骤连接线 */}
      {mainSteps.length > 1 && (
        <div className="workflow-progress-connector">
          {mainSteps.slice(0, -1).map((_, index) => (
            <div
              key={index}
              className={`workflow-progress-connector-line ${index < currentStepIndex ? 'completed' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
