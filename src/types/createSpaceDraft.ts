import type { Subject } from './space';

export type CreateSpaceWizardStep = 'basic' | 'goal' | 'subjects' | 'schedule' | 'review';

export type NumericDraftValue = number | '';

export interface CreateSpaceFormData {
  name: string;
  description: string;
  color: string;
  primaryGoal: string;
  secondaryGoals: string[];
  examDate: string;
  targetScore: NumericDraftValue;
  subjects: Subject[];
  availableHoursPerDay: NumericDraftValue;
  availableDays: string[];
  preferredTimeSlots: string[];
  restDays: string[];
  startDate: string;
}

export interface PendingSubjectDraft {
  name: string;
  currentLevel: NumericDraftValue;
  targetLevel: NumericDraftValue;
  weight: NumericDraftValue;
  weakPoints: string[];
  strongPoints: string[];
}

export interface CreateSpaceDraft {
  currentStep: CreateSpaceWizardStep;
  formData: CreateSpaceFormData;
  tempGoal: string;
  pendingSubject: PendingSubjectDraft;
  updatedAt: number;
}
