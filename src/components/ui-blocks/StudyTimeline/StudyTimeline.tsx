/**
 * StudyTimeline UI Block
 * 显示学习计划时间线
 */

import React from 'react';
import type { StudyTimelineProps } from '@/types/uiBlocks';
import './StudyTimeline.css';

interface StudyTimelineComponentProps extends StudyTimelineProps {
  title?: string;
}

export const StudyTimeline: React.FC<StudyTimelineComponentProps> = ({
  title = '学习时间线',
  startDate,
  endDate,
  events
}) => {
  // 获取事件类型样式
  const getEventTypeClass = (type: string): string => {
    const typeMap: Record<string, string> = {
      milestone: 'event-milestone',
      exam: 'event-exam',
      rest: 'event-rest',
      study_session: 'event-study'
    };
    return typeMap[type] || 'event-study';
  };

  // 获取事件图标
  const getEventIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      milestone: '🏆',
      exam: '📝',
      rest: '☕',
      study_session: '📚'
    };
    return iconMap[type] || '📌';
  };

  // 获取重要性样式
  const getImportanceClass = (importance?: string): string => {
    if (!importance) return '';
    const importanceMap: Record<string, string> = {
      high: 'importance-high',
      medium: 'importance-medium',
      low: 'importance-low'
    };
    return importanceMap[importance] || '';
  };

  // 按日期排序事件
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  // 计算总天数
  const totalDays = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="study-timeline">
      <div className="timeline-header">
        <h3 className="timeline-title">{title}</h3>
        <div className="timeline-range">
          <span className="timeline-date">{formatDate(startDate)}</span>
          <span className="timeline-separator">→</span>
          <span className="timeline-date">{formatDate(endDate)}</span>
          <span className="timeline-total">共 {totalDays} 天</span>
        </div>
      </div>

      {/* 时间线图例 */}
      <div className="timeline-legend">
        <div className="legend-item">
          <span className="legend-dot event-milestone" />
          <span>里程碑</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot event-exam" />
          <span>考试</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot event-study" />
          <span>学习</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot event-rest" />
          <span>休息</span>
        </div>
      </div>

      {/* 时间线内容 */}
      <div className="timeline-content">
        {sortedEvents.map((event, index) => (
          <div
            key={index}
            className={`timeline-event ${getEventTypeClass(event.type)} ${getImportanceClass(event.importance)}`}
          >
            <div className="timeline-event-dot">
              <span className="event-icon">{getEventIcon(event.type)}</span>
            </div>

            <div className="timeline-event-content">
              <div className="event-date">{formatDate(event.date)}</div>
              <div className="event-title">{event.title}</div>
              {event.importance && (
                <div className="event-importance">
                  {event.importance === 'high' && '重要'}
                  {event.importance === 'medium' && '中等'}
                  {event.importance === 'low' && '一般'}
                </div>
              )}
            </div>

            {index < sortedEvents.length - 1 && <div className="timeline-line" />}
          </div>
        ))}

        {sortedEvents.length === 0 && (
          <div className="timeline-empty">
            <div className="empty-icon">📅</div>
            <p>暂无时间线事件</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyTimeline;
