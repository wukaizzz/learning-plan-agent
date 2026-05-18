/**
 * useLangGraphWorkflow Hook
 * Frontend orchestration for LangGraph workflow operations.
 *
 * Responsibilities:
 * - Call backend workflow APIs
 * - Handle interrupted workflow resume
 * - Sync returned UI Blocks into chatStore
 * - Manage frontend workflow state
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
  // State
  isLoading: boolean;
  error: string | null;
  currentWorkflowState: WorkflowState | null;

  // Actions
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

  // Utilities
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
   * Apply a workflow response to frontend state.
   */
  const applyWorkflowResponse = useCallback((response: WorkflowResponse): void => {
    if (!response.success || !response.state) {
      if (response.error) {
        setError(response.error);
      }
      return;
    }

    const state = response.state;

    // Update current workflow state.
    setCurrentWorkflowState(state);

    // Map workflow stage to frontend workspace state.
    const frontendState = mapWorkflowStage(state.workflow.stage);
    setWorkspaceState(frontendState);

    // Clear existing UI Blocks.
    clearUIBlocks();

    // Add returned UI Blocks.
    if (state.uiBlocks && state.uiBlocks.length > 0) {
      const transformedBlocks = state.uiBlocks
        .map(transformUIBlock)
        .filter(block => block.type !== 'collection-form');

      // Sort by block order.
      transformedBlocks.sort((a, b) => (a.props.order || 0) - (b.props.order || 0));

      transformedBlocks.forEach(block => {
        addUIBlock(block);
      });
    }

    console.log('Workflow response applied', {
      stage: state.workflow.stage,
      uiBlocksCount: state.uiBlocks?.length || 0,
      interrupted: response.interrupted
    });
  }, [setWorkspaceState, clearUIBlocks, addUIBlock]);

  /**
   * Start a workflow.
   */
  const startWorkflow = useCallback(async (
    spaceId: string,
    initialState: {
      goal?: Partial<GoalInfo>;
      subjects?: SubjectInfo[];
      availability?: Partial<AvailabilityInfo>;
    } = {}
  ): Promise<WorkflowResponse> => {
    // Abort the previous request if one is still active.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting workflow', { spaceId, initialState });

      const response = await startPlanning(spaceId, {
        userId: 'default-user',
        ...initialState
      });

      applyWorkflowResponse(response);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to start workflow', err);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [applyWorkflowResponse]);

  /**
   * Resume an interrupted workflow and apply the response immediately.
   */
  const resume = useCallback(async (
    threadId: string,
    userInput: Record<string, any>
  ): Promise<WorkflowResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Resuming workflow', { threadId, userInput });

      const response = await resumeWorkflow(threadId, userInput);

      applyWorkflowResponse(response);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to resume workflow', err);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [applyWorkflowResponse]);

  /**
   * Resume an interrupted workflow without applying the response.
   */
  const resumeWithoutApplying = useCallback(async (
    threadId: string,
    userInput: Record<string, any>
  ): Promise<WorkflowResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Resuming workflow without applying response', { threadId, userInput });

      const response = await resumeWorkflow(threadId, userInput);

      if (!response.success && response.error) {
        setError(response.error);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to resume workflow without applying response', err);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Trigger replan.
   */
  const replan = useCallback(async (
    spaceId: string,
    reason?: string
  ): Promise<WorkflowResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Triggering replan', { spaceId, reason });

      const response = await triggerReplan(spaceId, reason);

      if (response.success && response.state) {
        applyWorkflowResponse(response);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to trigger replan', err);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [applyWorkflowResponse]);

  /**
   * Clear current error.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset local workflow state.
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setCurrentWorkflowState(null);
  }, []);

  /**
   * Abort in-flight request on unmount.
   */
  // useEffect(() => {
  //   return () => {
  //     if (abortControllerRef.current) {
  //       abortControllerRef.current.abort();
  //     }
  //   };
  // }, []);

  return {
    // State
    isLoading,
    error,
    currentWorkflowState,

    // Actions
    startWorkflow,
    resume,
    resumeWithoutApplying,
    replan,

    // Utilities
    applyWorkflowResponse,
    clearError,
    reset
  };
};

export default useLangGraphWorkflow;
