/**
 * useLangGraphWorkflow Hook
 * 灏佽 LangGraph 宸ヤ綔娴佺殑鍓嶇鎿嶄綔閫昏緫
 *
 * 鍔熻兘锛?
 * - 璋冪敤鍚庣宸ヤ綔娴?API
 * - 澶勭悊宸ヤ綔娴佷腑鏂?鎭㈠
 * - 灏嗚繑鍥炵殑 UI Blocks 鏇存柊鍒?chatStore
 * - 绠＄悊宸ヤ綔娴佺姸鎬?
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
  // 鐘舵€?
  isLoading: boolean;
  error: string | null;
  currentWorkflowState: WorkflowState | null;

  // 鎿嶄綔鏂规硶
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

  resumeWithoutApplying: (
    threadId: string,
    userInput: Record<string, any>
  ) => Promise<WorkflowResponse>;

  replan: (
    spaceId: string,
    reason?: string
  ) => Promise<WorkflowResponse>;

  // 宸ュ叿鏂规硶
  applyWorkflowResponse: (response: WorkflowResponse) => void;
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
   * 澶勭悊宸ヤ綔娴佸搷搴?
   */
  const applyWorkflowResponse = useCallback((response: WorkflowResponse): void => {
    if (!response.success || !response.state) {
      if (response.error) {
        setError(response.error);
      }
      return;
    }

    const state = response.state;

    // 鏇存柊褰撳墠宸ヤ綔娴佺姸鎬?
    setCurrentWorkflowState(state);

    // 鏄犲皠宸ヤ綔娴侀樁娈靛埌鍓嶇鐘舵€?
    const frontendState = mapWorkflowStage(state.workflow.stage);
    setWorkspaceState(frontendState);

    // 娓呯┖鐜版湁 UI Blocks
    clearUIBlocks();

    // 娣诲姞鏂扮殑 UI Blocks
    if (state.uiBlocks && state.uiBlocks.length > 0) {
      const transformedBlocks = state.uiBlocks
        .map(transformUIBlock)
        .filter(block => block.type !== 'collection-form');

      // 鎸?order 鎺掑簭
      transformedBlocks.sort((a, b) => (a.props.order || 0) - (b.props.order || 0));

      transformedBlocks.forEach(block => {
        addUIBlock(block);
      });
    }

    console.log('鉁?宸ヤ綔娴佸搷搴斿鐞嗗畬鎴?', {
      stage: state.workflow.stage,
      uiBlocksCount: state.uiBlocks?.length || 0,
      interrupted: response.interrupted
    });
  }, [setWorkspaceState, clearUIBlocks, addUIBlock]);

  /**
   * 鍚姩宸ヤ綔娴?
   */
  const startWorkflow = useCallback(async (
    spaceId: string,
    initialState: {
      goal?: Partial<GoalInfo>;
      subjects?: SubjectInfo[];
      availability?: Partial<AvailabilityInfo>;
    } = {}
  ): Promise<WorkflowResponse> => {
    // 鍙栨秷涔嬪墠鐨勮姹?
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      console.log('馃殌 鍚姩宸ヤ綔娴?', { spaceId, initialState });

      const response = await startPlanning(spaceId, {
        userId: 'default-user',
        ...initialState
      });

      applyWorkflowResponse(response);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('鉂?鍚姩宸ヤ綔娴佸け璐?', err);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [applyWorkflowResponse]);

  /**
   * 鎭㈠涓柇鐨勫伐浣滄祦
   */
  const resume = useCallback(async (
    threadId: string,
    userInput: Record<string, any>
  ): Promise<WorkflowResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('鈻讹笍 鎭㈠宸ヤ綔娴?', { threadId, userInput });

      const response = await resumeWorkflow(threadId, userInput);

      applyWorkflowResponse(response);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('鉂?鎭㈠宸ヤ綔娴佸け璐?', err);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [applyWorkflowResponse]);

  const resumeWithoutApplying = useCallback(async (
    threadId: string,
    userInput: Record<string, any>
  ): Promise<WorkflowResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('鈻讹笍 鎭㈠宸ヤ綔娴?', { threadId, userInput });

      const response = await resumeWorkflow(threadId, userInput);

      if (!response.success && response.error) {
        setError(response.error);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('鉂?鎭㈠宸ヤ綔娴佸け璐?', err);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 瑙﹀彂閲嶈鍒?
   */
  const replan = useCallback(async (
    spaceId: string,
    reason?: string
  ): Promise<WorkflowResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('馃攧 瑙﹀彂閲嶈鍒?', { spaceId, reason });

      const response = await triggerReplan(spaceId, reason);

      if (response.success && response.state) {
        applyWorkflowResponse(response);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('鉂?瑙﹀彂閲嶈鍒掑け璐?', err);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [applyWorkflowResponse]);

  /**
   * 娓呴櫎閿欒
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 閲嶇疆鐘舵€?
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setCurrentWorkflowState(null);
  }, []);

  /**
   * 缁勪欢鍗歌浇鏃跺彇娑堣姹?
   */
  // useEffect(() => {
  //   return () => {
  //     if (abortControllerRef.current) {
  //       abortControllerRef.current.abort();
  //     }
  //   };
  // }, []);

  return {
    // 鐘舵€?
    isLoading,
    error,
    currentWorkflowState,

    // 鎿嶄綔鏂规硶
    startWorkflow,
    resume,
    resumeWithoutApplying,
    replan,

    // 宸ュ叿鏂规硶
    applyWorkflowResponse,
    clearError,
    reset
  };
};

export default useLangGraphWorkflow;


