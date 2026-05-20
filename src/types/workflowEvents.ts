/**
 * 工作流事件类型定义
 * 用于后端SSE推送工作流状态变化
 */

import type { UIBlock } from './uiBlocks';

// 思考过程事件（R1 reasoning_content 或模拟思考）
export interface ThinkingEvent {
  type: 'thinking';
  content: string;
}

// 思考结束事件
export interface ThinkingEndEvent {
  type: 'thinking_end';
  duration: number;
}

// 工作流步骤事件
export interface WorkflowStepEvent {
  type: 'workflow_step';
  step: 'collecting' | 'analyzing' | 'generating' | 'reviewing' | 'finalized' | 'paused';
  message?: string;
  progress?: number; // 0-100
}

// 信息收集事件
export interface InfoNeededEvent {
  type: 'info_needed';
  fieldName: string;
  question: string;
  fieldType: 'text' | 'date' | 'number' | 'select' | 'multiline';
  options?: string[]; // 用于select类型
  required: boolean;
}

// 工具调用事件
export interface ToolCallEvent {
  type: 'tool_call';
  toolName: string;
  parameters: Record<string, unknown>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

// UI Block更新事件
export interface UIBlockUpdateEvent {
  type: 'ui_block_update';
  action: 'add' | 'update' | 'remove';
  block?: UIBlock;
  blockId?: string;
}

// 处理进度事件
export interface ProcessingEvent {
  type: 'processing';
  stage: string;
  details?: string;
  progress?: number;
}

// 分析结果事件
export interface AnalysisResultEvent {
  type: 'analysis_result';
  summary: string;
  findings: string[];
  recommendations?: string[];
}

// 联合类型 - 所有SSE事件
export type WorkflowEvent =
  | WorkflowStepEvent
  | InfoNeededEvent
  | ToolCallEvent
  | UIBlockUpdateEvent
  | ProcessingEvent
  | AnalysisResultEvent
  | ThinkingEvent
  | ThinkingEndEvent
  | { type: 'content'; content: string }
  | { type: 'done' }
  | { type: 'error'; error: string };

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