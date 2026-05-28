import type { StudySpace } from '@/types/space';

const DAY_MS = 24 * 60 * 60 * 1000;

export const WORKSPACE_STATUS_CONFIG = {
  planning: {
    label: '即将开始',
    className: 'status-planning',
    color: '#f59e0b',
    textColor: '#92400e',
    softBg: '#fef3c7',
    surface: '#fffbeb',
    border: '#fbbf24',
    shadow: 'rgba(245, 158, 11, 0.18)'
  },
  active: {
    label: '进行中',
    className: 'status-active',
    color: '#3b82f6',
    textColor: '#1d4ed8',
    softBg: '#dbeafe',
    surface: '#eff6ff',
    border: '#60a5fa',
    shadow: 'rgba(59, 130, 246, 0.18)'
  },
  completed: {
    label: '已完成',
    className: 'status-completed',
    color: '#10b981',
    textColor: '#047857',
    softBg: '#d1fae5',
    surface: '#ecfdf5',
    border: '#34d399',
    shadow: 'rgba(16, 185, 129, 0.18)'
  },
  paused: {
    label: '已暂停',
    className: 'status-paused',
    color: '#6b7280',
    textColor: '#4b5563',
    softBg: '#f3f4f6',
    surface: '#f9fafb',
    border: '#d1d5db',
    shadow: 'rgba(107, 114, 128, 0.16)'
  }
} satisfies Record<StudySpace['status'], {
  label: string;
  className: string;
  color: string;
  textColor: string;
  softBg: string;
  surface: string;
  border: string;
  shadow: string;
}>;

export const getWorkspaceStatusConfig = (status: StudySpace['status']) =>
  WORKSPACE_STATUS_CONFIG[status] ?? WORKSPACE_STATUS_CONFIG.planning;

export const clampProgress = (value: unknown) => {
  const progress = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(progress)) return 0;
  return Math.max(0, Math.min(100, Math.round(progress)));
};

export const getValidDateTimestamp = (value: unknown) => {
  if (!value) return null;
  const timestamp = new Date(value as string | number | Date).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const formatGoalDate = (value: unknown) => {
  const timestamp = getValidDateTimestamp(value);
  if (timestamp === null) return '目标日期待确认';

  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const getExamCountdownLabel = (value: unknown) => {
  const timestamp = getValidDateTimestamp(value);
  if (timestamp === null) return '目标日期待确认';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(timestamp);
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const days = Math.ceil((targetDay - today) / DAY_MS);

  if (days > 0) return `距离考试还有 ${days} 天`;
  if (days === 0) return '今天是目标日';
  return `目标日已过去 ${Math.abs(days)} 天`;
};

export const getTodayTaskLabel = (space: StudySpace) => {
  const completed = Math.max(0, space.stats.tasksCompleted ?? 0);
  const total = Math.max(0, space.stats.tasksTotal ?? 0);

  if (total === 0) return '尚未开始今日学习';
  return `${Math.min(completed, total)} / ${total} 任务完成`;
};

export const getWeakPoints = (space?: StudySpace | null) => {
  if (!space) return [];

  return space.subjects
    .flatMap((subject) => subject.weakPoints ?? [])
    .filter(Boolean)
    .slice(0, 3);
};

export const getProgressAdvice = (progress: number) => {
  if (progress < 30) {
    return {
      title: '学习初期，先打好基础',
      description: '建议先完成核心概念和例题练习，避免过早进入刷题。'
    };
  }

  if (progress < 70) {
    return {
      title: '保持学习节奏',
      description: '继续稳定推进每日任务，优先处理薄弱知识点。'
    };
  }

  return {
    title: '冲刺阶段，查漏补缺',
    description: '可以增加错题复盘和限时训练，减少低收益重复学习。'
  };
};

export const getSpaceAdvice = (space?: StudySpace | null) => {
  if (!space) {
    return {
      title: '创建第一个学习空间',
      description: '设置目标日期、学习科目和可用时间后，AI 建议会更具体。'
    };
  }

  const weakPoints = getWeakPoints(space);
  if (weakPoints.length > 0) {
    return {
      title: `重点关注：${weakPoints.join('、')}`,
      description: '建议把这些薄弱点排到最近的学习任务中，先补齐关键短板。'
    };
  }

  return getProgressAdvice(clampProgress(space.stats.overallProgress));
};

export const selectPrimaryStudySpace = (spaces: StudySpace[]) => {
  if (spaces.length === 0) return null;

  const sortByExamThenUpdate = (a: StudySpace, b: StudySpace) => {
    const aExam = getValidDateTimestamp(a.goal.examDate) ?? Number.MAX_SAFE_INTEGER;
    const bExam = getValidDateTimestamp(b.goal.examDate) ?? Number.MAX_SAFE_INTEGER;

    if (aExam !== bExam) return aExam - bExam;

    const aUpdated = getValidDateTimestamp(a.updatedAt) ?? 0;
    const bUpdated = getValidDateTimestamp(b.updatedAt) ?? 0;
    return bUpdated - aUpdated;
  };

  const activeSpaces = spaces.filter((space) => space.status === 'active').sort(sortByExamThenUpdate);
  if (activeSpaces[0]) return activeSpaces[0];

  const planningSpaces = spaces.filter((space) => space.status === 'planning').sort(sortByExamThenUpdate);
  if (planningSpaces[0]) return planningSpaces[0];

  return [...spaces].sort((a, b) => {
    const aUpdated = getValidDateTimestamp(a.updatedAt) ?? 0;
    const bUpdated = getValidDateTimestamp(b.updatedAt) ?? 0;
    return bUpdated - aUpdated;
  })[0];
};
