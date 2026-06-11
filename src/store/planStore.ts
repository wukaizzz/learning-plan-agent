import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { DailyScheduleGroup, DailyTaskItem, UIBlock } from '@/types/uiBlocks';
import { useSpaceStore } from '@/store/spaceStore';
import { useChatStore } from '@/store/chatStore';
import type { AgentExecutionRecord, Plan, PlanBlock, StudyTask } from '@/types/plan';
import { extractPlanFromUIBlocks, hydrateUIBlocksFromPlan, PLAN_BLOCK_TYPES } from '@/utils/planBlockAdapter';

interface PlanMeta {
  sessionId?: string;
  messageId?: string;
}

type SubjectProgressByName = Record<string, number>;

export interface PlanStore {
  plans: Plan[];
  tasks: StudyTask[];
  blocks: PlanBlock[];
  executions: AgentExecutionRecord[];

  getLatestPlanBySpace: (spaceId: string) => Plan | null;
  getTasksByPlan: (planId: string) => StudyTask[];
  getBlocksByPlan: (planId: string) => PlanBlock[];
  getLatestExecutionBySpace: (spaceId: string) => AgentExecutionRecord | null;
  hydrateUIBlocks: (spaceId: string) => UIBlock[];

  saveDraftBlocks: (spaceId: string, uiBlocks: UIBlock[], meta?: PlanMeta) => void;
  activatePlan: (spaceId: string) => void;
  updateTaskStatus: (taskId: string, status: StudyTask['status']) => void;
  saveExecution: (record: AgentExecutionRecord) => void;
  deletePlanBySpace: (spaceId: string) => void;
}

const getPlanStatusRank = (status: Plan['status']) => {
  if (status === 'active') return 3;
  if (status === 'draft') return 2;
  if (status === 'paused' || status === 'completed') return 1;
  return 0;
};

const sortPlansByEffectiveLatest = (a: Plan, b: Plan) => {
  const rankDiff = getPlanStatusRank(b.status) - getPlanStatusRank(a.status);
  if (rankDiff !== 0) return rankDiff;
  return b.updatedAt - a.updatedAt;
};

const calculateSubjectProgress = (tasks: StudyTask[]): SubjectProgressByName => {
  const counts = new Map<string, { completed: number; total: number }>();

  for (const task of tasks) {
    const current = counts.get(task.subject) || { completed: 0, total: 0 };
    current.total += 1;
    if (task.status === 'completed') {
      current.completed += 1;
    }
    counts.set(task.subject, current);
  }

  return Object.fromEntries(
    Array.from(counts.entries()).map(([subject, value]) => [
      subject,
      value.total > 0 ? Math.round(value.completed / value.total * 100) : 0
    ])
  );
};

const applySummaryProgress = (
  props: Record<string, unknown>,
  overallProgress: number,
  subjectProgress: SubjectProgressByName
) => {
  const subjects = Array.isArray(props.subjects)
    ? props.subjects.map(subject => {
        if (!subject || typeof subject !== 'object') return subject;
        const subjectRecord = subject as Record<string, unknown>;
        const name = subjectRecord.name;
        if (typeof name !== 'string' || subjectProgress[name] === undefined) {
          return subject;
        }
        return {
          ...subjectRecord,
          progress: subjectProgress[name]
        };
      })
    : props.subjects;

  return {
    ...props,
    overallProgress,
    ...(Array.isArray(props.subjects) ? { subjects } : {})
  };
};

const updateDailyTaskItemStatus = (
  task: DailyTaskItem,
  taskId: string,
  status: StudyTask['status']
): DailyTaskItem => (
  task.id === taskId ? { ...task, status } : task
);

const applyDailyTaskListProgress = (
  props: Record<string, unknown>,
  taskId: string,
  status: StudyTask['status'],
  completionRate: number
) => {
  const tasks = Array.isArray(props.tasks)
    ? (props.tasks as DailyTaskItem[]).map(task => updateDailyTaskItemStatus(task, taskId, status))
    : props.tasks;

  const scheduleGroups = Array.isArray(props.scheduleGroups)
    ? (props.scheduleGroups as DailyScheduleGroup[]).map(group => ({
        ...group,
        tasks: group.tasks.map(task => updateDailyTaskItemStatus(task, taskId, status))
      }))
    : props.scheduleGroups;

  return {
    ...props,
    completionRate,
    ...(Array.isArray(props.tasks) ? { tasks } : {}),
    ...(Array.isArray(props.scheduleGroups) ? { scheduleGroups } : {})
  };
};

export const usePlanStore = create<PlanStore>()(
  persist(
    immer((set, get) => ({
      plans: [],
      tasks: [],
      blocks: [],
      executions: [],

      getLatestPlanBySpace: (spaceId: string) => {
        const { plans } = get();
        return plans
          .filter(plan => plan.spaceId === spaceId && plan.status !== 'archived')
          .sort(sortPlansByEffectiveLatest)[0] ?? null;
      },

      getTasksByPlan: (planId: string) => {
        return get().tasks.filter(task => task.planId === planId);
      },

      getBlocksByPlan: (planId: string) => {
        return get().blocks.filter(block => block.planId === planId);
      },

      getLatestExecutionBySpace: (spaceId: string) => {
        const { executions } = get();
        return executions
          .filter(execution => execution.spaceId === spaceId)
          .sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
      },

      hydrateUIBlocks: (spaceId: string) => {
        const plan = get().getLatestPlanBySpace(spaceId);
        if (!plan) return [];
        const planTasks = get().getTasksByPlan(plan.id);
        const planBlocks = get().getBlocksByPlan(plan.id);
        return hydrateUIBlocksFromPlan(plan, planBlocks, planTasks);
      },

      saveDraftBlocks: (spaceId: string, uiBlocks: UIBlock[], meta?: PlanMeta) => {
        const planBlocks = uiBlocks.filter(block => PLAN_BLOCK_TYPES.has(block.type));
        if (planBlocks.length === 0) return;

        const extracted = extractPlanFromUIBlocks(spaceId, planBlocks, meta);
        if (!extracted) return;

        set(state => {
          const existingDraft = state.plans.find(
            plan => plan.spaceId === spaceId && plan.status === 'draft'
          );

          if (existingDraft) {
            state.tasks = state.tasks.filter(task => task.planId !== existingDraft.id);
            state.blocks = state.blocks.filter(block => block.planId !== existingDraft.id);

            existingDraft.updatedAt = Date.now();
            existingDraft.title = extracted.plan.title;
            if (meta?.sessionId) existingDraft.sourceSessionId = meta.sessionId;
            if (meta?.messageId) existingDraft.sourceMessageId = meta.messageId;

            state.tasks.push(...extracted.tasks.map(task => ({ ...task, planId: existingDraft.id })));
            state.blocks.push(...extracted.blocks.map(block => ({ ...block, planId: existingDraft.id })));
            return;
          }

          const oldActive = state.plans.find(
            plan => plan.spaceId === spaceId && plan.status === 'active'
          );
          if (oldActive) {
            oldActive.status = 'archived';
            oldActive.updatedAt = Date.now();
          }

          state.plans.push(extracted.plan);
          state.tasks.push(...extracted.tasks);
          state.blocks.push(...extracted.blocks);
        });
      },

      activatePlan: (spaceId: string) => {
        set(state => {
          const draft = state.plans.find(
            plan => plan.spaceId === spaceId && plan.status === 'draft'
          );
          if (draft) {
            draft.status = 'active';
            draft.updatedAt = Date.now();
            return;
          }

          const active = state.plans.find(
            plan => plan.spaceId === spaceId && plan.status === 'active'
          );
          if (active) {
            active.updatedAt = Date.now();
          }
        });
      },

      updateTaskStatus: (taskId: string, status: StudyTask['status']) => {
        let newProgress = -1;
        let planSpaceId = '';
        let completedCount = 0;
        let totalCount = 0;
        let subjectProgress: SubjectProgressByName = {};

        set(state => {
          const task = state.tasks.find(item => item.id === taskId);
          if (!task) {
            console.log('[planStore] updateTaskStatus: task not found', { taskId, totalTasks: state.tasks.length });
            return;
          }

          task.status = status;

          const plan = state.plans.find(item => item.id === task.planId);
          if (!plan) return;

          plan.updatedAt = Date.now();
          planSpaceId = plan.spaceId;

          const planTasks = state.tasks.filter(item => item.planId === plan.id);
          completedCount = planTasks.filter(item => item.status === 'completed').length;
          totalCount = planTasks.length;
          newProgress = totalCount > 0 ? Math.round(completedCount / totalCount * 100) : 0;
          subjectProgress = calculateSubjectProgress(planTasks);

          for (const block of state.blocks.filter(item => item.planId === plan.id)) {
            if (block.type === 'summary-card') {
              block.props = applySummaryProgress(block.props, newProgress, subjectProgress);
            }

            if (block.type === 'daily-task-list') {
              block.props = applyDailyTaskListProgress(block.props, taskId, status, newProgress);
            }
          }
        });

        if (newProgress < 0 || !planSpaceId) {
          return;
        }

        try {
          const chatState = useChatStore.getState();
          if (chatState.currentSpaceId === planSpaceId) {
            useChatStore.setState({
              uiBlocks: chatState.uiBlocks.map(block => {
                if (block.type === 'summary-card') {
                  return {
                    ...block,
                    props: applySummaryProgress(block.props, newProgress, subjectProgress)
                  };
                }

                if (block.type === 'daily-task-list') {
                  return {
                    ...block,
                    props: applyDailyTaskListProgress(block.props, taskId, status, newProgress)
                  };
                }

                return block;
              })
            });
          }
        } catch {
          // Store may not be initialized in non-UI contexts.
        }

        try {
          useSpaceStore.getState().updateSpaceStats(planSpaceId, {
            overallProgress: newProgress,
            tasksCompleted: completedCount,
            tasksTotal: totalCount,
          });
        } catch {
          // Store may not be initialized in non-UI contexts.
        }
      },

      saveExecution: (record: AgentExecutionRecord) => {
        set(state => {
          const index = state.executions.findIndex(execution => execution.executionId === record.executionId);
          if (index >= 0) {
            state.executions[index] = record;
          } else {
            state.executions.push(record);
          }
        });
      },

      deletePlanBySpace: (spaceId: string) => {
        set(state => {
          const planIds = state.plans
            .filter(plan => plan.spaceId === spaceId)
            .map(plan => plan.id);

          state.plans = state.plans.filter(plan => plan.spaceId !== spaceId);
          state.tasks = state.tasks.filter(task => !planIds.includes(task.planId));
          state.blocks = state.blocks.filter(block => !planIds.includes(block.planId));
          state.executions = state.executions.filter(execution => execution.spaceId !== spaceId);
        });
      },
    })),
    {
      name: 'plan-storage',
      version: 1,
      partialize: (state) => ({
        plans: state.plans,
        tasks: state.tasks,
        blocks: state.blocks,
        executions: state.executions,
      }),
    }
  )
);
