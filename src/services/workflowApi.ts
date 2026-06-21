/**
 * LangGraph 工作流 API 服务
 * 提供与后端工作流接口的通信方法
 */

import { API_ENDPOINT } from '@/utils/constants';

// ============================================================
// 类型定义
// ============================================================

/**
 * 工作流响应
 */
export interface WorkflowResponse {
  success: boolean;
  interrupted?: boolean;
  state?: WorkflowState;
  message?: string;
  interruption?: InterruptionInfo;
  summary?: {
    totalTasks: number;
    planVersion: number;
    riskLevel: string;
  };
  error?: string;
}

/**
 * 工作流状态（后端返回的完整状态）
 */
export interface WorkflowState {
  studySpaceId: string;
  userId: string;
  goal: GoalInfo;
  subjects: SubjectInfo[];
  availability: AvailabilityInfo;
  currentPlan: CurrentPlan | null;
  tasksSnapshot: TaskSnapshot[];
  progress: ProgressInfo;
  riskAssessment: RiskAssessment;
  workflow: WorkflowStatus;
  uiBlocks: UIBlock[];
  interruption: InterruptionInfo | null;
  metadata: Metadata;
}

export interface GoalInfo {
  primaryGoal: string;
  examDate?: string;
  targetScore?: number;
  priority: number;
}

export interface SubjectInfo {
  id: string;
  name: string;
  currentLevel: number;
  targetLevel: number;
  priority: 'high' | 'medium' | 'low';
  weakPoints?: string[];
}

export interface AvailabilityInfo {
  dailyHours: number;
  preferredSlots?: string[];
  unavailableDates?: string[];
  examDistance: number;
}

export interface CurrentPlan {
  planId?: string;
  versionId: string;
  versionNumber: number;
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  createdAt: string;
  lastModifiedAt: string;
}

export interface TaskSnapshot {
  id: string;
  subjectId: string;
  title: string;
  type: 'study' | 'practice' | 'review';
  estimatedMinutes: number;
  scheduledDate: string;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  dependencies?: string[];
}

export interface ProgressInfo {
  completedTasks: number;
  totalTasks: number;
  overallCompletionRate: number;
  subjectProgress: Record<string, SubjectProgress>;
  recentWeakPoints: string[];
}

export interface SubjectProgress {
  completed: number;
  total: number;
  accuracy: number;
}

export interface RiskFactor {
  type: 'time_pressure' | 'low_accuracy' | 'falling_behind' | 'resource_overload';
  description: string;
  severity: number;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  prediction: string;
  suggestedActions: string[];
}

export interface WorkflowStatus {
  stage: 'initializing' | 'collecting_info' | 'analyzing' | 'planning' | 'reviewing' | 'replanning' | 'finalized' | 'paused';
  currentNode: string;
  history: WorkflowHistoryItem[];
}

export interface WorkflowHistoryItem {
  node: string;
  timestamp: number;
  duration: number;
}

export interface UIBlock {
  id: string;
  type: string;
  title?: string;
  props: Record<string, unknown>;
  order?: number;
  meta?: import('@/types/uiBlocks').UIBlock['meta'];
}

export interface InterruptionInfo {
  isInterrupted: boolean;
  reason?: string;
  waitingFor?: {
    field: string;
    question: string;
    type: 'text' | 'date' | 'select' | 'number';
    options?: string[];
  };
}

export interface Metadata {
  createdAt: number;
  updatedAt: number;
  lastActivityAt: number;
  totalReplans: number;
}

// ============================================================
// API 方法
// ============================================================

/**
 * 启动首次计划生成工作流
 * @param spaceId 学习空间 ID
 * @param initialState 初始状态数据
 * @returns 工作流执行结果
 */
export async function startPlanning(
  spaceId: string,
  initialState: {
    userId?: string;
    goal?: Partial<GoalInfo>;
    subjects?: SubjectInfo[];
    availability?: Partial<AvailabilityInfo>;
  }
): Promise<WorkflowResponse> {
  try {
    const response = await fetch(`${API_ENDPOINT}/workflows/spaces/${spaceId}/start-planning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(initialState),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('启动工作流失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 恢复中断的工作流
 * @param threadId 线程 ID（通常是 spaceId）
 * @param userInput 用户输入的数据
 * @returns 工作流执行结果
 */
export async function resumeWorkflow(
  threadId: string,
  userInput: Record<string, unknown>
): Promise<WorkflowResponse> {
  try {
    const response = await fetch(`${API_ENDPOINT}/workflows/${threadId}/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userInput),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('恢复工作流失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 获取当前工作流状态
 * @param threadId 线程 ID
 * @returns 当前工作流状态
 */
export async function getWorkflowState(threadId: string): Promise<WorkflowResponse> {
  try {
    const response = await fetch(`${API_ENDPOINT}/workflows/${threadId}/state`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取工作流状态失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 触发重规划工作流
 * @param spaceId 学习空间 ID
 * @param reason 重规划原因
 * @returns 重规划结果
 */
export async function triggerReplan(
  spaceId: string,
  reason?: string
): Promise<WorkflowResponse> {
  try {
    const response = await fetch(`${API_ENDPOINT}/workflows/spaces/${spaceId}/replan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('触发重规划失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 提交用户反馈
 * @param threadId 线程 ID
 * @param feedback 用户反馈内容
 * @returns 处理结果
 */
export async function submitFeedback(
  threadId: string,
  feedback: string
): Promise<WorkflowResponse> {
  try {
    const response = await fetch(`${API_ENDPOINT}/workflows/${threadId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feedback }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('提交反馈失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 将后端的工作流阶段映射到前端的 WorkspaceState
 */
export function mapWorkflowStage(stage: string): 'empty' | 'collecting' | 'analyzing' | 'generating' | 'reviewing' | 'finalized' | 'paused' {
  const stageMap: Record<string, 'empty' | 'collecting' | 'analyzing' | 'generating' | 'reviewing' | 'finalized' | 'paused'> = {
    'initializing': 'empty',
    'collecting_info': 'collecting',
    'analyzing': 'analyzing',
    'planning': 'generating',
    'reviewing': 'reviewing',
    'finalized': 'finalized',
    'replanning': 'generating',
    'paused': 'paused'
  };
  return stageMap[stage] || 'empty';
}

/**
 * 将后端的 UIBlock 转换为前端 UIBlock 格式
 */
export function transformUIBlock(block: { id: string; type: string; title?: string; props?: Record<string, unknown>; order?: number; meta?: import('@/types/uiBlocks').UIBlock['meta'] }): import('@/types/uiBlocks').UIBlock {
  return {
    id: block.id,
    type: block.type as import('@/types/uiBlocks').BlockType,
    title: block.title || '',
    props: block.props || {},
    meta: block.meta || { timestamp: Date.now() }
  };
}

export default {
  startPlanning,
  resumeWorkflow,
  getWorkflowState,
  triggerReplan,
  submitFeedback,
  mapWorkflowStage,
  transformUIBlock
};
