/**
 * UIBlock ↔ Plan + StudyTask + PlanBlock 转换层
 *
 * 负责：
 * 1. extractPlanFromUIBlocks: 从 SSE 运行时 UIBlock[] 提取 Plan + StudyTask[] + PlanBlock[]
 *    - 完整提取 tasks + scheduleGroups[].tasks，按 id 去重
 *    - 从 scheduleGroup 补 scheduledDate / groupLabel
 * 2. hydrateUIBlocksFromPlan: 从持久化数据重建可渲染 UIBlock[]
 *    - 按 scheduledDate 分组重建 DailyScheduleGroup[]
 */

import type { UIBlock, DailyTaskItem, DailyScheduleGroup } from '@/types/uiBlocks';
import type { Plan, StudyTask, PlanBlock } from '@/types/plan';

/** 计划相关 block 类型 */
export const PLAN_BLOCK_TYPES = new Set([
  'summary-card',
  'daily-task-list',
  'study-timeline',
  'risk-alert',
  'progress-bar',
  'action-bar',
]);

/** 任务密集型 block 类型（需要提取 tasks） */
const TASK_HEAVY_BLOCK_TYPES = new Set(['daily-task-list']);

interface PlanMeta {
  sessionId?: string;
  messageId?: string;
}

interface ExtractedPlan {
  plan: Plan;
  tasks: StudyTask[];
  blocks: PlanBlock[];
}

// ============= 提取（UIBlock → Plan + StudyTask + PlanBlock） =============

/**
 * 从运行时 UIBlock[] 提取计划数据
 *
 * 关键修正：完整 flatten tasks + scheduleGroups[].tasks，按 id 去重
 */
export function extractPlanFromUIBlocks(
  spaceId: string,
  uiBlocks: UIBlock[],
  meta?: PlanMeta
): ExtractedPlan | null {
  // 只处理计划相关 blocks
  const planBlocks = uiBlocks.filter(b => PLAN_BLOCK_TYPES.has(b.type));
  if (planBlocks.length === 0) return null;

  const planId = `plan_${spaceId}_${Date.now()}`;
  const now = Date.now();

  // 从 summary-card 提取标题（如果有）
  const summaryCard = planBlocks.find(b => b.type === 'summary-card');
  const title = (summaryCard?.props?.spaceName as string) || '学习计划';

  const allTasks: StudyTask[] = [];
  const allPlanBlocks: PlanBlock[] = [];

  for (let order = 0; order < planBlocks.length; order++) {
    const block = planBlocks[order];

    if (TASK_HEAVY_BLOCK_TYPES.has(block.type)) {
      const { tasks, planBlock } = extractTasksFromBlock(block, planId, order);
      allTasks.push(...tasks);
      allPlanBlocks.push(planBlock);
    } else {
      // 非 task-heavy block：直接存完整 props
      allPlanBlocks.push({
        id: block.id,
        planId,
        type: block.type,
        title: block.title,
        order,
        props: { ...block.props },
      });
    }
  }

  return {
    plan: {
      id: planId,
      spaceId,
      title,
      status: 'draft',
      version: 1,
      createdAt: now,
      updatedAt: now,
      sourceSessionId: meta?.sessionId,
      sourceMessageId: meta?.messageId,
    },
    tasks: allTasks,
    blocks: allPlanBlocks,
  };
}

/**
 * 从 daily-task-list UIBlock 完整提取任务
 * flatten tasks + scheduleGroups[].tasks，按 id 去重
 */
function extractTasksFromBlock(
  block: UIBlock,
  planId: string,
  order: number
): { tasks: StudyTask[]; planBlock: PlanBlock } {
  const props = block.props as Record<string, unknown>;
  const propsTasks = Array.isArray(props.tasks) ? (props.tasks as DailyTaskItem[]) : [];
  const propsScheduleGroups = Array.isArray(props.scheduleGroups) ? (props.scheduleGroups as DailyScheduleGroup[]) : [];
  const blockDate = (props.date as string) || '';

  // 用 Map 按 id 去重，保留最完整的版本
  const taskMap = new Map<string, { item: DailyTaskItem; scheduledDate: string; groupLabel?: string }>();

  // 先提取顶层 tasks
  for (const t of propsTasks) {
    taskMap.set(t.id, { item: t, scheduledDate: blockDate });
  }

  // 再提取 scheduleGroups 中的 tasks，补充 scheduledDate 和 groupLabel
  for (const group of propsScheduleGroups) {
    for (const t of group.tasks) {
      if (!taskMap.has(t.id)) {
        taskMap.set(t.id, {
          item: t,
          scheduledDate: group.date || blockDate,
          groupLabel: group.label,
        });
      } else {
        // 已存在：补上 scheduledDate 和 groupLabel（如果原来没有）
        const existing = taskMap.get(t.id)!;
        if (existing.scheduledDate === blockDate && group.date) {
          existing.scheduledDate = group.date;
        }
        if (!existing.groupLabel && group.label) {
          existing.groupLabel = group.label;
        }
      }
    }
  }

  // 转换为 StudyTask[]
  const tasks: StudyTask[] = Array.from(taskMap.entries()).map(([id, { item, scheduledDate, groupLabel }], idx) => ({
    id,
    planId,
    subject: item.subject,
    title: item.task,
    type: 'study' as const,
    priority: item.priority,
    status: item.status,
    estimatedMinutes: item.duration,
    scheduledDate,
    groupLabel,
    order: idx,
    estimatedTime: item.estimatedTime,
  }));

  // PlanBlock 只保留 taskIds + 标量 props
  const scalarProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    // 跳过嵌套任务数据（由 StudyTask 管理）
    if (key === 'tasks' || key === 'scheduleGroups') continue;
    scalarProps[key] = value;
  }

  const planBlock: PlanBlock = {
    id: block.id,
    planId,
    type: block.type,
    title: block.title,
    order,
    taskIds: tasks.map(t => t.id),
    props: scalarProps,
  };

  return { tasks, planBlock };
}

// ============= 水合（Plan + StudyTask + PlanBlock → UIBlock） =============

/**
 * 从持久化数据重建可渲染 UIBlock[]
 *
 * - 有 taskIds 的 PlanBlock: 查找 StudyTask[] → 重建 DailyTaskItem[] + DailyScheduleGroup[]
 * - 无 taskIds: 直接展开 props
 */
export function hydrateUIBlocksFromPlan(
  _plan: Plan,
  blocks: PlanBlock[],
  tasks: StudyTask[]
): UIBlock[] {
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  return blocks
    .sort((a, b) => a.order - b.order)
    .map(block => {
      if (block.taskIds && block.taskIds.length > 0) {
        return hydrateTaskBlock(block, taskMap);
      }
      return {
        id: block.id,
        type: block.type,
        title: block.title,
        props: { ...block.props },
      };
    });
}

/**
 * 重建 task-heavy block（daily-task-list）
 * 从 StudyTask[] → DailyTaskItem[] + DailyScheduleGroup[]
 */
function hydrateTaskBlock(
  block: PlanBlock,
  taskMap: Map<string, StudyTask>
): UIBlock {
  const matchedTasks = block.taskIds!
    .map(id => taskMap.get(id))
    .filter((t): t is StudyTask => t !== undefined);

  // StudyTask → DailyTaskItem
  const dailyItems: DailyTaskItem[] = matchedTasks.map(t => ({
    id: t.id,
    subject: t.subject,
    task: t.title,
    duration: t.estimatedMinutes,
    priority: t.priority,
    status: t.status,
    estimatedTime: t.estimatedTime,
  }));

  // 按 scheduledDate 分组重建 DailyScheduleGroup[]
  const groupsByDate = new Map<string, { label: string; tasks: DailyTaskItem[] }>();
  for (const t of matchedTasks) {
    const date = t.scheduledDate;
    if (!groupsByDate.has(date)) {
      groupsByDate.set(date, { label: t.groupLabel || date, tasks: [] });
    }
    groupsByDate.get(date)!.tasks.push({
      id: t.id,
      subject: t.subject,
      task: t.title,
      duration: t.estimatedMinutes,
      priority: t.priority,
      status: t.status,
      estimatedTime: t.estimatedTime,
    });
  }

  const scheduleGroups: DailyScheduleGroup[] = Array.from(groupsByDate.entries())
    .map(([date, { label, tasks: groupTasks }]) => ({
      date,
      label,
      tasks: groupTasks,
    }));

  return {
    id: block.id,
    type: block.type,
    title: block.title,
    props: {
      ...block.props,
      tasks: dailyItems,
      scheduleGroups,
    },
  };
}
