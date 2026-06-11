import { useMemo } from 'react';
import { useChatStore } from '@/store/chatStore';
import { usePlanStore } from '@/store/planStore';
import { hydrateUIBlocksFromPlan } from '@/utils/planBlockAdapter';
import { isPlanGenerationState } from '@/components/study-space/spacePlanStatus';
import type { UIBlock } from '@/types/uiBlocks';

interface UsePlanHydrationResult {
  uiBlocks: UIBlock[];
  hasPlan: boolean;
}

const getPlanStatusRank = (status: string) => {
  if (status === 'active') return 3;
  if (status === 'draft') return 2;
  if (status === 'paused' || status === 'completed') return 1;
  return 0;
};

export function usePlanHydration(spaceId: string | undefined): UsePlanHydrationResult {
  const runtimeBlocks = useChatStore(state => state.uiBlocks);
  const currentChatSpaceId = useChatStore(state => state.currentSpaceId);
  const workspaceState = useChatStore(state => state.workspaceState);

  const plans = usePlanStore(state => state.plans);
  const tasks = usePlanStore(state => state.tasks);
  const blocks = usePlanStore(state => state.blocks);

  const isActivelyStreaming =
    currentChatSpaceId === spaceId && isPlanGenerationState(workspaceState);

  const plan = useMemo(() => {
    if (!spaceId) return null;

    return plans
      .filter(candidate => candidate.spaceId === spaceId && candidate.status !== 'archived')
      .sort((a, b) => {
        const rankDiff = getPlanStatusRank(b.status) - getPlanStatusRank(a.status);
        if (rankDiff !== 0) return rankDiff;
        return b.updatedAt - a.updatedAt;
      })[0] ?? null;
  }, [spaceId, plans]);

  const planTasks = useMemo(
    () => plan ? tasks.filter(task => task.planId === plan.id) : [],
    [plan, tasks]
  );

  const planBlocks = useMemo(
    () => plan ? blocks.filter(block => block.planId === plan.id) : [],
    [plan, blocks]
  );

  const uiBlocks = useMemo(() => {
    if (!spaceId) return [] as UIBlock[];

    if (isActivelyStreaming && runtimeBlocks.length > 0) {
      return runtimeBlocks;
    }

    if (plan) {
      return hydrateUIBlocksFromPlan(plan, planBlocks, planTasks);
    }

    return [] as UIBlock[];
  }, [spaceId, isActivelyStreaming, runtimeBlocks, plan, planBlocks, planTasks]);

  const hasPlan = plan !== null && plan.status !== 'draft';

  return { uiBlocks, hasPlan };
}
