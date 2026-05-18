// 导入UIBlock类型
import type { UIBlock } from './uiBlocks';
import type { WorkspaceState } from './uiBlocks';
import type { WorkflowEvent } from './workflowEvents';
// Chat message types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tool_calls?: ToolCall[];
  ui_blocks?: UIBlock[];
  submitted_form_summary?: SubmittedFormSummaryItem[];
  form_submission_state?: 'idle' | 'submitting' | 'submitted';
  workflow_process_steps?: WorkflowProcessStep[];
  workflow_events?: WorkflowEvent[]; // 🆕 该消息关联的工作流事件
}

export interface ToolCall {
  id: string;
  tool_name: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface SubmittedFormSummaryItem {
  label: string;
  value: string;
}

export interface WorkflowProcessStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface ChatSession {
  id: string;
  spaceId: string | null; // 关联的学习空间ID，null表示通用会话
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  draftMessage: string; // ChatInput输入框草稿
  scrollPosition: number; // 🆕 保存滚动位置
}

export interface ChatStore {
  messages: Message[];
  currentAgentId: string | null;
  isStreaming: boolean;
  currentSessionId: string | null;
  currentSpaceId: string | null; // 当前关联的学习空间ID
  workspaceState: WorkspaceState; // 🆕 工作流状态
  uiBlocks: UIBlock[]; // 🆕 当前显示的 UI Blocks
  sessions: ChatSession[];
  activeFormStep: number; // 🆕 当前激活的表单步骤索引
  formStepsData: Record<number, Record<string, any>>; // 🆕 已提交的表单数据
  workflowInterrupted: boolean; // 🆕 工作流是否中断
  lastFormStep: number | null; // 🆕 中断时的表单步骤
  currentWorkflowEvents: WorkflowEvent[]; // 🆕 当前消息的工作流事件

  // Actions
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setCurrentAgent: (agentId: string | null) => void;
  setStreaming: (isStreaming: boolean) => void;
  updateToolCall: (toolCallId: string, updates: Partial<ToolCall>) => void;
  updateMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  addToolCall: (messageId: string, toolCall: ToolCall) => void;
  updateLastAssistantMessage: (content: string) => void;
  addUIBlockToMessage: (messageId: string, block: UIBlock) => void;
  addUIBlockToLastAssistantMessage: (block: UIBlock) => void;
  markLatestCollectionFormSubmitting: () => void;
  markLatestCollectionFormSubmitted: (summary: SubmittedFormSummaryItem[]) => void;
  resetLatestCollectionFormSubmissionState: () => void;
  initializeLatestWorkflowProcessSteps: (steps: WorkflowProcessStep[]) => void;
  updateLatestWorkflowProcessStep: (stepId: string, status: WorkflowProcessStep['status']) => void;

  // Session management
  createNewSession: (title?: string, spaceId?: string | null) => string;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  getAllSessions: () => ChatSession[];
  getSessionsBySpace: (spaceId: string) => ChatSession[]; // 获取特定空间的会话

  // Space management
  setCurrentSpace: (spaceId: string | null) => void; // 切换当前空间
  switchToSpaceSession: (spaceId: string) => void; // 切换到特定空间的最新会话

  // 🆕 Workflow and Block management
  setWorkspaceState: (state: WorkspaceState) => void; // 设置工作流状态
  setUIBlocks: (blocks: UIBlock[]) => void; // 设置当前显示的 UI Blocks
  addUIBlock: (block: UIBlock) => void; // 添加单个UI Block
  clearUIBlocks: () => void; // 清除所有UI Blocks
  getWorkspaceState: () => WorkspaceState; // 获取当前工作流状态

  // 🆕 Multi-form collection management
  setActiveFormStep: (step: number) => void; // 设置当前激活的表单步骤
  submitFormStep: (stepIndex: number, data: Record<string, any>) => void; // 提交表单步骤
  markWorkflowInterrupted: (step: number) => void; // 标记工作流中断
  resetFormCollection: () => void; // 重置表单收集状态
  isFormCollectionComplete: () => boolean; // 检查所有表单是否完成

  //  Draft management
  setSessionDraft: (sessionId: string, draft: string) => void;
  getSessionDraft: (sessionId: string) => string;
  clearSessionDraft: (sessionId: string) => void;

  // 🆕 Workflow events management for current message
  setCurrentWorkflowEvents: (events: WorkflowEvent[]) => void; // 设置当前消息事件
  addWorkflowEvent: (event: WorkflowEvent) => void; // 添加事件到当前消息
  updateMessageWorkflowEvents: (messageId: string, events: WorkflowEvent[]) => void; // 更新指定消息的事件

  // 🆕 Scroll position management
  saveScrollPosition: (sessionId: string, position: number) => void;
  getScrollPosition: (sessionId: string) => number;
}
