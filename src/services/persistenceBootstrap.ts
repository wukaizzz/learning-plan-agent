import { useChatStore } from '@/store/chatStore';
import { usePlanStore } from '@/store/planStore';
import { useSpaceStore } from '@/store/spaceStore';

let bootstrapPromise: Promise<void> | null = null;

export function bootstrapSpaceChatPersistence(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    await useSpaceStore.getState().hydrateSpaces();
    await useChatStore.getState().hydrateChatSessions();

    const planSpaceIds = new Set([
      ...useSpaceStore.getState().spaces
        .filter(space => !space.isDeleted)
        .map(space => space.id),
      ...usePlanStore.getState().pendingMutations
        .map(mutation => mutation.spaceId),
    ]);
    await Promise.all(
      Array.from(planSpaceIds, spaceId => (
        usePlanStore.getState().hydratePlanBySpace(spaceId)
      ))
    );
  })().catch(error => {
    console.error('[persistenceBootstrap] Failed to initialize persistence', error);
    throw error;
  }).finally(() => {
    bootstrapPromise = null;
  });

  return bootstrapPromise;
}
