/**
 * Schema-Driven UI Block 类型定义
 * 用于Agent返回结构化UI，前端自动渲染对应组件
 *
 */

import { z } from 'zod';

// ============= 工作流状态定义 =============
/**
 * 学习空间规划的工作流状态
 * 每个状态决定了显示哪些UI Blocks
 */
export type WorkspaceState =
  | 'empty'           // 还没开始规划 - 显示引导和开始按钮
  | 'collecting'      // 正在收集信息 - 显示信息收集表单
  | 'analyzing'       // Agent正在分析 - 显示分析进度
  | 'generating'      // Agent正在生成计划 - 显示生成进度
  | 'reviewing'       // 用户查看结果 - 显示生成的计划和调整选项
  | 'finalized'       // 计划已确认 - 显示执行中的计划和进度
  | 'paused';         // 计划已暂停 - 显示暂停状态和恢复选项

// ============= Zod Schema 定义 (必须放在前面，因为UIBlockBaseSchema会引用) =============

/**
 * 元数据Schema
 */
const BlockMetaSchema = z.object({
  timestamp: z.number(),
  confidence: z.number().optional(),
  agent: z.string().optional(),
  version: z.string().optional()
}).optional();

/**
 * SummaryCard Props Schema
 */
export const SummaryCardPropsSchema = z.object({
  spaceName: z.string(),
  spaceDescription: z.string(),
  primaryGoal: z.string(),
  targetScore: z.number(),
  currentScore: z.number().optional(),
  examDate: z.string(),
  daysRemaining: z.number(),
  overallProgress: z.number(),
  subjects: z.array(z.object({
    name: z.string(),
    progress: z.number(),
    targetLevel: z.number()
  }))
});

/**
 * DailyTaskList Props Schema
 */
const DailyTaskItemSchema = z.object({
  id: z.string(),
  subject: z.string(),
  task: z.string(),
  duration: z.number(),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped', 'failed']),
  estimatedTime: z.string().optional(),
  scheduledDate: z.string().optional(),
  groupLabel: z.string().optional()
});

const DailyScheduleGroupSchema = z.object({
  date: z.string(),
  label: z.string(),
  tasks: z.array(DailyTaskItemSchema)
});

export const DailyTaskListPropsSchema = z.object({
  date: z.string(),
  tasks: z.array(DailyTaskItemSchema),
  totalTaskCount: z.number().optional(),
  displayedTaskCount: z.number().optional(),
  scheduleGroups: z.array(DailyScheduleGroupSchema).optional(),
  totalDuration: z.number(),
  completionRate: z.number()
});

/**
 * StudyTimeline Props Schema
 */
export const StudyTimelinePropsSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  events: z.array(z.object({
    date: z.string(),
    title: z.string(),
    type: z.enum(['milestone', 'exam', 'rest', 'study_session']),
    importance: z.enum(['high', 'medium', 'low']).optional()
  }))
});

/**
 * ProgressBar Props Schema
 */
export const ProgressBarPropsSchema = z.object({
  label: z.string(),
  progress: z.number().min(0).max(100),
  total: z.number().optional(),
  unit: z.string().optional(),
  color: z.string().optional(),
  showPercentage: z.boolean().optional()
});

/**
 * RiskAlert Props Schema
 */
export const RiskAlertPropsSchema = z.object({
  risks: z.array(z.object({
    type: z.enum(['behind_schedule', 'time_pressure', 'low_performance', 'conflict']),
    severity: z.enum(['high', 'medium', 'low']),
    message: z.string(),
    suggestion: z.string().optional()
  }))
});

/**
 * ActionBar Props Schema
 */
export const ActionBarPropsSchema = z.object({
  actions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(['primary', 'secondary', 'danger']),
    icon: z.string().optional(),
    onClick: z.function().optional(), // 函数类型特殊处理
    disabled: z.boolean().optional()
  }))
});

/**
 * ToolCallStatus Props Schema
 */
export const ToolCallStatusPropsSchema = z.object({
  currentStep: z.string(),
  steps: z.array(z.object({
    name: z.string(),
    status: z.enum(['pending', 'running', 'completed', 'failed']),
    message: z.string().optional(),
    result: z.any().optional() // 允许任意类型的result
  }))
});

/**
 * CollectionForm Props Schema
 */
export const CollectionFormPropsSchema = z.object({
  stage: z.enum(['initial', 'details', 'confirmation']),
  fields: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(['text', 'number', 'date', 'select', 'textarea']),
    value: z.any().optional(),
    placeholder: z.string().optional(),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional(),
    validation: z.function().optional()
  })),
  stepIndex: z.number().optional(),
  totalSteps: z.number().optional(),
  showProgress: z.boolean().optional()
});

/**
 * GeneratingSkeleton Props Schema
 */
export const GeneratingSkeletonPropsSchema = z.object({
  message: z.string(),
  progress: z.number().min(0).max(100).optional(),
  steps: z.array(z.object({
    name: z.string(),
    status: z.enum(['pending', 'running', 'completed'])
  })).optional()
});

/**
 * WorkflowIndicator Props Schema
 */
export const WorkflowIndicatorPropsSchema = z.object({
  currentState: z.enum(['empty', 'collecting', 'analyzing', 'generating', 'reviewing', 'finalized', 'paused']),
  currentStep: z.string().optional(),
  steps: z.array(z.object({
    state: z.enum(['empty', 'collecting', 'analyzing', 'generating', 'reviewing', 'finalized', 'paused']),
    label: z.string(),
    icon: z.string().optional(),
    completed: z.boolean().optional()
  }))
});

export const PlanChangePreviewPropsSchema = z.object({
  changeSetId: z.string(),
  sourcePlanId: z.string(),
  sourcePlanVersion: z.number(),
  expiresAt: z.number(),
  reason: z.string(),
  canApply: z.boolean(),
  changes: z.array(z.object({
    taskId: z.string(),
    title: z.string(),
    fromDate: z.string(),
    toDate: z.string(),
    estimatedMinutes: z.number(),
    statusBefore: z.string(),
    statusAfter: z.string()
  })),
  impact: z.object({
    selectedTaskCount: z.number(),
    movedTaskCount: z.number(),
    affectedDates: z.array(z.string()),
    affectedMinutes: z.number()
  }),
  unscheduled: z.array(z.object({
    taskId: z.string(),
    title: z.string(),
    reason: z.string()
  })),
  command: z.literal('apply_plan_change_set')
});

/**
 * 🆕 UIBlock 判别联合类型 Schema (类型安全版本)
 *
 * 使用判别联合 (discriminated union) 确保 type 和 props 的类型匹配
 *
 * ✅ 优势：
 * 1. 根据 type 字段自动验证 props 结构
 * 2. TypeScript 能根据 type 推断出正确的 props 类型
 * 3. Agent 输出错误数据时能立即捕获
 * 4. IDE 自动补全和类型提示
 *
 * @example
 * // ✅ 正确示例 - props 匹配 type
 * const validBlock = {
 *   id: 'block_1',
 *   type: 'summary-card',
 *   title: '学习概况',
 *   props: { spaceName: '数学', targetScore: 85, ... },
 *   meta: { timestamp: Date.now() }
 * };
 *
 * // ❌ 错误示例 - props 不匹配 type
 * const invalidBlock = {
 *   id: 'block_2',
 *   type: 'summary-card',  // type 是 summary-card
 *   title: '学习概况',
 *   props: { date: '2026-04-27', tasks: [] },  // 🔴 但 props 是 DailyTaskList 的结构
 * };
 * // Zod 验证会立即失败！
 */
export const UIBlockBaseSchema = z.union([
  // SummaryCard Block
  z.object({
    id: z.string(),
    type: z.literal('summary-card'),
    title: z.string(),
    props: SummaryCardPropsSchema,
    meta: BlockMetaSchema
  }),

  // DailyTaskList Block
  z.object({
    id: z.string(),
    type: z.literal('daily-task-list'),
    title: z.string(),
    props: DailyTaskListPropsSchema,
    meta: BlockMetaSchema
  }),

  // StudyTimeline Block
  z.object({
    id: z.string(),
    type: z.literal('study-timeline'),
    title: z.string(),
    props: StudyTimelinePropsSchema,
    meta: BlockMetaSchema
  }),

  // ProgressBar Block
  z.object({
    id: z.string(),
    type: z.literal('progress-bar'),
    title: z.string(),
    props: ProgressBarPropsSchema,
    meta: BlockMetaSchema
  }),

  // RiskAlert Block
  z.object({
    id: z.string(),
    type: z.literal('risk-alert'),
    title: z.string(),
    props: RiskAlertPropsSchema,
    meta: BlockMetaSchema
  }),

  // ActionBar Block
  z.object({
    id: z.string(),
    type: z.literal('action-bar'),
    title: z.string(),
    props: ActionBarPropsSchema,
    meta: BlockMetaSchema
  }),

  // ToolCallStatus Block
  z.object({
    id: z.string(),
    type: z.literal('tool-call-status'),
    title: z.string(),
    props: ToolCallStatusPropsSchema,
    meta: BlockMetaSchema
  }),

  // CollectionForm Block
  z.object({
    id: z.string(),
    type: z.literal('collection-form'),
    title: z.string(),
    props: CollectionFormPropsSchema,
    meta: BlockMetaSchema
  }),

  // GeneratingSkeleton Block
  z.object({
    id: z.string(),
    type: z.literal('generating-skeleton'),
    title: z.string(),
    props: GeneratingSkeletonPropsSchema,
    meta: BlockMetaSchema
  }),

  // WorkflowIndicator Block
  z.object({
    id: z.string(),
    type: z.literal('workflow-indicator'),
    title: z.string(),
    props: WorkflowIndicatorPropsSchema,
    meta: BlockMetaSchema
  }),
  z.object({
    id: z.string(),
    type: z.literal('plan-change-preview'),
    title: z.string(),
    props: PlanChangePreviewPropsSchema,
    meta: BlockMetaSchema
  })
]);

/**
 * 类型守卫：检查对象是否为UIBlock
 * 🆕 现在使用严格的判别联合验证
 */
export function isUIBlock(obj: unknown): obj is UIBlock {
  return UIBlockBaseSchema.safeParse(obj).success;
}

// ============= UI Block 核心类型 =============
/**
 * 统一的UI Block结构
 * Agent返回这个结构，前端自动渲染对应组件
 */
export interface UIBlock {
  id: string;                    // 唯一标识符
  type: BlockType;               // Block类型，决定渲染哪个组件
  title: string;                 // Block标题
  props: Record<string, unknown>;     // 组件特定属性
  meta?: {                       // 元数据
    timestamp: number;           // 创建时间
    confidence?: number;         // 置信度 0-1
    agent?: string;              // Agent标识
    version?: string;            // 版本信息
    planId?: string;             // 后端持久化计划 ID
    planVersion?: number;        // 后端持久化计划版本
    persisted?: boolean;         // 该 Block 是否已由后端写入业务表
  };
}

/**
 * 支持的UI Block类型
 */
export type BlockType =
  | 'summary-card'
  | 'daily-task-list'
  | 'study-timeline'
  | 'progress-bar'
  | 'risk-alert'
  | 'action-bar'
  | 'tool-call-status'
  | 'collection-form'
  | 'generating-skeleton'
  | 'workflow-indicator'
  | 'thinking-block'
  | 'plan-change-preview';

// ============= 各Block类型的特定Props定义 =============

/**
 * SummaryCard 专用属性
 */
export interface SummaryCardProps {
  spaceName: string;
  spaceDescription: string;
  primaryGoal: string;
  targetScore: number;
  currentScore?: number;
  examDate: string;
  daysRemaining: number;
  overallProgress: number;
  subjects: Array<{
    name: string;
    progress: number;
    targetLevel: number;
  }>;
}

/**
 * DailyTaskList 专用属性
 */
export interface DailyTaskItem {
  id: string;
  subject: string;
  task: string;
  duration: number;      // 分钟
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  estimatedTime?: string;
  scheduledDate?: string;
  groupLabel?: string;
}

export interface DailyScheduleGroup {
  date: string;
  label: string;
  tasks: DailyTaskItem[];
}

export interface DailyTaskListProps {
  date: string;
  tasks: DailyTaskItem[];
  totalTaskCount?: number;
  displayedTaskCount?: number;
  scheduleGroups?: DailyScheduleGroup[];
  totalDuration: number;
  completionRate: number;
}

/**
 * StudyTimeline 专用属性
 */
export interface StudyTimelineProps {
  startDate: string;
  endDate: string;
  events: Array<{
    date: string;
    title: string;
    type: 'milestone' | 'exam' | 'rest' | 'study_session';
    importance?: 'high' | 'medium' | 'low';
  }>;
}

/**
 * ProgressBar 专用属性
 */
export interface ProgressBarProps {
  label: string;
  progress: number;        // 0-100
  total?: number;
  unit?: string;
  color?: string;
  showPercentage?: boolean;
}

/**
 * RiskAlert 专用属性
 */
export interface RiskAlertProps {
  risks: Array<{
    type: 'behind_schedule' | 'time_pressure' | 'low_performance' | 'conflict';
    severity: 'high' | 'medium' | 'low';
    message: string;
    suggestion?: string;
  }>;
}

/**
 * ActionBar 专用属性
 */
export interface ActionBarProps {
  actions: Array<{
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'danger';
    icon?: string;
    onClick: () => void;
    disabled?: boolean;
  }>;
}

/**
 * ToolCallStatus 专用属性
 */
export interface ToolCallStatusProps {
  currentStep: string;
  steps: Array<{
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    message?: string;
    result?: unknown;
  }>;
}

/**
 * CollectionForm 专用属性
 */
export interface CollectionFormProps {
  stage: 'initial' | 'details' | 'confirmation';
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea';
    value?: unknown;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    validation?: (value: unknown) => boolean;
  }>;
  stepIndex?: number;
  totalSteps?: number;
  showProgress?: boolean;
}

/**
 * GeneratingSkeleton 专用属性
 */
export interface GeneratingSkeletonProps {
  message: string;
  progress?: number;        // 0-100
  steps?: Array<{
    name: string;
    status: 'pending' | 'running' | 'completed';
  }>;
}

/**
 * WorkflowIndicator 专用属性
 */
export interface WorkflowIndicatorProps {
  currentState: WorkspaceState;
  currentStep?: string;
  steps: Array<{
    state: WorkspaceState;
    label: string;
    icon?: string;
    completed?: boolean;
  }>;
}

// ============= Agent响应Schema =============

/**
 * Agent返回的完整响应Schema
 */
export interface AgentResponse {
  blocks: UIBlock[];
  workspaceState?: WorkspaceState;
  metadata?: {
    timestamp: number;
    agent: string;
    model: string;
    responseTime: number;
  };
}

/**
 * Agent响应的Zod Schema
 */
export const AgentResponseSchema = z.object({
  blocks: z.array(UIBlockBaseSchema),
  workspaceState: z.enum([
    'empty',
    'collecting',
    'analyzing',
    'generating',
    'reviewing',
    'finalized',
    'paused'
  ]).optional(),
  metadata: z.object({
    timestamp: z.number(),
    agent: z.string(),
    model: z.string(),
    responseTime: z.number()
  }).optional()
});

// ============= 工具函数 =============

/**
 * 创建基础的UIBlock结构
 */
export function createBlock(
  type: BlockType,
  title: string,
  props: Record<string, unknown>,
  meta?: { timestamp?: number; confidence?: number; agent?: string }
): UIBlock {
  return {
    id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    type,
    title,
    props,
    meta: {
      timestamp: Date.now(),
      ...meta
    }
  };
}

/**
 * 验证Agent响应是否符合Schema
 * 🆕 使用严格的判别联合验证
 */
export function validateAgentResponse(response: unknown): {
  success: boolean;
  data?: AgentResponse;
  error?: z.ZodError;
} {
  const result = AgentResponseSchema.safeParse(response);

  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  } else {
    return {
      success: false,
      error: result.error
    };
  }
}

/**
 * 获取Block的显示组件（用于Registry）
 */
export function getBlockComponentType(block: UIBlock): BlockType {
  return block.type;
}
