/**
 * ToolCallStatus UI Block Component
 * 显示 Agent 工具调用状态和进度
 */

import React from 'react';
import type { ToolCallStatusProps } from '../../../types/uiBlocks';
import './ToolCallStatus.css';

interface ToolCallStatusComponentProps extends ToolCallStatusProps {
  title?: string;
  meta?: {
    timestamp: number;
    confidence?: number;
    agent?: string;
  };
}

type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

export const ToolCallStatus: React.FC<ToolCallStatusComponentProps> = ({
  currentStep,
  steps,
  title
}) => {
  const getStatusIcon = (status: StepStatus): string => {
    switch (status) {
      case 'pending':
        return '○'; // 空心圆
      case 'running':
        return '⟳'; // 旋转符号
      case 'completed':
        return '✓'; // 对勾
      case 'failed':
        return '✗'; // 叉号
      default:
        return '○';
    }
  };

  const getStatusClass = (status: StepStatus): string => {
    return `step-status-${status}`;
  };

  return (
    <div className="tool-call-status-container">
      {title && <h4 className="tool-call-status-title">{title}</h4>}

      <div className="tool-call-status-content">
        {currentStep && (
          <div className="current-step-indicator">
            <span className="current-step-label">当前步骤:</span>
            <span className="current-step-name">{currentStep}</span>
          </div>
        )}

        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className={`step-item ${getStatusClass(step.status)}`}>
              <div className="step-icon">
                {getStatusIcon(step.status)}
              </div>

              <div className="step-content">
                <div className="step-header">
                  <span className="step-name">{step.name}</span>
                  {step.status === 'running' && (
                    <span className="step-running-indicator">执行中...</span>
                  )}
                </div>

                {step.message && (
                  <div className="step-message">{step.message}</div>
                )}

                {step.result != null && (
                  <div className="step-result">
                    <details>
                      <summary className="result-summary">查看结果</summary>
                                                      <pre className="result-content">
          {JSON.stringify(step.result, null, 2)}
        </pre>
                                                    </details>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
