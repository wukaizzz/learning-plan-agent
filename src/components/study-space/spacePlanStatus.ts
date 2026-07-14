import type { StudySpace } from '@/types/space';
import type { UIBlock, WorkspaceState } from '@/types/uiBlocks';

const GENERATED_PLAN_BLOCK_TYPES = new Set([
  'summary-card',
  'daily-task-list',
  'study-timeline'
]);

export const ACTIVE_PLAN_GENERATION_STATES: WorkspaceState[] = [
  'collecting',
  'analyzing',
  'generating',
  'reviewing'
];

type PlanAwareSpace = StudySpace & {
  planId?: string;
  hasGeneratedPlan?: boolean;
};

export function getHasGeneratedPlan(
  space: StudySpace | null | undefined,
  uiBlocks: UIBlock[] = []
) {
  const planAwareSpace = space as PlanAwareSpace | null | undefined;

  return (
    planAwareSpace?.status === 'active' ||
    Boolean(planAwareSpace?.planId) ||
    Boolean(planAwareSpace?.hasGeneratedPlan) ||
    uiBlocks.some(block => GENERATED_PLAN_BLOCK_TYPES.has(block.type))
  );
}

export function isPlanGenerationState(workspaceState: WorkspaceState) {
  return ACTIVE_PLAN_GENERATION_STATES.includes(workspaceState);
}
