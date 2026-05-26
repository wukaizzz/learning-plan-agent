// src/shared/debug/agentTrace.ts

export type AgentTraceLayer =
  | 'frontend:consumeSSE'
  | 'frontend:useStream'
  | 'frontend:messageStore'
  | 'frontend:ChatPanel'
  | 'frontend:AgentExecutionCard';

export type AgentTraceEntry = {
  id: string;
  time: string;
  layer: AgentTraceLayer;
  label: string;

  threadId?: string;
  messageId?: string;
  executionId?: string;
  eventType?: string;

  data?: unknown;
};

const MAX_TRACE_COUNT = 500;

const traces: AgentTraceEntry[] = [];

function isDev() {
  return import.meta.env.DEV;
}

function safeClone<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function traceAgent(entry: Omit<AgentTraceEntry, 'id' | 'time'>) {
  if (!isDev()) return;

  const trace: AgentTraceEntry = {
    id: createId(),
    time: new Date().toISOString(),
    ...entry,
    data: safeClone(entry.data),
  };

  traces.push(trace);

  if (traces.length > MAX_TRACE_COUNT) {
    traces.shift();
  }

  console.groupCollapsed(
    `%c[AGENT TRACE]%c ${trace.layer} | ${trace.label}`,
    'color:#7c3aed;font-weight:bold;',
    'color:inherit;',
    {
      executionId: trace.executionId,
      messageId: trace.messageId,
      eventType: trace.eventType,
    }
  );

  if (trace.data !== undefined) {
    console.log(trace.data);
  }

  console.groupEnd();
}

export function getAgentTraces() {
  return traces;
}

export function clearAgentTraces() {
  traces.length = 0;
}

export function filterAgentTraces(filter: {
  executionId?: string;
  messageId?: string;
  layer?: AgentTraceLayer;
  eventType?: string;
}) {
  return traces.filter((trace) => {
    if (filter.executionId && trace.executionId !== filter.executionId) return false;
    if (filter.messageId && trace.messageId !== filter.messageId) return false;
    if (filter.layer && trace.layer !== filter.layer) return false;
    if (filter.eventType && trace.eventType !== filter.eventType) return false;

    return true;
  });
}

declare global {
  interface Window {
    __AGENT_TRACE__?: {
      get: typeof getAgentTraces;
      clear: typeof clearAgentTraces;
      filter: typeof filterAgentTraces;
    };
  }
}

if (isDev() && typeof window !== 'undefined') {
  window.__AGENT_TRACE__ = {
    get: getAgentTraces,
    clear: clearAgentTraces,
    filter: filterAgentTraces,
  };
}