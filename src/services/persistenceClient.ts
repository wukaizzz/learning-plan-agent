import { API_ENDPOINT } from '@/utils/constants';
import type {
  PersistenceSyncIssue,
  PersistenceSyncIssueKind,
} from '@/types/persistence';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: {
    message: string;
    code: string;
    details?: unknown;
  } | null;
}

const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000];
const REQUEST_TIMEOUT_MS = 10000;
const devUserId = import.meta.env.VITE_DEV_USER_ID?.trim();

export class PersistenceApiError<TDetails = unknown> extends Error {
  status?: number;
  code: string;
  details?: TDetails;
  retryable: boolean;
  kind: PersistenceSyncIssueKind;

  constructor(options: {
    message: string;
    code: string;
    status?: number;
    details?: TDetails;
    retryable: boolean;
    kind: PersistenceSyncIssueKind;
  }) {
    super(options.message);
    this.name = 'PersistenceApiError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.retryable = options.retryable;
    this.kind = options.kind;
  }
}

function classifyError(status: number | undefined, code: string) {
  if (code === 'STALE_WRITE_CONFLICT') {
    return { retryable: false, kind: 'conflict' as const };
  }
  if (code === 'SPACE_DEPENDENCY_NOT_READY') {
    return { retryable: false, kind: 'dependency' as const };
  }
  if (
    status === undefined ||
    status === 408 ||
    status === 429 ||
    status >= 500
  ) {
    return { retryable: true, kind: 'transport' as const };
  }
  return { retryable: false, kind: 'permanent' as const };
}

function wait(delayMs: number) {
  return new Promise(resolve => window.setTimeout(resolve, delayMs));
}

async function requestOnce<T>(path: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_ENDPOINT}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(devUserId ? { 'x-user-id': devUserId } : {}),
        ...init.headers,
      },
    });

    let envelope: ApiEnvelope<T>;
    try {
      envelope = await response.json() as ApiEnvelope<T>;
    } catch {
      const classification = classifyError(response.status, 'INVALID_RESPONSE');
      throw new PersistenceApiError({
        message: `Persistence API returned invalid JSON (${response.status})`,
        code: 'INVALID_RESPONSE',
        status: response.status,
        ...classification,
      });
    }

    if (!response.ok || !envelope.success) {
      const code = envelope.error?.code || 'PERSISTENCE_REQUEST_FAILED';
      const classification = classifyError(response.status, code);
      throw new PersistenceApiError({
        message: envelope.error?.message || `Persistence request failed (${response.status})`,
        code,
        status: response.status,
        details: envelope.error?.details,
        ...classification,
      });
    }

    return envelope.data;
  } catch (error) {
    if (error instanceof PersistenceApiError) throw error;

    const timedOut = error instanceof DOMException && error.name === 'AbortError';
    throw new PersistenceApiError({
      message: timedOut ? 'Persistence request timed out' : 'Persistence network request failed',
      code: timedOut ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
      retryable: true,
      kind: 'transport',
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function persistenceRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await requestOnce<T>(path, init);
    } catch (error) {
      if (
        !(error instanceof PersistenceApiError) ||
        !error.retryable ||
        attempt >= RETRY_DELAYS_MS.length
      ) {
        throw error;
      }
      await wait(RETRY_DELAYS_MS[attempt]);
      attempt += 1;
    }
  }
}

export function toPersistenceSyncIssue(error: unknown): PersistenceSyncIssue {
  if (error instanceof PersistenceApiError) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
      retryable: error.retryable,
      kind: error.kind,
      occurredAt: Date.now(),
    };
  }

  return {
    message: error instanceof Error ? error.message : 'Persistence synchronization failed',
    code: 'UNKNOWN_PERSISTENCE_ERROR',
    retryable: false,
    kind: 'permanent',
    occurredAt: Date.now(),
  };
}

export function isPersistenceApiError(
  error: unknown
): error is PersistenceApiError<Record<string, unknown>> {
  return error instanceof PersistenceApiError;
}
