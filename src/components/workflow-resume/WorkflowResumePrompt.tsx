/**
 * WorkflowResumePrompt Component
 * 工作流恢复提示组件
 *
 * 功能：
 * - 当工作流中断时显示恢复提示
 * - 提供"继续工作流"和"重新开始"按钮
 */

import React from 'react';
import { Play, RotateCcw, AlertTriangle } from 'lucide-react';
import './WorkflowResumePrompt.css';

interface WorkflowResumePromptProps {
  stepIndex: number;
  totalSteps: number;
  onResume: () => void;
  onRestart: () => void;
  onDismiss?: () => void;
}

export const WorkflowResumePrompt: React.FC<WorkflowResumePromptProps> = ({
  stepIndex,
  totalSteps,
  onResume,
  onRestart,
  onDismiss
}) => {
  return (
    <div className="workflow-resume-prompt">
      <div className="workflow-resume-prompt-content">
        <div className="workflow-resume-prompt-icon">
          <AlertTriangle size={24} />
        </div>
        <div className="workflow-resume-prompt-text">
          <h3 className="workflow-resume-prompt-title">
            检测到未完成的工作流
          </h3>
          <p className="workflow-resume-prompt-description">
            您之前在第 {stepIndex + 1} 步（共 {totalSteps} 步）中断了工作流
          </p>
        </div>
        <div className="workflow-resume-prompt-actions">
          <button
            className="workflow-resume-prompt-button workflow-resume-prompt-button-primary"
            onClick={onResume}
          >
            <Play size={16} />
            继续工作流
          </button>
          <button
            className="workflow-resume-prompt-button workflow-resume-prompt-button-secondary"
            onClick={onRestart}
          >
            <RotateCcw size={16} />
            重新开始
          </button>
          {onDismiss && (
            <button
              className="workflow-resume-prompt-button workflow-resume-prompt-button-dismiss"
              onClick={onDismiss}
              title="忽略"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
