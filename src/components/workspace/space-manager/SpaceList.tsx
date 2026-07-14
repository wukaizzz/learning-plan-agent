/**
 * 学习计划概览组件
 * 展示当前学习空间的核心信息和统计数据
 */

import React from 'react';
import { useSpaceStore } from '@/store';
import './SpaceList.css';

// 图标组件
const TargetIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" stroke="#8B5CF6" strokeWidth="2" fill="none"/>
    <circle cx="10" cy="10" r="3" fill="#8B5CF6"/>
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#3B82F6" strokeWidth="2" fill="none"/>
    <path d="M12 6V12L16 14" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CalendarIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#8B5CF6" strokeWidth="2" fill="none"/>
    <path d="M16 2V6M8 2V6M3 10H21" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const FlagIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 15C4 15 6 5 8 5C12 5 14 7 14 7C14 7 14 3 20 3V21H4V15Z" stroke="#F59E0B" strokeWidth="2" fill="none"/>
  </svg>
);

const ArrowUpIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 19V5M5 12L12 5L19 12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TaskIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 11L12 14L22 4M22 4H18M22 4V8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 12V20C22 20.9 21.1 20 20 20H4C2.9 20 2 20.9 2 22V4C2 2.9 2.9 2 4 2H12" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const InfoIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="7" stroke="#9CA3AF" strokeWidth="1.5" fill="none"/>
    <path d="M8 5V8M8 11H8.1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ArrowRightIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 10H16M16 10L12 6M16 10L12 14" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SpaceList: React.FC = () => {
  const {
    getCurrentSpace
  } = useSpaceStore();

  const currentSpace = getCurrentSpace();

  // 如果没有学习空间，显示创建提示
  if (!currentSpace) {
    return (
      <div className="space-overview-card">
        <div className="overview-empty-state">
          <div className="empty-icon">📚</div>
          <h3>还没有学习空间</h3>
          <p>创建你的第一个学习目标吧！</p>
          <button className="btn-create-first-space">
            + 创建学习空间
          </button>
        </div>
      </div>
    );
  }

  // 计算距离考试的天数
  const getDaysUntilExam = () => {
    if (!currentSpace?.goal.examDate) return 0;
    const now = new Date();
    const examTime = new Date(currentSpace.goal.examDate).getTime();
    const diff = examTime - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysUntilExam = getDaysUntilExam();
  const examDate = currentSpace?.goal.examDate
    ? new Date(currentSpace.goal.examDate).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    : '';

  // 获取每日可投入时间
  const dailyHours = currentSpace?.schedule?.availableHoursPerDay || 2;
  const dailyMinutes = Math.round(dailyHours * 60);

  // 获取优先科目（薄弱科目）
  const weakSubjects = currentSpace?.subjects
    ?.filter(subject => subject.weakPoints && subject.weakPoints.length > 0)
    .slice(0, 3) || [];

  // 获取所有薄弱点
  const allWeakPoints = currentSpace?.subjects
    ?.flatMap(subject => subject.weakPoints || [])
    .slice(0, 4) || [];

  return (
    <div className="space-overview-card">
      {/* 1. 整体容器 - 白色圆角卡片 */}
      <div className="overview-container">

        {/* 2. 顶部标题栏 */}
        <div className="overview-header">
          <div className="header-left">
            <div className="header-icon-wrapper">
              <TargetIcon />
            </div>
            <div className="header-titles">
              <h1 className="header-title">学习计划概览</h1>
              <p className="header-subtitle">你的学习计划执行情况</p>
            </div>
          </div>
          <div className="header-right">
            <div className="status-badge">
              <span className="status-dot"></span>
              <span className="status-text">计划状态：正常</span>
            </div>
          </div>
        </div>

        {/* 3. 学习目标 + 整体进度 */}
        <div className="overview-progress-section">
          <div className="goal-section">
            <div className="section-label">学习目标</div>
            <div className="goal-title">
              {currentSpace.goal.examDate
                ? `${currentSpace.goal.examDate.getFullYear()}年${(currentSpace.goal.examDate.getMonth() + 1)}月${currentSpace.goal.examDate.getDate()}日前通过 ${currentSpace.name}`
                : currentSpace.name
              }
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-header">
              <span className="section-label">整体进度</span>
              <InfoIcon />
            </div>
            <div className="progress-main">
              <div className="progress-percentage">{currentSpace.stats.overallProgress}%</div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${currentSpace.stats.overallProgress}%` }}
                />
              </div>
            </div>
            <div className="progress-encouragement">
              坚持得很好！继续保持 🤝
            </div>
          </div>
        </div>

        {/* 4. 核心数据卡片区 (2×2网格) */}
        <div className="overview-stats-grid">
          {/* 左上：每日可投入时间 */}
          <div className="stat-card stat-card-blue">
            <div className="stat-icon-blue">
              <ClockIcon />
            </div>
            <div className="stat-content">
              <div className="stat-title">每日可投入时间</div>
              <div className="stat-value">{dailyHours} 小时/天</div>
              <div className="stat-subtitle">约 {dailyMinutes} 分钟</div>
            </div>
          </div>

          {/* 右上：距离考试还有 */}
          <div className="stat-card stat-card-purple">
            <div className="stat-icon-purple">
              <CalendarIcon />
            </div>
            <div className="stat-content">
              <div className="stat-title">距离考试还有</div>
              <div className="stat-value">{daysUntilExam} 天</div>
              <div className="stat-subtitle">{examDate}</div>
            </div>
          </div>

          {/* 左下：优先学习科目 */}
          <div className="stat-card stat-card-orange">
            <div className="stat-icon-orange">
              <FlagIcon />
            </div>
            <div className="stat-content stat-content-with-badge">
              <div className="stat-title">优先学习科目</div>
              <div className="stat-badge stat-badge-orange">{weakSubjects.length}</div>
            </div>
            <div className="stat-tags">
              {weakSubjects.length > 0 ? (
                weakSubjects.map((subject, index) => (
                  <span key={index} className="tag tag-orange">{subject.name}</span>
                ))
              ) : (
                <span className="tag tag-orange">暂无</span>
              )}
            </div>
          </div>

          {/* 右下：薄弱科目 */}
          <div className="stat-card stat-card-red">
            <div className="stat-icon-red">
              <ArrowUpIcon />
            </div>
            <div className="stat-content stat-content-with-badge">
              <div className="stat-title">薄弱科目</div>
              <div className="stat-badge stat-badge-red">{allWeakPoints.length}</div>
            </div>
            <div className="stat-tags">
              {allWeakPoints.length > 0 ? (
                allWeakPoints.slice(0, 2).map((weakPoint, index) => (
                  <span key={index} className="tag tag-red">{weakPoint}</span>
                ))
              ) : (
                <span className="tag tag-red">暂无</span>
              )}
            </div>
          </div>
        </div>

        {/* 5. 待完成任务栏 */}
        <div className="overview-tasks-section">
          <div className="tasks-icon">
            <TaskIcon />
          </div>
          <div className="tasks-content">
            <div className="tasks-title">待完成任务</div>
            <div className="tasks-subtitle">需要你完成的学习任务</div>
          </div>
          <div className="tasks-count">
            <span className="tasks-number">{currentSpace.stats.tasksTotal - currentSpace.stats.tasksCompleted}</span>
            <ArrowRightIcon />
          </div>
        </div>

        {/* 6. 底部说明 + 操作栏 */}
        <div className="overview-footer">
          <div className="footer-left">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="7" stroke="#9CA3AF" strokeWidth="1.5" fill="none"/>
              <path d="M8 5H8.1M8 11H8.1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="footer-text">根据你的执行反馈，计划将持续优化调整</span>
          </div>
          <div className="footer-right">
            <span className="footer-link">查看详细计划 {'>'}</span>
          </div>
        </div>

      </div>
    </div>
  );
};