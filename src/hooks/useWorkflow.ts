/**
 * useWorkflow Hook
 * 封装工作流相关的状态管理和操作
 *
 * 功能：
 * - 管理工作流状态转换
 * - 自动更新 UI Blocks
 * - 提供工作流操作方法
 * - 支持状态历史记录
 */

import { useCallback, useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { getBlocksForState, getNextState, getPreviousState } from '../core/workflow/workflowManager';
import type { WorkspaceState } from '../types/uiBlocks';
import type { UIBlock } from '../types/uiBlocks';

export interface WorkflowHistoryItem {
  state: WorkspaceState;
  timestamp: number;
  blocks: UIBlock[];
}

export interface UseWorkflowReturn {
  // 状态
  currentWorkspaceState: WorkspaceState;
  uiBlocks: UIBlock[];
  isWorkflowActive: boolean;

  // 核心操作
  transitionToState: (newState: WorkspaceState) => void;
  overrideState: (newState: WorkspaceState) => void;
  resetWorkflow: () => void;

  // 工具方法
  canTransitionTo: (state: WorkspaceState) => boolean;
  getNextState: () => WorkspaceState;
  getPreviousState: () => WorkspaceState;
  getBlocksForCurrentState: () => UIBlock[];

  // 历史记录（可选）
  workflowHistory?: WorkflowHistoryItem[];
  clearHistory?: () => void;
}

export const useWorkflow = (): UseWorkflowReturn => {
  const {
    workspaceState,
    uiBlocks,
    setWorkspaceState,
    setUIBlocks,
    currentSessionId
  } = useChatStore();

  /**
   * 转换到新的工作流状态
   * 自动获取对应的 UI Blocks 并更新状态
   */
  const transitionToState = useCallback((newState: WorkspaceState) => {
    console.log('🔄 Workflow state transition:', workspaceState, '→', newState);

    const newBlocks = getBlocksForState(newState);
    setWorkspaceState(newState);
    setUIBlocks(newBlocks);

    // 记录状态转换历史（可选）
    const historyItem: WorkflowHistoryItem = {
      state: newState,
      timestamp: Date.now(),
      blocks: newBlocks
    };

    console.log('✅ Transition completed, blocks generated:', newBlocks.length);
  }, [workspaceState, setWorkspaceState, setUIBlocks]);

  /**
   * 强制覆盖工作流状态
   * 用于用户手动干预或特殊情况
   */
  const overrideState = useCallback((newState: WorkspaceState) => {
    console.log('🔧 Workflow state override:', workspaceState, '→', newState);

    const newBlocks = getBlocksForState(newState);
    setWorkspaceState(newState);
    setUIBlocks(newBlocks);

    console.log('✅ Override completed');
  }, [workspaceState, setWorkspaceState, setUIBlocks]);

  /**
   * 重置工作流到初始状态
   */
  const resetWorkflow = useCallback(() => {
    console.log('🔄 Resetting workflow to empty state');
    setWorkspaceState('empty');
    setUIBlocks([]);
  }, [setWorkspaceState, setUIBlocks]);

  /**
   * 检查是否可以转换到指定状态
   */
  const canTransitionTo = useCallback((targetState: WorkspaceState): boolean => {
    // 基本规则：不能直接跳过太多状态
    const stateOrder: WorkspaceState[] = [
      'empty',
      'collecting',
      'analyzing',
      'generating',
      'reviewing',
      'finalized',
      'paused'
    ];

    const currentIndex = stateOrder.indexOf(workspaceState);
    const targetIndex = stateOrder.indexOf(targetState);

    // 允许相邻状态转换，或者某些特殊情况
    if (Math.abs(targetIndex - currentIndex) <= 1) {
      return true;
    }

    // 允许从任何非暂停状态转换到暂停
    if (targetState === 'paused' && workspaceState !== 'paused') {
      return true;
    }

    // 允许从暂停恢复
    if (workspaceState === 'paused' && targetState !== 'empty') {
      return true;
    }

    return false;
  }, [workspaceState]);

  /**
   * 获取下一个工作流状态
   */
  const getNextWorkflowState = useCallback((): WorkspaceState => {
    return getNextState(workspaceState);
  }, [workspaceState]);

  /**
   * 获取上一个工作流状态
   */
  const getPreviousWorkflowState = useCallback((): WorkspaceState => {
    return getPreviousState(workspaceState);
  }, [workspaceState]);

  /**
   * 获取当前状态的 UI Blocks
   */
  const getBlocksForCurrentState = useCallback((): UIBlock[] => {
    return getBlocksForState(workspaceState);
  }, [workspaceState]);

  /**
   * 工作流是否活跃（非空状态）
   */
  const isWorkflowActive = workspaceState !== 'empty';

  // 防止重复重置工作流
  const resetWorkflowRef = useRef(resetWorkflow);
  const hasResetRef = useRef(false);

  // 确保引用在 resetWorkflow 变化时更新
  useEffect(() => {
    resetWorkflowRef.current = resetWorkflow;
  }, [resetWorkflow]);

  /**
   * 当会话切换时，重置工作流状态
   */
  useEffect(() => {
    hasResetRef.current = false;

    return () => {
      if (hasResetRef.current) {
        return;
      }

      if (currentSessionId) {
        hasResetRef.current = true;
        resetWorkflowRef.current();
      }
    };
  }, [currentSessionId]);

  return {
    // 状态
    currentWorkspaceState: workspaceState,
    uiBlocks,
    isWorkflowActive,

    // 核心操作
    transitionToState,
    overrideState,
    resetWorkflow,

    // 工具方法
    canTransitionTo,
    getNextState: getNextWorkflowState,
    getPreviousState: getPreviousWorkflowState,
    getBlocksForCurrentState
  };
};
