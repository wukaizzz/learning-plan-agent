/**
 * 学习计划持久化领域模型
 *
 * 设计原则：
 * - 后端 REST API 可直接复用这些类型
 * - StudyTask 是前端持久化归一化形态，不替换 DailyTaskItem / TaskSnapshot
 * - DailyScheduleGroup 不持久化——是 StudyTask[] 按 scheduledDate 分组的派生数据
 */

import type { BlockType } from './uiBlocks';
import type { AgentExecutionState } from './chat';

// ============= Plan =============

export type PlanStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type StudyTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';

export interface Plan {
  id: string;
  spaceId: string;
  title: string;
  status: PlanStatus;
  version: number;
  createdAt: number;
  updatedAt: number;
  /** 溯源元数据（非核心字段，后端可不放主表） */
  sourceSessionId?: string;
  sourceMessageId?: string;
}

// ============= StudyTask =============

/**
 * 前端持久化归一化任务类型
 * 对应 REST API: GET /plans/:planId/tasks
 *
 * 不替换现有 DailyTaskItem（UI 渲染用）和 TaskSnapshot（后端 API 用）
 * planBlockAdapter 负责三者之间的转换
 */
export interface StudyTask {
  id: string;
  planId: string;
  subject: string;
  title: string;
  type: 'study' | 'practice' | 'review';
  priority: 'high' | 'medium' | 'low';
  status: StudyTaskStatus;
  estimatedMinutes: number;
  /** ISO date string "2026-06-10"，用于分组和重建 scheduleGroups */
  scheduledDate: string;
  /** 显示标签 "第1天" / "Week 1" 等 */
  groupLabel?: string;
  /** 同一 scheduledDate 内的排序 */
  order: number;
  /** 显示用时间范围 "10:00-12:00" */
  estimatedTime?: string;
  /** 依赖的 task ID */
  dependencies?: string[];
}

// ============= PlanBlock =============

/**
 * 归一化 UIBlock 持久化形态
 *
 * - task-heavy blocks（daily-task-list）: taskIds 引用 StudyTask，props 只存标量
 * - 其他 blocks: props 存完整内容
 * 渲染前由 planBlockAdapter.hydrateUIBlocksFromPlan 重建完整 UIBlock
 */
export interface PlanBlock {
  id: string;
  planId: string;
  type: BlockType;
  title: string;
  order: number;
  /** daily-task-list 类型存 task ID 引用 */
  taskIds?: string[];
  /**
   * 非 task-heavy blocks 存完整 props
   * task-heavy blocks 只存标量 props（date, totalDuration, completionRate 等）
   */
  props: Record<string, unknown>;
}

// ============= AgentExecutionRecord =============

/**
 * 扩展了索引字段的 AgentExecution 持久化记录
 * 独立于 Plan 存储，因为 agent execution 不专属某个计划
 */
export interface AgentExecutionRecord extends AgentExecutionState {
  spaceId: string;
  sessionId: string;
  messageId: string;
  updatedAt: number;
}

// ============= Plan Store Schema =============

/** plan-storage 的完整 localStorage schema */
export interface PlanStorageSchema {
  plans: Plan[];
  tasks: StudyTask[];
  blocks: PlanBlock[];
  executions: AgentExecutionRecord[];
  version: number;
}
