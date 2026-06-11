/**
 * DailyTaskList UI Block
 * Displays the daily study task list and persists task status updates.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { DailyTaskItem, DailyTaskListProps } from '@/types/uiBlocks';
import { usePlanStore } from '@/store/planStore';
import './DailyTaskList.css';

interface DailyTaskListComponentProps extends DailyTaskListProps {
  title?: string;
}

type TaskStatus = DailyTaskItem['status'];

const statusFlow: Record<TaskStatus, TaskStatus> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
  skipped: 'pending'
};

const getPriorityClass = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low'
  };
  return priorityMap[priority] || 'priority-medium';
};

const getStatusClass = (status: TaskStatus): string => {
  const statusMap: Record<TaskStatus, string> = {
    pending: 'status-pending',
    in_progress: 'status-in-progress',
    completed: 'status-completed',
    skipped: 'status-skipped'
  };
  return statusMap[status] || 'status-pending';
};

const getStatusIcon = (status: TaskStatus): string => {
  const iconMap: Record<TaskStatus, string> = {
    pending: '○',
    in_progress: '◐',
    completed: '●',
    skipped: '⊘'
  };
  return iconMap[status] || '○';
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

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
  const [taskStates, setTaskStates] = useState<Record<string, TaskStatus>>({});
  const taskStatesRef = useRef<Record<string, TaskStatus>>({});

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

  useEffect(() => {
    taskStatesRef.current = {};
    setTaskStates({});
  }, [allTaskItems]);

  const getCurrentTaskStatus = (taskId: string): TaskStatus => {
    return taskStatesRef.current[taskId] || allTaskItems.find(task => task.id === taskId)?.status || 'pending';
  };

  const getTaskStatus = (task: DailyTaskItem): TaskStatus => {
    return taskStates[task.id] || task.status;
  };

  const commitTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    const nextTaskStates = { ...taskStatesRef.current, [taskId]: newStatus };
    taskStatesRef.current = nextTaskStates;
    setTaskStates(nextTaskStates);
    usePlanStore.getState().updateTaskStatus(taskId, newStatus);
  };

  const toggleTaskStatus = (taskId: string) => {
    const currentStatus = getCurrentTaskStatus(taskId);
    commitTaskStatus(taskId, statusFlow[currentStatus] || 'pending');
  };

  const completeTaskStatus = (taskId: string) => {
    commitTaskStatus(taskId, 'completed');
  };

  const completedCount = tasks.filter(task => getTaskStatus(task) === 'completed').length;
  const totalCount = tasks.length;
  const currentCompletionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
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
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          completeTaskStatus(task.id);
        }}
      >
        <div className="task-checkbox">
          <span className="task-status-icon">{getStatusIcon(taskStatus)}</span>
        </div>

        <div className="task-content">
          <div className="task-header">
            <span className="task-subject">{task.subject}</span>
            <span className="task-priority-badge">
              {task.priority === 'high' ? '重要' : task.priority === 'medium' ? '中等' : '普通'}
            </span>
          </div>
          <div className="task-title">{task.task}</div>
          <div className="task-meta">
            {task.estimatedTime && (
              <span className="task-time">时间 {task.estimatedTime}</span>
            )}
            <span className="task-duration">时长 {formatDuration(task.duration)}</span>
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

      <div className="daily-task-progress">
        <div
          className="daily-task-progress-bar"
          style={{ width: `${currentCompletionRate}%` }}
        />
      </div>

      <div className="daily-task-items">
        {tasks.map(task => renderTaskItem(task))}

        {tasks.length === 0 && (
          <div className="task-empty">
            <div className="empty-icon">--</div>
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
