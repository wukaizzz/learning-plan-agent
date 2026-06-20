import type { StudySpace } from '@/types/space';
import type { ChatSession, ChatSessionSnapshot, Message } from '@/types/chat';
import { persistenceRequest } from '@/services/persistenceClient';

export interface RemoteSpace {
  id: string;
  name: string;
  description: string;
  color: string;
  goal: StudySpace['goal'];
  subjects: StudySpace['subjects'];
  schedule: StudySpace['schedule'];
  status: StudySpace['status'];
  currentPhase: string;
  stats: StudySpace['stats'];
  createdAt: number;
  updatedAt: number;
  lastActiveAt: number;
  isDeleted: boolean;
  deletedAt?: number;
  deletionScheduledAt?: number;
}

export interface RemoteSession {
  id: string;
  spaceId: string | null;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface LocalImportResult {
  spaces: { imported: number; updated: number; skipped: number };
  sessions: { imported: number; updated: number; skipped: number };
}

export interface PermanentDeleteResult {
  spaces: number;
  sessions: number;
  messages: number;
  plans: number;
  tasks: number;
  blocks: number;
  executions: number;
}

function dateMs(value: Date | string | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  const result = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(result) ? result : undefined;
}

function dateIso(value: Date | string | number | undefined): string | undefined {
  const timestamp = dateMs(value);
  return timestamp === undefined ? undefined : new Date(timestamp).toISOString();
}

export function serializeSpace(space: StudySpace) {
  return {
    id: space.id,
    name: space.name,
    description: space.description,
    color: space.color,
    goal: {
      ...space.goal,
      examDate: dateIso(space.goal.examDate),
    },
    subjects: space.subjects,
    schedule: {
      ...space.schedule,
      startDate: dateIso(space.schedule.startDate),
    },
    status: space.status,
    currentPhase: space.currentPhase,
    stats: space.stats,
    createdAt: dateMs(space.createdAt),
    updatedAt: dateMs(space.updatedAt),
    lastActiveAt: dateMs(space.lastActiveAt),
    isDeleted: Boolean(space.isDeleted),
    deletedAt: dateMs(space.deletedAt),
    deletionScheduledAt: dateMs(space.deletionScheduledAt),
  };
}

export function deserializeSpace(space: RemoteSpace): StudySpace {
  return {
    ...space,
    goal: {
      ...space.goal,
      examDate: new Date(space.goal.examDate),
    },
    schedule: {
      ...space.schedule,
      startDate: new Date(space.schedule.startDate),
    },
    createdAt: new Date(space.createdAt),
    updatedAt: new Date(space.updatedAt),
    lastActiveAt: new Date(space.lastActiveAt),
    deletedAt: space.deletedAt ? new Date(space.deletedAt) : undefined,
    deletionScheduledAt: space.deletionScheduledAt
      ? new Date(space.deletionScheduledAt)
      : undefined,
  };
}

export function sanitizeMessage(message: Message): Message {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
    tool_calls: message.tool_calls,
    ui_blocks: message.ui_blocks?.filter(block => block.type === 'collection-form'),
    submitted_form_summary: message.submitted_form_summary,
    form_submission_state: message.form_submission_state,
    workflow_process_steps: message.workflow_process_steps,
    thinkingActive: false,
  };
}

export function buildSessionSnapshot(session: ChatSession): ChatSessionSnapshot {
  return {
    session: {
      id: session.id,
      spaceId: session.spaceId,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
    messages: session.messages.map(sanitizeMessage),
  };
}

export function deserializeSession(session: RemoteSession): ChatSession {
  return {
    ...session,
    messages: session.messages.map(message => ({ ...message, thinkingActive: false })),
    draftMessage: '',
    scrollPosition: 0,
  };
}

export async function listSpaces(includeDeleted = true): Promise<StudySpace[]> {
  const result = await persistenceRequest<RemoteSpace[]>(
    `/study-spaces?includeDeleted=${includeDeleted ? 'true' : 'false'}`
  );
  return result.map(deserializeSpace);
}

export async function getSpace(spaceId: string): Promise<StudySpace> {
  return deserializeSpace(
    await persistenceRequest<RemoteSpace>(`/study-spaces/${encodeURIComponent(spaceId)}`)
  );
}

export async function saveSpace(space: StudySpace): Promise<StudySpace> {
  return deserializeSpace(await persistenceRequest<RemoteSpace>(
    `/study-spaces/${encodeURIComponent(space.id)}`,
    { method: 'PUT', body: JSON.stringify(serializeSpace(space)) }
  ));
}

export async function softDeleteSpace(spaceId: string): Promise<StudySpace> {
  return deserializeSpace(await persistenceRequest<RemoteSpace>(
    `/study-spaces/${encodeURIComponent(spaceId)}`,
    { method: 'DELETE' }
  ));
}

export async function restoreSpace(spaceId: string): Promise<StudySpace> {
  return deserializeSpace(await persistenceRequest<RemoteSpace>(
    `/study-spaces/${encodeURIComponent(spaceId)}/restore`,
    { method: 'POST' }
  ));
}

export async function permanentlyDeleteSpace(
  spaceId: string
): Promise<PermanentDeleteResult> {
  return persistenceRequest<PermanentDeleteResult>(
    `/study-spaces/${encodeURIComponent(spaceId)}/permanent`,
    { method: 'DELETE' }
  );
}

export async function listSessions(): Promise<ChatSession[]> {
  const result = await persistenceRequest<RemoteSession[]>('/chat-sessions');
  return result.map(deserializeSession);
}

export async function getSession(sessionId: string): Promise<ChatSession> {
  return deserializeSession(
    await persistenceRequest<RemoteSession>(`/chat-sessions/${encodeURIComponent(sessionId)}`)
  );
}

export async function saveSession(snapshot: ChatSessionSnapshot): Promise<ChatSession> {
  return deserializeSession(await persistenceRequest<RemoteSession>(
    `/chat-sessions/${encodeURIComponent(snapshot.session.id)}`,
    { method: 'PUT', body: JSON.stringify(snapshot) }
  ));
}

export async function deleteSession(sessionId: string): Promise<{ deleted: boolean }> {
  return persistenceRequest<{ deleted: boolean }>(
    `/chat-sessions/${encodeURIComponent(sessionId)}`,
    { method: 'DELETE' }
  );
}

export async function importLocalData(
  spaces: StudySpace[],
  sessions: ChatSession[]
): Promise<LocalImportResult> {
  return persistenceRequest<LocalImportResult>('/persistence/import-local-v1', {
    method: 'POST',
    body: JSON.stringify({
      studySpaces: spaces.map(serializeSpace),
      chatSessions: sessions.map(buildSessionSnapshot),
    }),
  });
}

export function getPersistenceUserId(): string {
  return import.meta.env.VITE_DEV_USER_ID?.trim() || 'default-user';
}
