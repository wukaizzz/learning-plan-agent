/**
 * DailyTaskList UI Block
 * Displays the daily study task list and persists task status updates.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Timer, XCircle } from 'lucide-react';
import type { DailyTaskItem, DailyTaskListProps } from '@/types/uiBlocks';
import { usePlanStore } from '@/store/planStore';
import './DailyTaskList.css';

interface DailyTaskListComponentProps extends DailyTaskListProps {
  title?: string;
}

type TaskStatus = DailyTaskItem['status'];

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

const getTaskDurationSeconds = (task: DailyTaskItem): number => {
  return Math.max(1, Math.round(task.duration * 60));
};

const formatCountdown = (seconds: number): string => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(remainingSeconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
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
  const [focusTask, setFocusTask] = useState<DailyTaskItem | null>(null);
  const [focusTotalSeconds, setFocusTotalSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isFocusExpired, setIsFocusExpired] = useState(false);
  const taskStatesRef = useRef<Record<string, TaskStatus>>({});
  const clickTimerRef = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (clickTimerRef.current !== null) {
        window.clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!focusTask || isFocusExpired) {
      return;
    }

    const timerId = window.setInterval(() => {
      setRemainingSeconds(current => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [focusTask, isFocusExpired]);

  useEffect(() => {
    if (focusTask && remainingSeconds === 0) {
      setIsFocusExpired(true);
    }
  }, [focusTask, remainingSeconds]);

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

  const clearPendingTaskClick = () => {
    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  };

  const closeFocusSession = () => {
    setFocusTask(null);
    setFocusTotalSeconds(0);
    setRemainingSeconds(0);
    setIsFocusExpired(false);
  };

  const startFocusSession = (task: DailyTaskItem) => {
    const currentStatus = getCurrentTaskStatus(task.id);
    if (currentStatus !== 'in_progress') {
      commitTaskStatus(task.id, 'in_progress');
    }

    const totalSeconds = getTaskDurationSeconds(task);
    setFocusTask(task);
    setFocusTotalSeconds(totalSeconds);
    setRemainingSeconds(totalSeconds);
    setIsFocusExpired(false);
  };

  const handleTaskClick = (task: DailyTaskItem) => {
    const currentStatus = getCurrentTaskStatus(task.id);
    if (currentStatus === 'completed') {
      commitTaskStatus(task.id, 'pending');
      return;
    }

    startFocusSession(task);
  };

  const scheduleTaskClick = (task: DailyTaskItem) => {
    clearPendingTaskClick();
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      handleTaskClick(task);
    }, 220);
  };

  const completeTaskStatus = (taskId: string) => {
    commitTaskStatus(taskId, 'completed');
    if (focusTask?.id === taskId) {
      closeFocusSession();
    }
  };

  const abandonFocusSession = () => {
    if (!focusTask) return;
    commitTaskStatus(focusTask.id, 'pending');
    closeFocusSession();
  };

  const completedCount = tasks.filter(task => getTaskStatus(task) === 'completed').length;
  const totalCount = tasks.length;
  const currentCompletionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const visibleTaskCount = displayedTaskCount ?? tasks.length;
  const plannedTaskCount = totalTaskCount ?? allTaskItems.length;
  const hasFullSchedule = !!scheduleGroups?.length && plannedTaskCount > visibleTaskCount;
  const focusProgress = focusTotalSeconds > 0
    ? Math.round((focusTotalSeconds - remainingSeconds) / focusTotalSeconds * 100)
    : 0;

  const renderTaskItem = (task: DailyTaskItem, className = '') => {
    const taskStatus = getTaskStatus(task);
    return (
      <div
        key={task.id}
        className={`task-item ${getPriorityClass(task.priority)} ${getStatusClass(taskStatus)} ${className}`.trim()}
        onClick={() => scheduleTaskClick(task)}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          clearPendingTaskClick();
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

  const renderFocusTimer = () => {
    if (!focusTask) return null;

    return (
      <div
        className="daily-task-focus-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-task-focus-title"
      >
        <div className="daily-task-focus-dialog">
          <div className="daily-task-focus-header">
            <div className="daily-task-focus-icon" aria-hidden="true">
              <Timer size={24} />
            </div>
            <div className="daily-task-focus-heading">
              <div className="daily-task-focus-kicker">
                {isFocusExpired ? '计划时间已结束' : '专注进行中'}
              </div>
              <h3 id="daily-task-focus-title" className="daily-task-focus-title">
                {focusTask.task}
              </h3>
            </div>
          </div>

          <div className="daily-task-focus-meta">
            <span>{focusTask.subject}</span>
            <span>{formatDuration(focusTask.duration)}</span>
          </div>

          <div className="daily-task-focus-time" aria-live="polite">
            {formatCountdown(remainingSeconds)}
          </div>

          <div className="daily-task-focus-track" aria-hidden="true">
            <div
              className="daily-task-focus-fill"
              style={{ width: `${focusProgress}%` }}
            />
          </div>

          <p className="daily-task-focus-hint">
            {isFocusExpired
              ? '本次计划时间已到，请根据实际完成情况结束任务。'
              : '计时期间请保持专注，完成后再返回对话和计划。'}
          </p>

          <div className="daily-task-focus-actions">
            <button
              type="button"
              className="daily-task-focus-button daily-task-focus-button-complete"
              onClick={() => completeTaskStatus(focusTask.id)}
            >
              <CheckCircle2 size={18} />
              提前完成
            </button>
            <button
              type="button"
              className="daily-task-focus-button daily-task-focus-button-abandon"
              onClick={abandonFocusSession}
            >
              <XCircle size={18} />
              放弃本次专注
            </button>
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

      {renderFocusTimer()}
    </div>
  );
};

export default DailyTaskList;
