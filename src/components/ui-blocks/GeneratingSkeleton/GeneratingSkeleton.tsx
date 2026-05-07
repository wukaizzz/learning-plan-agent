/**
 * GeneratingSkeleton UI Block
 * 显示生成中的骨架屏加载动画
 */

import React, { useEffect, useState } from 'react';
import type { GeneratingSkeletonProps } from '@/types/uiBlocks';
import './GeneratingSkeleton.css';

interface GeneratingSkeletonComponentProps extends GeneratingSkeletonProps {
  title?: string;
}

export const GeneratingSkeleton: React.FC<GeneratingSkeletonComponentProps> = ({
  title = '生成中',
  message,
  progress,
  steps
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // 动画进度条
  useEffect(() => {
    if (progress !== undefined) {
      const duration = 500;
      const stepTime = 20;
      const steps = duration / stepTime;
      const increment = (progress - animatedProgress) / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += 1;
        const newProgress = animatedProgress + increment * current;
        if (current >= steps || newProgress >= progress) {
          setAnimatedProgress(progress);
          clearInterval(timer);
        } else {
          setAnimatedProgress(newProgress);
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [progress]);

  // 获取步骤状态样式
  const getStepStatusClass = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: 'step-pending',
      running: 'step-running',
      completed: 'step-completed'
    };
    return statusMap[status] || 'step-pending';
  };

  // 获取步骤图标
  const getStepIcon = (status: string): string => {
    const iconMap: Record<string, string> = {
      pending: '○',
      running: '◐',
      completed: '●'
    };
    return iconMap[status] || '○';
  };

  return (
    <div className="generating-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-spinner">
          <div className="spinner-ring" />
        </div>
        <div className="skeleton-header-content">
          <h3 className="skeleton-title">{title}</h3>
          <p className="skeleton-message">{message}</p>
        </div>
      </div>

      {/* 进度条 */}
      {progress !== undefined && (
        <div className="skeleton-progress-section">
          <div className="skeleton-progress-bar">
            <div
              className="skeleton-progress-fill"
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
          <div className="skeleton-progress-text">
            {Math.round(animatedProgress)}%
          </div>
        </div>
      )}

      {/* 步骤列表 */}
      {steps && steps.length > 0 && (
        <div className="skeleton-steps">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`skeleton-step ${getStepStatusClass(step.status)}`}
            >
              <div className="skeleton-step-icon">{getStepIcon(step.status)}</div>
              <div className="skeleton-step-content">
                <div className="skeleton-step-name">{step.name}</div>
                {step.status === 'running' && (
                  <div className="skeleton-step-dots">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 装饰性骨架屏 */}
      <div className="skeleton-decorations">
        <div className="skeleton-line skeleton-line-long" />
        <div className="skeleton-line skeleton-line-medium" />
        <div className="skeleton-line skeleton-line-short" />
      </div>
    </div>
  );
};

export default GeneratingSkeleton;
