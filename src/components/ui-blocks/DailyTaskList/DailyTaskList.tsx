/**
 * DailyTaskList UI Block
 * 显示每日学习任务列表
 */

import React, { useMemo, useState } from 'react';
import type { DailyTaskItem, DailyTaskListProps } from '@/types/uiBlocks';
import './DailyTaskList.css';

interface DailyTaskListComponentProps extends DailyTaskListProps {
  title?: string;
}

export const DailyTaskList: React.FC<DailyTaskListComponentProps> = ({
  title = '每日任务',
  date,
  tasks,
  totalDuration,
  totalTaskCount,
  displayedTaskCount,
  scheduleGroups
}) => {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const allTaskItems = useMemo(() => {
    const byId = new Map<string, DailyTaskItem>();
    for (const task of tasks) {
      byId.set(task.id, task);
    }
    for (const group of scheduleGroups || []) {
      for (const task of group.tasks) {
        if (!byId.has(task.id)) {
          byId.set(task.id, task);
        }
      }
    }
    return Array.from(byId.values());
  }, [tasks, scheduleGroups]);

  const [taskStates, setTaskStates] = useState<Record<string, 'pending' | 'in_progress' | 'completed' | 'skipped'>>({});

  // 获取优先级样式
  const getPriorityClass = (priority: string): string => {
    const priorityMap: Record<string, string> = {
      high: 'priority-high',
      medium: 'priority-medium',
      low: 'priority-low'
    };
    return priorityMap[priority] || 'priority-medium';
  };

  // 获取状态样式
  const getStatusClass = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: 'status-pending',
      in_progress: 'status-in-progress',
      completed: 'status-completed',
      skipped: 'status-skipped'
    };
    return statusMap[status] || 'status-pending';
  };

  // 获取状态图标
  const getStatusIcon = (status: string): string => {
    const iconMap: Record<string, string> = {
      pending: '○',
      in_progress: '◐',
      completed: '●',
      skipped: '⊘'
    };
    return iconMap[status] || '○';
  };

  // 切换任务状态
  const toggleTaskStatus = (taskId: string) => {
    setTaskStates(prev => {
      const currentStatus = prev[taskId] || allTaskItems.find(task => task.id === taskId)?.status || 'pending';
      const statusFlow: Record<string, string> = {
        pending: 'in_progress',
        in_progress: 'completed',
        completed: 'pending',
        skipped: 'pending'
      };
      return {
        ...prev,
        [taskId]: (statusFlow[currentStatus] || 'pending') as 'pending' | 'in_progress' | 'completed' | 'skipped'
      };
    });
  };

  // 计算完成进度
  const getTaskStatus = (task: DailyTaskItem) => taskStates[task.id] || task.status;
  const completedCount = tasks.filter(task => getTaskStatus(task) === 'completed').length;
  const totalCount = tasks.length;
  const currentCompletionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // 格式化时长
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const visibleTaskCount = displayedTaskCount ?? tasks.length;
  const plannedTaskCount = totalTaskCount ?? allTaskItems.length;
  const hasFullSchedule = !!scheduleGroups?.length && plannedTaskCount > visibleTaskCount;

  const renderTaskItem = (task: DailyTaskItem, className = '') => {
    const taskStatus = getTaskStatus(task);
    return (
      <div
        key={task.id}
        className={`task-item ${getPriorityClass(task.priority)} ${getStatusClass(taskStatus)} ${className}`.trim()}
        onClick={() => toggleTaskStatus(task.id)}
      >
        <div className="task-checkbox">
          <span className="task-status-icon">{getStatusIcon(taskStatus)}</span>
        </div>

        <div className="task-content">
          <div className="task-header">
            <span className="task-subject">{task.subject}</span>
            <span className="task-priority-badge">{task.priority === 'high' ? '重要' : task.priority === 'medium' ? '中等' : '普通'}</span>
          </div>
          <div className="task-title">{task.task}</div>
          <div className="task-meta">
            {task.estimatedTime && (
              <span className="task-time">🕐 {task.estimatedTime}</span>
            )}
            <span className="task-duration">⏱️ {formatDuration(task.duration)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="daily-task-list">
      <div className="daily-task-header">
        <div className="daily-task-title-section">
          <h3 className="daily-task-title">{title}</h3>
          <div className="daily-task-date">{date}</div>
        </div>
        <div className="daily-task-stats">
          <div className="stat-item">
            <span className="stat-value">{completedCount}/{totalCount}</span>
            <span className="stat-label">已完成</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{formatDuration(totalDuration)}</span>
            <span className="stat-label">总时长</span>
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="daily-task-progress">
        <div
          className="daily-task-progress-bar"
          style={{ width: `${currentCompletionRate}%` }}
        />
      </div>

      {/* 任务列表 */}
      <div className="daily-task-items">
        {tasks.map(task => renderTaskItem(task))}

        {tasks.length === 0 && (
          <div className="task-empty">
            <div className="empty-icon">📋</div>
            <p>今天没有安排任务</p>
          </div>
        )}
      </div>

      <div className="daily-task-schedule-summary">
        <span>已展示 {visibleTaskCount} / 共 {plannedTaskCount} 个排期任务</span>
        {hasFullSchedule && (
          <button
            type="button"
            className="daily-task-schedule-toggle"
            aria-expanded={isScheduleOpen}
            onClick={() => setIsScheduleOpen(open => !open)}
          >
            {isScheduleOpen ? '收起完整排期' : '查看完整排期'}
          </button>
        )}
      </div>

      {hasFullSchedule && isScheduleOpen && (
        <div className="daily-task-schedule-groups">
          {scheduleGroups.map(group => (
            <section className="schedule-group" key={group.date}>
              <div className="schedule-group-header">
                <span className="schedule-group-label">{group.label}</span>
                <span className="schedule-group-count">{group.tasks.length} 个任务</span>
              </div>
              <div className="schedule-group-tasks">
                {group.tasks.map(task => renderTaskItem(task, 'schedule-task-item'))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyTaskList;
