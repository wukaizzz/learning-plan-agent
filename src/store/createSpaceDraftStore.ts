import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { CreateSpaceDraft, CreateSpaceWizardStep } from '@/types/createSpaceDraft';

const STORAGE_KEY = 'create-space-draft-storage';
const VALID_STEPS: CreateSpaceWizardStep[] = ['basic', 'goal', 'subjects', 'schedule', 'review'];

interface CreateSpaceDraftStore {
  draft: CreateSpaceDraft | null;
  saveDraft: (draft: CreateSpaceDraft) => void;
  clearDraft: () => void;
  hasDraft: () => boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isCreateSpaceDraft = (value: unknown): value is CreateSpaceDraft => {
  if (!isRecord(value) || !VALID_STEPS.includes(value.currentStep as CreateSpaceWizardStep)) {
    return false;
  }

  const formData = value.formData;
  const pendingSubject = value.pendingSubject;

  return isRecord(formData) &&
    typeof formData.name === 'string' &&
    typeof formData.description === 'string' &&
    typeof formData.color === 'string' &&
    typeof formData.primaryGoal === 'string' &&
    Array.isArray(formData.secondaryGoals) &&
    typeof formData.examDate === 'string' &&
    Array.isArray(formData.subjects) &&
    Array.isArray(formData.availableDays) &&
    Array.isArray(formData.preferredTimeSlots) &&
    Array.isArray(formData.restDays) &&
    typeof formData.startDate === 'string' &&
    typeof value.tempGoal === 'string' &&
    isRecord(pendingSubject) &&
    typeof pendingSubject.name === 'string' &&
    Array.isArray(pendingSubject.weakPoints) &&
    Array.isArray(pendingSubject.strongPoints) &&
    typeof value.updatedAt === 'number';
};

const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      const value = window.localStorage.getItem(name);
      if (!value) return null;
      JSON.parse(value);
      return value;
    } catch {
      window.localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Draft persistence is best-effort; the form remains usable in memory.
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Ignore unavailable storage so cancellation still closes the wizard.
    }
  },
};

export const useCreateSpaceDraftStore = create<CreateSpaceDraftStore>()(
  persist(
    (set, get) => ({
      draft: null,
      saveDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
      hasDraft: () => get().draft !== null,
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      migrate: (persistedState) => {
        const state = isRecord(persistedState) ? persistedState : {};
        return {
          ...state,
          draft: isCreateSpaceDraft(state.draft) ? state.draft : null,
        } as CreateSpaceDraftStore;
      },
      merge: (persistedState, currentState) => {
        const state = isRecord(persistedState) ? persistedState : {};
        return {
          ...currentState,
          draft: isCreateSpaceDraft(state.draft) ? state.draft : null,
        };
      },
      partialize: (state) => ({ draft: state.draft }),
    }
  )
);
