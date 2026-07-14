import type { StudySpace } from '@/types/space';

export type StudyPriority = 'high' | 'medium' | 'low';

export interface StudySpaceContext {
  goal?: {
    primaryGoal?: string;
    targetScore?: number;
    examDate?: string;
  };
  subjects?: Array<{
    id: string;
    name: string;
    currentLevel: number;
    targetLevel: number;
    priority: StudyPriority;
  }>;
  availability?: {
    dailyHours?: number;
    examDistance?: number;
  };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mapLevelToTenPointScale(value: number | undefined) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 6;
  }

  const tenPointValue = numericValue > 10 ? numericValue / 10 : numericValue;
  return Math.round(clamp(tenPointValue, 1, 10));
}

function mapWeightToPriority(weight: number | undefined): StudyPriority {
  const numericWeight = Number(weight);
  if (Number.isFinite(numericWeight)) {
    if (numericWeight >= 0.7) return 'high';
    if (numericWeight >= 0.4) return 'medium';
  }
  return 'low';
}

function formatDateOnly(value: Date | string | undefined) {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return trimmed || undefined;
  }

  if (Number.isNaN(value.getTime())) {
    return undefined;
  }

  return value.toISOString().split('T')[0];
}

function parseLocalDate(dateOnly: string) {
  const [year, month, day] = dateOnly.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function calculateExamDistance(examDate: string | undefined) {
  if (!examDate) {
    return undefined;
  }

  const target = parseLocalDate(examDate);
  if (!target || Number.isNaN(target.getTime())) {
    return undefined;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.ceil((target.getTime() - today.getTime()) / MS_PER_DAY));
}

function createSubjectId(name: string, index: number) {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, '_');
  return normalized || `subject_${index + 1}`;
}

export function mapSpaceToContext(space: StudySpace): StudySpaceContext {
  const examDate = formatDateOnly(space.goal?.examDate);
  const context: StudySpaceContext = {};

  if (space.goal) {
    context.goal = {
      primaryGoal: space.goal.primaryGoal || undefined,
      targetScore: space.goal.targetScore || undefined,
      examDate
    };
  }

  if (space.subjects?.length) {
    context.subjects = space.subjects.map((subject, index) => ({
      id: createSubjectId(subject.name, index),
      name: subject.name,
      currentLevel: mapLevelToTenPointScale(subject.currentLevel),
      targetLevel: mapLevelToTenPointScale(subject.targetLevel),
      priority: mapWeightToPriority(subject.weight)
    }));
  }

  if (space.schedule) {
    context.availability = {
      dailyHours: space.schedule.availableHoursPerDay || undefined,
      examDistance: calculateExamDistance(examDate)
    };
  }

  return context;
}
