import { describe, expect, it, vi } from 'vitest';

import { decodeWorkflowEvent, isWorkflowEventCurrent } from './workflowEventDecoder';

describe('decodeWorkflowEvent', () => {
  it('normalizes the historical info_needed field to fieldName', () => {
    expect(decodeWorkflowEvent({
      type: 'info_needed',
      field: 'examDate',
      question: '考试日期是什么时候？',
      fieldType: 'date',
    })).toEqual({
      type: 'info_needed',
      fieldName: 'examDate',
      question: '考试日期是什么时候？',
      fieldType: 'date',
      required: true,
    });
  });

  it('accepts a transient collection form without persistence metadata', () => {
    const block = {
      id: 'collect-exam-date',
      type: 'collection-form',
      title: '补充规划信息',
      props: {
        stage: 'initial',
        fields: [{
          name: 'examDate',
          label: '考试日期',
          type: 'date',
          required: true,
        }],
      },
    };

    expect(decodeWorkflowEvent({
      type: 'ui_block_update',
      action: 'add',
      block,
    })).toEqual({
      type: 'ui_block_update',
      action: 'add',
      block,
    });
  });

  it('rejects malformed UI blocks and reports a diagnostic', () => {
    const onInvalid = vi.fn();

    expect(decodeWorkflowEvent({
      type: 'ui_block_update',
      action: 'add',
      block: { id: 'broken', type: 'daily-task-list' },
    }, onInvalid)).toBeNull();
    expect(onInvalid).toHaveBeenCalledOnce();
  });

  it('accepts remove events without requiring a block payload', () => {
    expect(decodeWorkflowEvent({
      type: 'ui_block_update',
      action: 'remove',
      blockId: 'temporary-form',
      messageId: 'message-1',
    })).toEqual({
      type: 'ui_block_update',
      action: 'remove',
      blockId: 'temporary-form',
      messageId: 'message-1',
    });
  });

  it('preserves backend persistence metadata on validated UI blocks', () => {
    const event = decodeWorkflowEvent({
      type: 'ui_block_update',
      action: 'add',
      block: {
        id: 'persisted-form',
        type: 'collection-form',
        title: '补充信息',
        props: { stage: 'initial', fields: [] },
        meta: {
          timestamp: 1,
          planId: 'plan-1',
          planVersion: 2,
          persisted: true,
        },
      },
    });

    expect(event?.type === 'ui_block_update' && event.block?.meta).toMatchObject({
      planId: 'plan-1',
      planVersion: 2,
      persisted: true,
    });
  });

  it('validates agent execution events', () => {
    expect(decodeWorkflowEvent({
      type: 'agent_execution_start',
      executionId: 'execution-1',
      title: '生成学习计划',
      steps: [{ stepId: 'collecting', title: '收集信息' }],
      runId: 'run-1',
    })).toMatchObject({
      type: 'agent_execution_start',
      executionId: 'execution-1',
      runId: 'run-1',
    });
  });
});

describe('isWorkflowEventCurrent', () => {
  it('drops events from an older run while accepting unscoped events', () => {
    expect(isWorkflowEventCurrent('old-run', 'active-run')).toBe(false);
    expect(isWorkflowEventCurrent('active-run', 'active-run')).toBe(true);
    expect(isWorkflowEventCurrent(undefined, 'active-run')).toBe(true);
  });
});
