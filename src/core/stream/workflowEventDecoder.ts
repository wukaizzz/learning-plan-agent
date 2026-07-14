import { z } from 'zod';

import type { WorkflowEvent } from '../../types/workflowEvents';
import { UIBlockBaseSchema } from '../../types/uiBlocks';

const eventMetaShape = {
  runId: z.string().optional(),
  messageId: z.string().optional(),
  stepId: z.string().optional(),
  timestamp: z.number().optional(),
};

const eventMetaWithoutStepIdShape = {
  runId: eventMetaShape.runId,
  messageId: eventMetaShape.messageId,
  timestamp: eventMetaShape.timestamp,
};

const infoNeededSchema = z.object({
  type: z.literal('info_needed'),
  fieldName: z.string().min(1).optional(),
  field: z.string().min(1).optional(),
  question: z.string().min(1),
  fieldType: z.enum(['text', 'date', 'number', 'select', 'multiline']),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
  ...eventMetaShape,
}).refine(event => Boolean(event.fieldName || event.field), {
  message: 'info_needed requires fieldName',
}).transform(({ field, ...event }) => ({
  ...event,
  fieldName: event.fieldName ?? field!,
}));

const workflowStepSchema = z.object({
  type: z.literal('workflow_step'),
  step: z.enum(['collecting', 'analyzing', 'generating', 'reviewing', 'finalized', 'paused']),
  message: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  ...eventMetaShape,
});

const toolCallSchema = z.object({
  type: z.literal('tool_call'),
  id: z.string().optional(),
  toolName: z.string().min(1),
  parameters: z.record(z.string(), z.unknown()),
  status: z.enum(['pending', 'executing', 'completed', 'failed']),
  message: z.string().optional(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  ...eventMetaShape,
});

const uiBlockUpdateSchema = z.object({
  type: z.literal('ui_block_update'),
  action: z.enum(['add', 'update', 'remove']),
  block: UIBlockBaseSchema.optional(),
  blockId: z.string().min(1).optional(),
  ...eventMetaShape,
}).superRefine((event, context) => {
  if (event.action === 'remove' && !event.blockId) {
    context.addIssue({ code: 'custom', message: 'remove requires blockId' });
  }
  if (event.action !== 'remove' && !event.block) {
    context.addIssue({ code: 'custom', message: `${event.action} requires block` });
  }
});

const commonSchemas = {
  workflow_step: workflowStepSchema,
  tool_call: toolCallSchema,
  ui_block_update: uiBlockUpdateSchema,
  processing: z.object({
    type: z.literal('processing'),
    stage: z.string().min(1),
    details: z.string().optional(),
    progress: z.number().min(0).max(100).optional(),
    ...eventMetaShape,
  }),
  intent_routed: z.object({
    type: z.literal('intent_routed'),
    payload: z.object({
      intent: z.enum(['general_chat', 'initial_planning', 'tool_assisted_answer', 'query_plan', 'adjust_plan', 'replan', 'explain_plan', 'progress_next_step', 'clarification', 'unknown']),
      confidence: z.number(),
      source: z.enum(['llm', 'rule_fallback']),
      certainty: z.enum(['high', 'medium', 'low']),
      message: z.string(),
    }),
    ...eventMetaShape,
  }),
  analysis_result: z.object({
    type: z.literal('analysis_result'),
    summary: z.string(),
    findings: z.array(z.string()),
    recommendations: z.array(z.string()).optional(),
    ...eventMetaShape,
  }),
  thinking: z.object({
    type: z.literal('thinking'),
    content: z.string(),
    ...eventMetaShape,
  }),
  thinking_end: z.object({
    type: z.literal('thinking_end'),
    duration: z.number(),
    ...eventMetaShape,
  }),
  agent_execution_start: z.object({
    type: z.literal('agent_execution_start'),
    executionId: z.string().min(1),
    title: z.string().min(1),
    executionType: z.enum(['fixed_workflow', 'autonomous_agent']).optional(),
    steps: z.array(z.object({ stepId: z.string().min(1), title: z.string().min(1) })),
    metadata: z.record(z.string(), z.unknown()).optional(),
    ...eventMetaShape,
  }),
  agent_step_update: z.object({
    type: z.literal('agent_step_update'),
    executionId: z.string().min(1),
    stepId: z.string().min(1),
    status: z.enum(['running', 'completed', 'waiting_input', 'failed']),
    title: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    ...eventMetaWithoutStepIdShape,
  }),
  agent_execution_finish: z.object({
    type: z.literal('agent_execution_finish'),
    executionId: z.string().min(1),
    status: z.enum(['completed', 'failed', 'cancelled']),
    summary: z.string().optional(),
    ...eventMetaShape,
  }),
  content: z.object({
    type: z.literal('content'),
    content: z.string(),
    ...eventMetaShape,
  }),
  done: z.object({
    type: z.literal('done'),
    ...eventMetaShape,
  }),
  error: z.object({
    type: z.literal('error'),
    error: z.string(),
    ...eventMetaShape,
  }),
} as const;

export interface WorkflowEventDiagnostic {
  message: string;
  value: unknown;
  issues?: z.core.$ZodIssue[];
}

export type WorkflowEventDiagnosticHandler = (diagnostic: WorkflowEventDiagnostic) => void;

const reportToConsole: WorkflowEventDiagnosticHandler = diagnostic => {
  console.warn('[workflow-event] ignored invalid SSE event', diagnostic);
};

export function decodeWorkflowEvent(
  value: unknown,
  onInvalid: WorkflowEventDiagnosticHandler = reportToConsole,
): WorkflowEvent | null {
  if (!value || typeof value !== 'object' || !('type' in value) || typeof value.type !== 'string') {
    onInvalid({ message: 'SSE event must be an object with a string type', value });
    return null;
  }

  const schema = value.type === 'info_needed'
    ? infoNeededSchema
    : commonSchemas[value.type as keyof typeof commonSchemas];
  if (!schema) {
    onInvalid({ message: `Unsupported SSE event type: ${value.type}`, value });
    return null;
  }

  const result = schema.safeParse(value);
  if (!result.success) {
    onInvalid({ message: `Invalid ${value.type} SSE event`, value, issues: result.error.issues });
    return null;
  }
  return result.data as WorkflowEvent;
}

export function isWorkflowEventCurrent(eventRunId?: string, activeRunId?: string | null): boolean {
  return !eventRunId || !activeRunId || eventRunId === activeRunId;
}
