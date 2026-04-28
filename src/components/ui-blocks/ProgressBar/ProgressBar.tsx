/**
 * ProgressBar UI Block Component
 * 显示学习进度或任务完成度的进度条组件
 */

import React from 'react';
import type { ProgressBarProps } from '../../../types/uiBlocks';
import './ProgressBar.css';

interface ProgressBarComponentProps extends ProgressBarProps {
  title?: string; // 从 UIBlock 继承的标题
  meta?: {
    timestamp: number;
    confidence?: number;
    agent?: string;
  };
}

export const ProgressBar: React.FC<ProgressBarComponentProps> = ({
  label,
  progress,
  total,
  unit,
  color,
  showPercentage = true,
  title
}) => {
  // 确保 progress 在 0-100 范围内
  const clampedProgress = Math.max(0, Math.min(100, progress));

  // 根据进度选择颜色（如果未指定）
  const getProgressColor = (progress: number): string => {
    if (color) return color;
    if (progress >= 80) return '#22c55e'; // green
    if (progress >= 50) return '#3b82f6'; // blue
    if (progress >= 30) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const progressColor = getProgressColor(clampedProgress);

  return (
    <div className="progress-bar-container">
      {(title || label) && (
        <div className="progress-bar-header">
          {title && <h4 className="progress-bar-title">{title}</h4>}
          <div className="progress-bar-label-row">
            <span className="progress-bar-label">{label}</span>
            {showPercentage && (
              <span className="progress-bar-percentage">
                {clampedProgress.toFixed(1)}%
              </span>
            )}
            {total && unit && (
              <span className="progress-bar-total">
                {Math.round((clampedProgress / 100) * total)} / {total} {unit}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: progressColor
          }}
        >
          {clampedProgress > 5 && showPercentage && (
            <span className="progress-bar-text">{`${Math.round(clampedProgress)}%`}</span>
          )}
        </div>
      </div>
    </div>
  );
};
