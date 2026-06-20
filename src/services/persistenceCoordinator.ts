import { useChatStore } from '@/store/chatStore';
import { usePlanStore } from '@/store/planStore';
import { useSpaceStore } from '@/store/spaceStore';
import { usePersistenceStatusStore } from '@/store/persistenceStatusStore';

const BACKGROUND_RETRY_DELAY_MS = 30000;

let started = false;
let retryTimer: number | null = null;
let flushPromise: Promise<void> | null = null;
let cleanupSubscriptions: Array<() => void> = [];
let previousPendingCount = 0;

function getPendingCount() {
  return useSpaceStore.getState().pendingMutations.length +
    useChatStore.getState().pendingMutations.length +
    usePlanStore.getState().pendingMutations.length;
}

function hasRetryableIssue() {
  return [
    ...Object.values(useSpaceStore.getState().syncErrorBySpace),
    ...Object.values(useChatStore.getState().syncErrorBySession),
    ...Object.values(usePlanStore.getState().syncErrorBySpace),
  ].some(issue => issue?.retryable);
}

function scheduleBackgroundRetry() {
  if (
    retryTimer ||
    !usePersistenceStatusStore.getState().isOnline ||
    !hasRetryableIssue()
  ) {
    return;
  }

  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    void flushAllPersistence();
  }, BACKGROUND_RETRY_DELAY_MS);
}

function handleStoreChange() {
  const pendingCount = getPendingCount();
  if (previousPendingCount > 0 && pendingCount === 0) {
    usePersistenceStatusStore.getState().markSynced();
  }
  previousPendingCount = pendingCount;
  scheduleBackgroundRetry();
}

export function flushAllPersistence(): Promise<void> {
  if (flushPromise) return flushPromise;
  if (!usePersistenceStatusStore.getState().isOnline) {
    return Promise.resolve();
  }

  flushPromise = (async () => {
    usePersistenceStatusStore.getState().setRetrying(true);

    await useSpaceStore.getState().flushSpaceSync();
    await useChatStore.getState().flushChatSync();

    const planSpaceIds = new Set(
      usePlanStore.getState().pendingMutations.map(mutation => mutation.spaceId)
    );
    await Promise.all(
      Array.from(planSpaceIds, spaceId => (
        usePlanStore.getState().flushPlanSync(spaceId)
      ))
    );

    if (getPendingCount() === 0) {
      usePersistenceStatusStore.getState().markSynced();
    } else {
      scheduleBackgroundRetry();
    }
  })().finally(() => {
    usePersistenceStatusStore.getState().setRetrying(false);
    flushPromise = null;
  });

  return flushPromise;
}

export function startPersistenceCoordinator() {
  if (started || typeof window === 'undefined') return () => {};
  started = true;

  const handleOnline = () => {
    usePersistenceStatusStore.getState().setOnline(true);
    void flushAllPersistence();
  };
  const handleOffline = () => {
    usePersistenceStatusStore.getState().setOnline(false);
    if (retryTimer) window.clearTimeout(retryTimer);
    retryTimer = null;
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  cleanupSubscriptions = [
    useSpaceStore.subscribe(handleStoreChange),
    useChatStore.subscribe(handleStoreChange),
    usePlanStore.subscribe(handleStoreChange),
  ];

  previousPendingCount = getPendingCount();
  scheduleBackgroundRetry();

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    cleanupSubscriptions.forEach(unsubscribe => unsubscribe());
    cleanupSubscriptions = [];
    if (retryTimer) window.clearTimeout(retryTimer);
    retryTimer = null;
    started = false;
  };
}
