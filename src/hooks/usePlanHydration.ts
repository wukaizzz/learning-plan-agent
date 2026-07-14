import { useEffect, useMemo, useState } from 'react';
import { useChatStore } from '@/store/chatStore';
import { usePlanStore } from '@/store/planStore';
import { hydrateUIBlocksFromPlan } from '@/utils/planBlockAdapter';
import { getLocalDateString } from '@/utils/dateUtils';
import { isPlanGenerationState } from '@/components/study-space/spacePlanStatus';
import type { UIBlock } from '@/types/uiBlocks';
import * as planPersistenceApi from '@/services/planPersistenceApi';

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
  const hydratePlanBySpace = usePlanStore(state => state.hydratePlanBySpace);
  const rolloverOverdueTasks = usePlanStore(state => state.rolloverOverdueTasks);
  const [pendingPreview, setPendingPreview] = useState<UIBlock | null>(null);

  const isActivelyStreaming =
    currentChatSpaceId === spaceId && isPlanGenerationState(workspaceState);

  useEffect(() => {
    if (!spaceId || isActivelyStreaming) return;

    let cancelled = false;
    void hydratePlanBySpace(spaceId).finally(() => {
      if (!cancelled) {
        rolloverOverdueTasks(spaceId, getLocalDateString());
      }
    });

    void planPersistenceApi.getPendingPlanChangeSet(spaceId).then(changeSet => {
      if (!cancelled) setPendingPreview(changeSet?.uiBlock || null);
    }).catch(error => {
      if (!cancelled) {
        console.warn('[usePlanHydration] Failed to hydrate pending plan change', error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [spaceId, isActivelyStreaming, hydratePlanBySpace, rolloverOverdueTasks]);

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
      const hydrated = hydrateUIBlocksFromPlan(plan, planBlocks, planTasks);
      return pendingPreview ? [...hydrated, pendingPreview] : hydrated;
    }

    return [] as UIBlock[];
  }, [spaceId, isActivelyStreaming, runtimeBlocks, plan, planBlocks, planTasks, pendingPreview]);

  const hasPlan = plan !== null && plan.status !== 'draft';

  return { uiBlocks, hasPlan };
}
