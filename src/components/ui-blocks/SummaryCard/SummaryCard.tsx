/**
 * SummaryCard UI Block
 * 显示学习空间概况信息
 */

import React from 'react';
import type { SummaryCardProps } from '@/types/uiBlocks';
import './SummaryCard.css';

interface SummaryCardComponentProps extends SummaryCardProps {
  title?: string;
}

export const SummaryCard: React.FC<SummaryCardComponentProps> = ({
  title = '学习概况',
  spaceName,
  spaceDescription,
  primaryGoal,
  targetScore,
  currentScore,
  examDate,
  daysRemaining,
  overallProgress,
  subjects
}) => {
  // 计算进度条颜色
  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return '#10b981'; // green
    if (progress >= 50) return '#3b82f6'; // blue
    if (progress >= 30) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  // 计算剩余天数的状态
  const getDaysStatus = (days: number): { text: string; color: string } => {
    if (days <= 7) return { text: '紧急', color: '#ef4444' };
    if (days <= 30) return { text: '紧张', color: '#f59e0b' };
    return { text: '充裕', color: '#10b981' };
  };

  const daysStatus = getDaysStatus(daysRemaining);

  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <h3 className="summary-card-title">{title}</h3>
        <div className="summary-card-subtitle">{spaceName}</div>
        {spaceDescription && (
          <p className="summary-card-description">{spaceDescription}</p>
        )}
      </div>

      <div className="summary-card-content">
        {/* 主要目标 */}
        <div className="summary-item summary-item-goal">
          <div className="summary-item-label">🎯 学习目标</div>
          <div className="summary-item-value">{primaryGoal}</div>
        </div>

        {/* 目标分数 */}
        <div className="summary-row">
          <div className="summary-item summary-item-score">
            <div className="summary-item-label">📊 目标分数</div>
            <div className="summary-item-value">
              <span className="score-current">{currentScore || '--'}</span>
              <span className="score-separator">→</span>
              <span className="score-target">{targetScore}</span>
            </div>
          </div>

          {/* 考试日期 */}
          <div className="summary-item summary-item-date">
            <div className="summary-item-label">📅 考试日期</div>
            <div className="summary-item-value">
              {examDate || '未设置'}
            </div>
          </div>
        </div>

        {/* 剩余天数 */}
        <div className="summary-item summary-item-days">
          <div className="summary-item-label">⏰ 距离考试</div>
          <div className="summary-item-value">
            <span className="days-number">{daysRemaining}</span>
            <span className="days-unit">天</span>
            <span
              className="days-status"
              style={{ backgroundColor: daysStatus.color }}
            >
              {daysStatus.text}
            </span>
          </div>
        </div>

        {/* 整体进度 */}
        <div className="summary-item summary-item-progress">
          <div className="summary-item-label">
            <span>整体进度</span>
            <span className="progress-percentage">{overallProgress}%</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{
                width: `${overallProgress}%`,
                backgroundColor: getProgressColor(overallProgress)
              }}
            />
          </div>
        </div>

        {/* 各科目进度 */}
        {subjects && subjects.length > 0 && (
          <div className="summary-item summary-item-subjects">
            <div className="summary-item-label">📚 各科进度</div>
            <div className="subjects-list">
              {subjects.map((subject, index) => (
                <div key={index} className="subject-item">
                  <div className="subject-info">
                    <span className="subject-name">{subject.name}</span>
                    <span className="subject-progress-text">
                      {subject.progress}%
                    </span>
                  </div>
                  <div className="subject-progress-bar">
                    <div
                      className="subject-progress-fill"
                      style={{
                        width: `${subject.progress}%`,
                        backgroundColor: getProgressColor(subject.progress)
                      }}
                    />
                  </div>
                  <div className="subject-target">
                    目标: {subject.targetLevel}分
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
