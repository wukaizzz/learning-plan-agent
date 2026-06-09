/**
 * 订阅式计划数据 hydration hook
 *
 * 修复：zustand selector 中 .filter() 每次返回新数组 → 重渲染死循环
 * 解决方案：订阅原始数组（immer 保证引用稳定），在 useMemo 中做过滤/派生
 */

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

export function usePlanHydration(spaceId: string | undefined): UsePlanHydrationResult {
  // 订阅运行时状态
  const runtimeBlocks = useChatStore(s => s.uiBlocks);
  const currentChatSpaceId = useChatStore(s => s.currentSpaceId);
  const workspaceState = useChatStore(s => s.workspaceState);

  // 订阅 planStore 的原始数组（immer 保证未变更部分的引用稳定）
  const plans = usePlanStore(s => s.plans);
  const tasks = usePlanStore(s => s.tasks);
  const blocks = usePlanStore(s => s.blocks);

  const isActivelyStreaming =
    currentChatSpaceId === spaceId && isPlanGenerationState(workspaceState);

  // 在 useMemo 中做过滤，避免 selector 每次返回新引用
  const plan = useMemo(
    () => spaceId
      ? plans.find(p => p.spaceId === spaceId && p.status !== 'archived') ?? null
      : null,
    [spaceId, plans]
  );

  const planTasks = useMemo(
    () => plan ? tasks.filter(t => t.planId === plan.id) : [],
    [plan, tasks]
  );

  const planBlocks = useMemo(
    () => plan ? blocks.filter(b => b.planId === plan.id) : [],
    [plan, blocks]
  );

  const uiBlocks = useMemo(() => {
    if (!spaceId) return [] as UIBlock[];

    // 流式运行中且有运行时 blocks → 优先返回运行时 blocks
    if (isActivelyStreaming && runtimeBlocks.length > 0) {
      return runtimeBlocks;
    }

    // 非流式 → 从 planStore hydrate
    if (plan) {
      return hydrateUIBlocksFromPlan(plan, planBlocks, planTasks);
    }

    return [] as UIBlock[];
  }, [spaceId, isActivelyStreaming, runtimeBlocks, plan, planBlocks, planTasks]);

  const hasPlan = plan !== null && plan.status !== 'draft';

  return { uiBlocks, hasPlan };
}
