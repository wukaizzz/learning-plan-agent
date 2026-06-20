import { create } from 'zustand';

interface PersistenceStatusState {
  isOnline: boolean;
  isRetrying: boolean;
  lastSyncedAt: number | null;
  setOnline: (isOnline: boolean) => void;
  setRetrying: (isRetrying: boolean) => void;
  markSynced: () => void;
}

export const usePersistenceStatusStore = create<PersistenceStatusState>(set => ({
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  isRetrying: false,
  lastSyncedAt: null,
  setOnline: isOnline => set({ isOnline }),
  setRetrying: isRetrying => set({ isRetrying }),
  markSynced: () => set({ lastSyncedAt: Date.now() }),
}));
