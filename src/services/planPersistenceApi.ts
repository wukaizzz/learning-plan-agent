import type {
  AgentExecutionRecord,
  PlanBlock,
  PlanSnapshot,
  StudyTask,
  StudyTaskStatus,
  PlanChangeSetPreview,
} from '@/types/plan';
import { persistenceRequest } from '@/services/persistenceClient';

export interface DeletePlanSpaceResult {
  plans: number;
  tasks: number;
  blocks: number;
  executions: number;
}

function normalizeStringArray(value: unknown, fieldName: string): string[] {
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
    return value;
  }

  if (value !== undefined && value !== null) {
    console.error(`[planPersistenceApi] Invalid ${fieldName}; expected string[]`, value);
  }
  return [];
}

function normalizeTask(task: StudyTask): StudyTask {
  return {
    ...task,
    dependencies: normalizeStringArray(task.dependencies, 'task.dependencies'),
  };
}

function normalizeBlock(block: PlanBlock): PlanBlock {
  return {
    ...block,
    taskIds: normalizeStringArray(block.taskIds, 'block.taskIds'),
  };
}

function normalizeSnapshot(snapshot: PlanSnapshot): PlanSnapshot {
  return {
    plan: snapshot.plan,
    tasks: Array.isArray(snapshot.tasks) ? snapshot.tasks.map(normalizeTask) : [],
    blocks: Array.isArray(snapshot.blocks) ? snapshot.blocks.map(normalizeBlock) : [],
  };
}

export async function savePlanSnapshot(snapshot: PlanSnapshot): Promise<PlanSnapshot> {
  const result = await persistenceRequest<PlanSnapshot>('/plans', {
    method: 'POST',
    body: JSON.stringify(snapshot),
  });
  return normalizeSnapshot(result);
}

export async function activatePlan(planId: string): Promise<PlanSnapshot> {
  const result = await persistenceRequest<PlanSnapshot>(
    `/plans/${encodeURIComponent(planId)}/activate`,
    { method: 'PATCH' }
  );
  return normalizeSnapshot(result);
}

export async function getLatestPlanBySpace(spaceId: string): Promise<PlanSnapshot | null> {
  const result = await persistenceRequest<PlanSnapshot | null>(
    `/spaces/${encodeURIComponent(spaceId)}/plans/latest`
  );
  return result ? normalizeSnapshot(result) : null;
}

export async function getPlanById(planId: string): Promise<PlanSnapshot> {
  const result = await persistenceRequest<PlanSnapshot>(`/plans/${encodeURIComponent(planId)}`);
  return normalizeSnapshot(result);
}

export async function updateTaskStatus(
  taskId: string,
  status: StudyTaskStatus
): Promise<StudyTask> {
  const result = await persistenceRequest<StudyTask>(
    `/tasks/${encodeURIComponent(taskId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );
  return normalizeTask(result);
}

export async function saveExecution(
  spaceId: string,
  execution: AgentExecutionRecord
): Promise<AgentExecutionRecord> {
  return persistenceRequest<AgentExecutionRecord>(
    `/spaces/${encodeURIComponent(spaceId)}/executions`,
    {
      method: 'POST',
      body: JSON.stringify(execution),
    }
  );
}

export async function getLatestExecutionBySpace(
  spaceId: string
): Promise<AgentExecutionRecord | null> {
  return persistenceRequest<AgentExecutionRecord | null>(
    `/spaces/${encodeURIComponent(spaceId)}/executions/latest`
  );
}

export async function getPendingPlanChangeSet(
  spaceId: string
): Promise<PlanChangeSetPreview | null> {
  return persistenceRequest<PlanChangeSetPreview | null>(
    `/spaces/${encodeURIComponent(spaceId)}/plan-change-sets/pending`
  );
}

export async function applyPlanChangeSet(
  changeSetId: string,
  input: {
    expectedPlanId: string;
    expectedPlanVersion: number;
    idempotencyKey: string;
  }
): Promise<PlanSnapshot> {
  const result = await persistenceRequest<PlanSnapshot>(
    `/plan-change-sets/${encodeURIComponent(changeSetId)}/apply`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
  return normalizeSnapshot(result);
}

export async function rejectPlanChangeSet(changeSetId: string): Promise<void> {
  await persistenceRequest(
    `/plan-change-sets/${encodeURIComponent(changeSetId)}/reject`,
    { method: 'POST' }
  );
}

export async function deletePlansBySpace(spaceId: string): Promise<DeletePlanSpaceResult> {
  return persistenceRequest<DeletePlanSpaceResult>(
    `/spaces/${encodeURIComponent(spaceId)}/plans`,
    { method: 'DELETE' }
  );
}
