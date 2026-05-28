/**
 * 学习空间卡片组件
 * 显示单个学习空间的详细信息
 */

import React from 'react';
import { ArrowRight, BookOpen, CalendarDays, CheckSquare, Clock3, Flame } from 'lucide-react';
import { useNavigate } from 'react-router';
import { CircularProgress } from '@/components/common';
import type { StudySpace } from '@/types/space';
import { useSpaceStore } from '@/store/spaceStore';
import {
  clampProgress,
  formatGoalDate,
  getSpaceAdvice,
  getTodayTaskLabel,
  getWorkspaceStatusConfig
} from '../workspaceDashboardUtils';
import './SpaceCard.css';

interface SpaceCardProps {
  space: StudySpace;
}

export const SpaceCard: React.FC<SpaceCardProps> = ({ space }) => {
  const navigate = useNavigate();
  const { switchSpace } = useSpaceStore();
  const statusConfig = getWorkspaceStatusConfig(space.status);
  const progress = clampProgress(space.stats.overallProgress);
  const advice = getSpaceAdvice(space);

  const handleCardClick = () => {
    switchSpace(space.id);
    navigate(`/workSpace/${space.id}`);
  };

  const formatUpdateTime = (time: Date | string | number) => {
    const timestamp = new Date(time).getTime();
    if (!Number.isFinite(timestamp)) return '最近';

    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return `${days} 天前`;
  };

  const totalStudyHours = space.stats.totalStudyHours > 0
    ? `${space.stats.totalStudyHours} 小时`
    : '待累计';

  return (
    <div
      className={`space-card ${statusConfig.className}`}
      style={{
        '--space-accent': statusConfig.color,
        '--space-border': statusConfig.border,
        '--space-soft': statusConfig.softBg,
        '--space-surface': statusConfig.surface,
        '--space-shadow': statusConfig.shadow
      } as React.CSSProperties}
      onClick={handleCardClick}
    >
      <div className="space-card-cover">
        <span className="space-card-status">{statusConfig.label}</span>
        <div className="space-card-cover-art">
          <BookOpen size={44} />
        </div>
      </div>

      <div className="space-card-content">
        <div className="space-card-header">
          <div className="space-card-title-group">
            <h3 className="space-card-title">{space.name}</h3>
            <div className="space-card-date">
              <CalendarDays size={15} />
              目标日期：{formatGoalDate(space.goal.examDate)}
            </div>
          </div>
          <CircularProgress
            value={progress}
            size={68}
            strokeWidth={8}
            color={statusConfig.color}
            trackColor="#e5e7eb"
          />
        </div>

        <p className="space-card-description">
          {space.description || space.goal.primaryGoal || '保持学习节奏，稳步推进当前目标。'}
        </p>

        <div className="space-card-progress">
          <div className="progress-label-row">
            <span>整体进度</span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="space-card-metrics">
          <MetricItem icon={<CheckSquare size={17} />} label="今日任务" value={getTodayTaskLabel(space)} />
          <MetricItem icon={<Flame size={17} />} label="连续学习" value={`${space.stats.consecutiveDays ?? 0} 天`} />
          <MetricItem icon={<Clock3 size={17} />} label="累计时长" value={totalStudyHours} />
        </div>

        <div className="space-card-tags">
          {space.subjects.slice(0, 2).map((subject) => (
            <span key={subject.name} className="tag">
              {subject.name}
            </span>
          ))}
          <span className="tag tag-ai">{advice.title}</span>
        </div>

        <div className="space-card-footer">
          <span>更新于 {formatUpdateTime(space.updatedAt)}</span>
          <button
            className="space-card-enter"
            onClick={(event) => {
              event.stopPropagation();
              handleCardClick();
            }}
          >
            进入空间
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ icon, label, value }) => (
  <div className="space-card-metric">
    <div className="space-card-metric-icon">{icon}</div>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  </div>
);
