/**
 * 学习空间卡片组件
 * 显示单个学习空间的详细信息
 */

import React from 'react';
import { useNavigate } from 'react-router';
import type { StudySpace } from '../../types/space';
import { useSpaceStore } from '../../store/spaceStore';
import './SpaceCard.css';

interface SpaceCardProps {
  space: StudySpace;
}

export const SpaceCard: React.FC<SpaceCardProps> = ({ space }) => {
  const navigate = useNavigate();
  const { switchSpace } = useSpaceStore();

  // 处理卡片点击事件
  const handleCardClick = () => {
    // 切换当前空间
    switchSpace(space.id);
    // 跳转到对应的聊天页面
    navigate(`/workSpace/${space.id}`);
  };
  // 计算距离考试的天数
  const getDaysUntilExam = () => {
    if (!space?.goal.examDate) return 0;
    const now = new Date();
    const examTime = new Date(space.goal.examDate).getTime();
    const diff = examTime - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysUntilExam = getDaysUntilExam();

  // 格式化考试日期
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  // 格式化更新时间
  const formatUpdateTime = (time: Date | number) => {
    const date = time instanceof Date ? time : new Date(time);
    const timestamp = date.getTime();

    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return `${days} 天前`;
  };

  // 获取状态配置
  const getStatusConfig = () => {
    switch (space.status) {
      case 'active':
        return {
          label: '进行中',
          className: 'status-active',
          borderColor: '#10b981',
          bgColor: '#d1fae5',
          textColor: '#065f46'
        };
      case 'planning':
        return {
          label: '即将开始',
          className: 'status-upcoming',
          borderColor: '#f59e0b',
          bgColor: '#fef3c7',
          textColor: '#92400e'
        };
      case 'completed':
        return {
          label: '已完成',
          className: 'status-completed',
          borderColor: '#8b5cf6',
          bgColor: '#ede9fe',
          textColor: '#6d28d9'
        };
      case 'paused':
        return {
          label: '已暂停',
          className: 'status-paused',
          borderColor: '#9ca3af',
          bgColor: '#f3f4f6',
          textColor: '#4b5563'
        };
      default:
        return {
          label: '规划中',
          className: 'status-planning',
          borderColor: '#6366f1',
          bgColor: '#e0e7ff',
          textColor: '#4338ca'
        };
    }
  };

  // 获取学科标签
  const getSubjectTags = () => {
    return space.subjects.slice(0, 3).map(subject => subject.name);
  };

  // 获取卡片颜色
  const getCardStyle = () => {
    return {
      borderLeftColor: space.color,
      borderTopColor: space.color
    };
  };

  const statusConfig = getStatusConfig();
  const subjectTags = getSubjectTags();

  return (
    <div className="space-card" style={getCardStyle()} onClick={handleCardClick}>
      {/* 状态标签 */}
      <div className={`space-card-status ${statusConfig.className}`}>
        {statusConfig.label}
      </div>

      {/* 卡片内容 */}
      <div className="space-card-content">
        {/* 顶部图标区 */}
        <div className="space-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V17C2 18.1046 2.89543 19 4 19H20C21.1046 19 22 18.1046 22 17V7C22 2.89543 21.1046 2 20 2H12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 6V12M12 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* 主标题 */}
        <h3 className="space-card-title">{space.name}</h3>

        {/* 目标日期 */}
        <div className="space-card-date">
          目标日期：{formatDate(space.goal.examDate)}
        </div>

        {/* 进度条 */}
        <div className="space-card-progress">
          <div className="progress-info">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${space.stats.overallProgress}%`,
                  backgroundColor: statusConfig.borderColor
                }}
              />
            </div>
            <span className="progress-text">{space.stats.overallProgress}%</span>
          </div>
        </div>

        {/* 学科标签 */}
        <div className="space-card-tags">
          {subjectTags.map((tag, index) => (
            <span key={index} className="tag" style={{
              backgroundColor: `${space.color}15`,
              color: space.color
            }}>
              {tag}
            </span>
          ))}
          {space.subjects.length > 3 && (
            <span className="tag-more">+{space.subjects.length - 3}</span>
          )}
        </div>

        {/* 更新信息 */}
        <div className="space-card-update">
          更新于 {formatUpdateTime(space.updatedAt)}
        </div>
      </div>
    </div>
  );
};