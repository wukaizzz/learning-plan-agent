import React from 'react';
import { ArrowRight, CalendarDays, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router';
import { CircularProgress } from '@/components/common';
import type { StudySpace } from '@/types/space';
import {
  clampProgress,
  getExamCountdownLabel,
  getTodayTaskLabel,
  getWorkspaceStatusConfig,
  selectPrimaryStudySpace
} from './workspaceDashboardUtils';
import './HeroSprintSection.css';

interface HeroSprintSectionProps {
  spaces: StudySpace[];
  onCreateSpace: () => void;
}

export const HeroSprintSection: React.FC<HeroSprintSectionProps> = ({
  spaces,
  onCreateSpace
}) => {
  const navigate = useNavigate();
  const primarySpace = selectPrimaryStudySpace(spaces);

  if (!primarySpace) {
    return (
      <section className="hero-sprint hero-sprint-empty">
        <div className="hero-sprint-visual hero-sprint-visual-empty">
          <Rocket size={30} />
        </div>
        <div className="hero-sprint-copy">
          <h2>创建你的第一个学习冲刺</h2>
          <p>设置目标、科目和可用时间后，这里会显示当前最重要的学习目标。</p>
        </div>
        <button className="hero-sprint-action" onClick={onCreateSpace}>
          创建学习空间
          <ArrowRight size={18} />
        </button>
      </section>
    );
  }

  const statusConfig = getWorkspaceStatusConfig(primarySpace.status);
  const progress = clampProgress(primarySpace.stats.overallProgress);
  const taskLabel = getTodayTaskLabel(primarySpace);

  return (
    <section
      className="hero-sprint"
      style={{
        borderColor: statusConfig.border,
        boxShadow: `0 18px 44px ${statusConfig.shadow}`
      }}
    >
      <div className="hero-sprint-visual" style={{ background: statusConfig.softBg }}>
        <CircularProgress
          value={progress}
          size={80}
          strokeWidth={9}
          color={statusConfig.color}
          trackColor="#e5e7eb"
          label={<Rocket size={26} color={statusConfig.color} />}
        />
      </div>

      <div className="hero-sprint-copy">
        <div className="hero-sprint-eyebrow" style={{ color: statusConfig.textColor }}>
          <CalendarDays size={15} />
          {getExamCountdownLabel(primarySpace.goal.examDate)}
        </div>
        <h2>继续冲刺：{primarySpace.name}</h2>
        <p>{primarySpace.goal.primaryGoal || '保持每天的学习节奏，稳步推进当前计划。'}</p>
      </div>

      <div className="hero-sprint-progress">
        <div className="hero-progress-label">
          <span>整体进度</span>
          <strong>{progress}%</strong>
        </div>
        <div className="hero-progress-track">
          <div
            className="hero-progress-fill"
            style={{
              width: `${progress}%`,
              backgroundColor: statusConfig.color
            }}
          />
        </div>
        <div className="hero-task-label">{taskLabel}</div>
      </div>

      <button
        className="hero-sprint-action"
        onClick={() => navigate(`/workSpace/${primarySpace.id}`)}
        style={{ background: statusConfig.color }}
      >
        继续学习
        <ArrowRight size={18} />
      </button>
    </section>
  );
};
