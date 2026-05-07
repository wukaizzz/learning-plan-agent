/**
 * DailyTaskList UI Block
 * 显示每日学习任务列表
 */

import React, { useState } from 'react';
import type { DailyTaskListProps } from '@/types/uiBlocks';
import './DailyTaskList.css';

interface DailyTaskListComponentProps extends DailyTaskListProps {
  title?: string;
}

export const DailyTaskList: React.FC<DailyTaskListComponentProps> = ({
  title = '每日任务',
  date,
  tasks,
  totalDuration,
  completionRate
}) => {
  const [taskStates, setTaskStates] = useState<Record<string, 'pending' | 'in_progress' | 'completed' | 'skipped'>>(
    tasks.reduce((acc, task) => ({ ...acc, [task.id]: task.status }), {})
  );

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
      const currentStatus = prev[taskId];
      const statusFlow: Record<string, string> = {
        pending: 'in_progress',
        in_progress: 'completed',
        completed: 'pending',
        skipped: 'pending'
      };
      return {
        ...prev,
        [taskId]: (statusFlow[currentStatus] || 'pending') as any
      };
    });
  };

  // 计算完成进度
  const completedCount = Object.values(taskStates).filter(s => s === 'completed').length;
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
        {tasks.map((task, index) => {
          const taskStatus = taskStates[task.id] || task.status;
          return (
            <div
              key={task.id}
              className={`task-item ${getPriorityClass(task.priority)} ${getStatusClass(taskStatus)}`}
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
        })}

        {tasks.length === 0 && (
          <div className="task-empty">
            <div className="empty-icon">📋</div>
            <p>今天没有安排任务</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyTaskList;
