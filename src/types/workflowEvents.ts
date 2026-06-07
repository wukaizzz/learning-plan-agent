/**
 * 工作流事件类型定义
 * 用于后端SSE推送工作流状态变化
 */

import type { UIBlock } from './uiBlocks';

export interface WorkflowEventMeta {
  runId?: string;
  messageId?: string;
  stepId?: string;
  timestamp?: number;
}

// 思考过程事件（R1 reasoning_content 或模拟思考）
export interface ThinkingEvent extends WorkflowEventMeta {
  type: 'thinking';
  content: string;
}

// 思考结束事件
export interface ThinkingEndEvent extends WorkflowEventMeta {
  type: 'thinking_end';
  duration: number;
}

// 工作流步骤事件
export interface WorkflowStepEvent extends WorkflowEventMeta {
  type: 'workflow_step';
  step: 'collecting' | 'analyzing' | 'generating' | 'reviewing' | 'finalized' | 'paused';
  message?: string;
  progress?: number; // 0-100
}

// 信息收集事件
export interface InfoNeededEvent extends WorkflowEventMeta {
  type: 'info_needed';
  fieldName: string;
  question: string;
  fieldType: 'text' | 'date' | 'number' | 'select' | 'multiline';
  options?: string[]; // 用于select类型
  required: boolean;
}

// 工具调用事件
export interface ToolCallEvent extends WorkflowEventMeta {
  type: 'tool_call';
  toolName: string;
  parameters: Record<string, unknown>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

// UI Block更新事件
export interface UIBlockUpdateEvent extends WorkflowEventMeta {
  type: 'ui_block_update';
  action: 'add' | 'update' | 'remove';
  block?: UIBlock;
  blockId?: string;
}

// 处理进度事件
export interface ProcessingEvent extends WorkflowEventMeta {
  type: 'processing';
  stage: string;
  details?: string;
  progress?: number;
}

export interface IntentRoutedEvent extends WorkflowEventMeta {
  type: 'intent_routed';
  payload: {
    intent: 'general_chat' | 'initial_planning' | 'tool_assisted_answer' | 'query_plan' | 'adjust_plan' | 'replan' | 'explain_plan' | 'progress_next_step' | 'clarification' | 'unknown';
    confidence: number;
    source: 'llm' | 'rule_fallback';
    certainty: 'high' | 'medium' | 'low';
    message: string;
  };
}

// 分析结果事件
export interface AnalysisResultEvent extends WorkflowEventMeta {
  type: 'analysis_result';
  summary: string;
  findings: string[];
  recommendations?: string[];
}

// Agent Execution 事件
export interface AgentExecutionStartEvent extends WorkflowEventMeta {
  type: 'agent_execution_start';
  executionId: string;
  title: string;
  executionType?: 'fixed_workflow' | 'autonomous_agent';
  steps: Array<{ stepId: string; title: string }>;
  metadata?: Record<string, unknown>;
}

export interface AgentStepUpdateEvent extends WorkflowEventMeta {
  type: 'agent_step_update';
  executionId: string;
  stepId: string;
  status: 'running' | 'completed' | 'waiting_input' | 'failed';
  title?: string;
  summary?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentExecutionFinishEvent extends WorkflowEventMeta {
  type: 'agent_execution_finish';
  executionId: string;
  status: 'completed' | 'failed' | 'cancelled';
  summary?: string;
}

// 联合类型 - 所有SSE事件
export type WorkflowEvent =
  | WorkflowStepEvent
  | InfoNeededEvent
  | ToolCallEvent
  | UIBlockUpdateEvent
  | ProcessingEvent
  | IntentRoutedEvent
  | AnalysisResultEvent
  | ThinkingEvent
  | ThinkingEndEvent
  | AgentExecutionStartEvent
  | AgentStepUpdateEvent
  | AgentExecutionFinishEvent
  | ({ type: 'content'; content: string } & WorkflowEventMeta)
  | ({ type: 'done' } & WorkflowEventMeta)
  | ({ type: 'error'; error: string } & WorkflowEventMeta);

// 后端SSE响应格式
export interface SSEChunk {
  type: string;
  [key: string]: unknown;
}

// Agent配置中的工作流定义
export interface AgentWorkflowConfig {
  enableWorkflow: boolean;
  autoTransition: boolean; // 是否自动转换工作流状态
  showProgress: boolean; // 是否显示进度
  collectInfo: boolean; // 是否自动收集信息
}
