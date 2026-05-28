import React from 'react';
import { CalendarCheck, Sparkles, Target, TrendingUp } from 'lucide-react';
import type { StudySpace } from '@/types/space';
import {
  clampProgress,
  getExamCountdownLabel,
  getSpaceAdvice,
  getTodayTaskLabel,
  getWeakPoints,
  selectPrimaryStudySpace
} from './workspaceDashboardUtils';
import './AIAdviceSection.css';

interface AIAdviceSectionProps {
  spaces: StudySpace[];
}

export const AIAdviceSection: React.FC<AIAdviceSectionProps> = ({ spaces }) => {
  const primarySpace = selectPrimaryStudySpace(spaces);
  const advice = getSpaceAdvice(primarySpace);

  if (!primarySpace) {
    return (
      <aside className="ai-advice-section">
        <div className="ai-advice-header">
          <div>
            <span className="ai-advice-kicker">AI 学习建议</span>
            <h3>先创建学习空间</h3>
          </div>
          <Sparkles size={22} />
        </div>
        <div className="ai-advice-list">
          <AdviceItem
            icon={<Target size={20} />}
            title="完善学习目标"
            description="创建空间后，建议会根据目标日期、科目和进度自动生成。"
          />
        </div>
      </aside>
    );
  }

  const progress = clampProgress(primarySpace.stats.overallProgress);
  const weakPoints = getWeakPoints(primarySpace);

  return (
    <aside className="ai-advice-section">
      <div className="ai-advice-header">
        <div>
          <span className="ai-advice-kicker">AI 学习建议</span>
          <h3>{primarySpace.name}</h3>
        </div>
        <Sparkles size={22} />
      </div>

      <div className="ai-advice-list">
        <AdviceItem
          icon={<TrendingUp size={20} />}
          title="最近学习趋势"
          description={`整体进度 ${progress}%，${getTodayTaskLabel(primarySpace)}。`}
        />
        <AdviceItem
          icon={<Target size={20} />}
          title={weakPoints.length > 0 ? `薄弱项：${weakPoints.join('、')}` : advice.title}
          description={weakPoints.length > 0 ? '建议优先安排到最近两天的复习任务中。' : advice.description}
        />
        <AdviceItem
          icon={<CalendarCheck size={20} />}
          title="AI 推荐"
          description={`${getExamCountdownLabel(primarySpace.goal.examDate)}，建议保持稳定复盘节奏。`}
        />
      </div>
    </aside>
  );
};

interface AdviceItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const AdviceItem: React.FC<AdviceItemProps> = ({ icon, title, description }) => (
  <div className="ai-advice-item">
    <div className="ai-advice-item-icon">{icon}</div>
    <div>
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  </div>
);
