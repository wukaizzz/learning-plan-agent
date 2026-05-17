/**
 * useLangGraphWorkflow Hook
 * 封装 LangGraph 工作流的前端操作逻辑
 *
 * 功能：
 * - 调用后端工作流 API
 * - 处理工作流中断/恢复
 * - 将返回的 UI Blocks 更新到 chatStore
 * - 管理工作流状态
 */

import { useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import {
  startPlanning,
  resumeWorkflow,
  triggerReplan,
  mapWorkflowStage,
  transformUIBlock,
  type WorkflowState,
  type WorkflowResponse,
  type GoalInfo,
  type SubjectInfo,
  type AvailabilityInfo
} from '@/services/workflowApi';

export interface UseLangGraphWorkflowReturn {
  // 状态
  isLoading: boolean;
  error: string | null;
  currentWorkflowState: WorkflowState | null;

  // 操作方法
  startWorkflow: (
    spaceId: string,
    initialState?: {
      goal?: Partial<GoalInfo>;
      subjects?: SubjectInfo[];
      availability?: Partial<AvailabilityInfo>;
    }
  ) => Promise<WorkflowResponse>;

  resume: (
    threadId: string,
    userInput: Record<string, any>
  ) => Promise<WorkflowResponse>;

  replan: (
    spaceId: string,
    reason?: string
  ) => Promise<WorkflowResponse>;

  // 工具方法
  clearError: () => void;
  reset: () => void;
}

export const useLangGraphWorkflow = (): UseLangGraphWorkflowReturn => {
  const {
    setWorkspaceState,
    addUIBlock,
    clearUIBlocks
  } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWorkflowState, setCurrentWorkflowState] = useState<WorkflowState | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 处理工作流响应
   */
  const handleWorkflowResponse = useCallback((response: WorkflowResponse): void => {
    if (!response.success || !response.state) {
      if (response.error) {
        setError(response.error);
      }
      return;
    }

    const state = response.state;

    // 更新当前工作流状态
    setCurrentWorkflowState(state);

    // 映射工作流阶段到前端状态
    const frontendState = mapWorkflowStage(state.workflow.stage);
    setWorkspaceState(frontendState);

    // 清空现有 UI Blocks
    clearUIBlocks();

    // 添加新的 UI Blocks
    if (state.uiBlocks && state.uiBlocks.length > 0) {
      const transformedBlocks = state.uiBlocks.map(transformUIBlock);

      // 按 order 排序
      transformedBlocks.sort((a, b) => (a.props.order || 0) - (b.props.order || 0));

      transformedBlocks.forEach(block => {
        addUIBlock(block);
      });
    }

    console.log('✅ 工作流响应处理完成:', {
      stage: state.workflow.stage,
      uiBlocksCount: state.uiBlocks?.length || 0,
      interrupted: response.interrupted
    });
  }, [setWorkspaceState, clearUIBlocks, addUIBlock]);

  /**
   * 启动工作流
   */
  const startWorkflow = useCallback(async (
    spaceId: string,
    initialState: {
      goal?: Partial<GoalInfo>;
      subjects?: SubjectInfo[];
      availability?: Partial<AvailabilityInfo>;
    } = {}
  ): Promise<WorkflowResponse> => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 启动工作流:', { spaceId, initialState });

      const response = await startPlanning(spaceId, {
        userId: 'default-user',
        ...initialState
      });

      handleWorkflowResponse(response);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ 启动工作流失败:', err);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [handleWorkflowResponse]);

  /**
   * 恢复中断的工作流
   */
  const resume = useCallback(async (
    threadId: string,
    userInput: Record<string, any>
  ): Promise<WorkflowResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('▶️ 恢复工作流:', { threadId, userInput });

      const response = await resumeWorkflow(threadId, userInput);

      handleWorkflowResponse(response);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ 恢复工作流失败:', err);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [handleWorkflowResponse]);

  /**
   * 触发重规划
   */
  const replan = useCallback(async (
    spaceId: string,
    reason?: string
  ): Promise<WorkflowResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 触发重规划:', { spaceId, reason });

      const response = await triggerReplan(spaceId, reason);

      if (response.success && response.state) {
        handleWorkflowResponse(response);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ 触发重规划失败:', err);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [handleWorkflowResponse]);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setCurrentWorkflowState(null);
  }, []);

  /**
   * 组件卸载时取消请求
   */
  // useEffect(() => {
  //   return () => {
  //     if (abortControllerRef.current) {
  //       abortControllerRef.current.abort();
  //     }
  //   };
  // }, []);

  return {
    // 状态
    isLoading,
    error,
    currentWorkflowState,

    // 操作方法
    startWorkflow,
    resume,
    replan,

    // 工具方法
    clearError,
    reset
  };
};

export default useLangGraphWorkflow;
