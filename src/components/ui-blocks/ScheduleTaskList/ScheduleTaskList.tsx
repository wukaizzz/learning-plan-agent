import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CircleMinus,
  Clock3,
  Hourglass,
  ListChecks,
  PlayCircle
} from 'lucide-react';
import type {
  ScheduleDay,
  ScheduleSummary,
  ScheduleTask,
  ScheduleTaskListProps
} from '@/types/uiBlocks';
import './ScheduleTaskList.css';

interface ScheduleTaskListComponentProps extends ScheduleTaskListProps {
  title?: string;
}

const STATUS_LABELS: Record<ScheduleTask['status'], string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  skipped: '已跳过',
  failed: '失败'
};

const TYPE_LABELS: Record<string, string> = {
  study: '学习',
  practice: '练习',
  review: '复习'
};

const PRIORITY_LABELS: Record<ScheduleTask['priority'], string> = {
  high: '高',
  medium: '中',
  low: '低'
};

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric'
  }).format(parsed);
}

function formatDateTime(value?: string | number) {
  if (!value) return '未记录';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours} 小时 ${remainder} 分钟` : `${hours} 小时`;
}

function SummaryGrid({ summary }: { summary: ScheduleSummary }) {
  const items = [
    { label: '总任务', value: summary.totalTasks, icon: ListChecks, tone: 'blue' },
    { label: '总时长', value: `${summary.totalMinutes} 分钟`, icon: Clock3, tone: 'green' },
    { label: '进行中', value: summary.inProgressTasks, icon: PlayCircle, tone: 'orange' },
    { label: '待开始', value: summary.pendingTasks, icon: Hourglass, tone: 'gray' },
    { label: '已完成', value: summary.completedTasks, icon: CheckCircle2, tone: 'green' },
    { label: '已跳过', value: summary.skippedTasks, icon: CircleMinus, tone: 'gray' },
    { label: '失败', value: summary.failedTasks, icon: CircleAlert, tone: 'red' }
  ];

  return (
    <div className="schedule-query-summary">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <div className={`schedule-query-stat schedule-query-stat-${tone}`} key={label}>
          <div className="schedule-query-stat-value">
            <Icon size={18} aria-hidden="true" />
            <strong>{value}</strong>
          </div>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function TaskRow({ task, index }: { task: ScheduleTask; index: number }) {
  return (
    <div className="schedule-query-task-row">
      <span className={`schedule-query-task-index schedule-query-priority-${task.priority}`}>
        {index + 1}
      </span>
      <div className="schedule-query-task-main">
        <strong>{task.title}</strong>
        <span>{task.subjectName} · {TYPE_LABELS[task.type] || task.type}</span>
      </div>
      <span className={`schedule-query-status schedule-query-status-${task.status}`}>
        {STATUS_LABELS[task.status]}
      </span>
      <span className="schedule-query-task-time">
        {task.estimatedTime || '未设置具体时段'}
      </span>
      <span className="schedule-query-task-duration">
        {formatMinutes(task.estimatedMinutes)}
      </span>
      <span className={`schedule-query-task-priority schedule-query-priority-${task.priority}`}>
        {PRIORITY_LABELS[task.priority]}
      </span>
    </div>
  );
}

function DaySection({ day }: { day: ScheduleDay }) {
  return (
    <section className="schedule-query-day">
      <div className="schedule-query-day-heading">
        <h4>{formatDate(day.date)}（{day.weekday}）</h4>
        <span>{day.summary.totalTasks} 个任务 · {formatMinutes(day.summary.totalMinutes)}</span>
      </div>
      <div className="schedule-query-task-list">
        {day.tasks.map((task, index) => (
          <TaskRow task={task} index={index} key={task.id} />
        ))}
      </div>
    </section>
  );
}

export function ScheduleTaskList({
  title = '学习日程',
  dateFrom,
  dateTo,
  dayCount,
  queriedAt,
  planVersion,
  planUpdatedAt,
  summary,
  days
}: ScheduleTaskListComponentProps) {
  const singleDay = dateFrom === dateTo;

  return (
    <section className="schedule-query-card" aria-label={title}>
      <header className="schedule-query-header">
        <div className="schedule-query-heading">
          <span className="schedule-query-calendar" aria-hidden="true">
            <CalendarDays size={23} />
          </span>
          <div>
            <h3>{title}</h3>
            <p>
              {singleDay
                ? `${formatDate(dateFrom)}${days[0]?.weekday ? `（${days[0].weekday}）` : ''}`
                : `${formatDate(dateFrom)} 至 ${formatDate(dateTo)}`}
            </p>
          </div>
        </div>
        <span className="schedule-query-readonly">只读</span>
      </header>

      <SummaryGrid summary={summary} />

      <div className="schedule-query-content">
        <h4 className="schedule-query-list-title">任务列表</h4>
        {days.length > 0 ? (
          days.map(day => <DaySection day={day} key={day.date} />)
        ) : (
          <div className="schedule-query-empty">
            <CalendarDays size={24} aria-hidden="true" />
            <p>该日期范围内没有安排任务</p>
          </div>
        )}
      </div>

      <footer className="schedule-query-footer">
        <span>计划版本：{planVersion ? `v${planVersion}` : '未记录'}</span>
        <span>计划更新时间：{formatDateTime(planUpdatedAt)}</span>
        <span>查询时间：{formatDateTime(queriedAt)}</span>
        <span>共 {dayCount} 天</span>
      </footer>
    </section>
  );
}

export default ScheduleTaskList;
