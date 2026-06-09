/**
 * 学习计划持久化 Store
 *
 * 单一写入源：所有计划、任务、Block 的持久化都通过此 store。
 * 不再新建独立 Repository 层——planStore + zustand persist 就是 v1 的 localStorage adapter。
 * 后续接 REST API 时，只需把 persist 换成调用 API 的 middleware，store 接口不变。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UIBlock } from '@/types/uiBlocks';
import type { Plan, StudyTask, PlanBlock, AgentExecutionRecord } from '@/types/plan';
import { extractPlanFromUIBlocks, hydrateUIBlocksFromPlan, PLAN_BLOCK_TYPES } from '@/utils/planBlockAdapter';

interface PlanMeta {
  sessionId?: string;
  messageId?: string;
}

export interface PlanStore {
  // ─── State ───
  plans: Plan[];
  tasks: StudyTask[];
  blocks: PlanBlock[];
  executions: AgentExecutionRecord[];

  // ─── Getters ───
  getLatestPlanBySpace: (spaceId: string) => Plan | null;
  getTasksByPlan: (planId: string) => StudyTask[];
  getBlocksByPlan: (planId: string) => PlanBlock[];
  getLatestExecutionBySpace: (spaceId: string) => AgentExecutionRecord | null;
  hydrateUIBlocks: (spaceId: string) => UIBlock[];

  // ─── Mutations ───
  /** 阶段 1：ui_block_update 到达时写入 draft plan */
  saveDraftBlocks: (spaceId: string, uiBlocks: UIBlock[], meta?: PlanMeta) => void;
  /** 阶段 2：workflow_step finalized 到达时标记 plan 为 active */
  activatePlan: (spaceId: string) => void;
  /** 更新任务状态 */
  updateTaskStatus: (taskId: string, status: StudyTask['status']) => void;
  /** 保存 AgentExecution 记录 */
  saveExecution: (record: AgentExecutionRecord) => void;
  /** 删除指定 space 的所有计划数据 */
  deletePlanBySpace: (spaceId: string) => void;
}

export const usePlanStore = create<PlanStore>()(
  persist(
    immer((set, get) => ({
      // ─── Initial State ───
      plans: [],
      tasks: [],
      blocks: [],
      executions: [],

      // ─── Getters ───

      getLatestPlanBySpace: (spaceId: string) => {
        const { plans } = get();
        return (
          plans
            .filter(p => p.spaceId === spaceId && p.status !== 'archived')
            .sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
        );
      },

      getTasksByPlan: (planId: string) => {
        return get().tasks.filter(t => t.planId === planId);
      },

      getBlocksByPlan: (planId: string) => {
        return get().blocks.filter(b => b.planId === planId);
      },

      getLatestExecutionBySpace: (spaceId: string) => {
        const { executions } = get();
        return (
          executions
            .filter(e => e.spaceId === spaceId)
            .sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
        );
      },

      hydrateUIBlocks: (spaceId: string) => {
        const plan = get().getLatestPlanBySpace(spaceId);
        if (!plan) return [];
        const planTasks = get().getTasksByPlan(plan.id);
        const planBlocks = get().getBlocksByPlan(plan.id);
        return hydrateUIBlocksFromPlan(plan, planBlocks, planTasks);
      },

      // ─── Mutations ───

      /**
       * 阶段 1：每个 ui_block_update 到达时调用
       * 如果对应 space 已有 draft plan，追加/更新 blocks
       * 如果没有，创建新的 draft plan
       */
      saveDraftBlocks: (spaceId: string, uiBlocks: UIBlock[], meta?: PlanMeta) => {
        // 只处理计划相关 blocks
        const planBlocks = uiBlocks.filter(b => PLAN_BLOCK_TYPES.has(b.type));
        if (planBlocks.length === 0) return;

        const extracted = extractPlanFromUIBlocks(spaceId, planBlocks, meta);
        if (!extracted) return;

        set(state => {
          // 将已有的 draft plan 归档
          const existingDraft = state.plans.find(
            p => p.spaceId === spaceId && p.status === 'draft'
          );

          if (existingDraft) {
            // 更新现有 draft：替换 tasks 和 blocks
            state.tasks = state.tasks.filter(t => t.planId !== existingDraft.id);
            state.blocks = state.blocks.filter(b => b.planId !== existingDraft.id);

            existingDraft.updatedAt = Date.now();
            existingDraft.title = extracted.plan.title;
            if (meta?.sessionId) existingDraft.sourceSessionId = meta.sessionId;
            if (meta?.messageId) existingDraft.sourceMessageId = meta.messageId;

            // 将新数据关联到现有 plan id
            const newTasks = extracted.tasks.map(t => ({ ...t, planId: existingDraft.id }));
            const newBlocks = extracted.blocks.map(b => ({ ...b, planId: existingDraft.id }));
            state.tasks.push(...newTasks);
            state.blocks.push(...newBlocks);
          } else {
            // 归档旧的 active plan
            const oldActive = state.plans.find(
              p => p.spaceId === spaceId && p.status === 'active'
            );
            if (oldActive) {
              oldActive.status = 'archived';
              oldActive.updatedAt = Date.now();
            }

            // 创建新的 draft plan
            state.plans.push(extracted.plan);
            state.tasks.push(...extracted.tasks);
            state.blocks.push(...extracted.blocks);
          }
        });
      },

      /**
       * 阶段 2：收到 workflow_step finalized 时调用
       * 将对应 space 的最新 draft plan 标记为 active
       */
      activatePlan: (spaceId: string) => {
        set(state => {
          const draft = state.plans.find(
            p => p.spaceId === spaceId && p.status === 'draft'
          );
          if (draft) {
            draft.status = 'active';
            draft.updatedAt = Date.now();
          } else {
            // 没有 draft，检查是否已有 active plan（可能是旧数据恢复的）
            const active = state.plans.find(
              p => p.spaceId === spaceId && p.status === 'active'
            );
            if (active) {
              active.updatedAt = Date.now();
            }
          }
        });
      },

      updateTaskStatus: (taskId: string, status: StudyTask['status']) => {
        set(state => {
          const task = state.tasks.find(t => t.id === taskId);
          if (task) {
            task.status = status;
            // 同时更新 plan 的 updatedAt
            const plan = state.plans.find(p => p.id === task.planId);
            if (plan) {
              plan.updatedAt = Date.now();
            }
          }
        });
      },

      saveExecution: (record: AgentExecutionRecord) => {
        set(state => {
          const idx = state.executions.findIndex(e => e.executionId === record.executionId);
          if (idx >= 0) {
            state.executions[idx] = record;
          } else {
            state.executions.push(record);
          }
        });
      },

      deletePlanBySpace: (spaceId: string) => {
        set(state => {
          const planIds = state.plans
            .filter(p => p.spaceId === spaceId)
            .map(p => p.id);

          state.plans = state.plans.filter(p => p.spaceId !== spaceId);
          state.tasks = state.tasks.filter(t => !planIds.includes(t.planId));
          state.blocks = state.blocks.filter(b => !planIds.includes(b.planId));
          state.executions = state.executions.filter(e => e.spaceId !== spaceId);
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
