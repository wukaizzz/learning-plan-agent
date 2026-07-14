import { beforeEach, describe, expect, it } from 'vitest';

import { useChatStore } from './chatStore';
import type { ChatSession, Message, UIBlock } from '@/types';

const removableBlock = {
  id: 'temporary-form',
  type: 'collection-form',
  title: '补充信息',
  props: { stage: 'initial', fields: [] },
} as UIBlock;

const keepBlock = { ...removableBlock, id: 'keep-form' };

const createMessage = (id: string): Message => ({
  id,
  role: 'assistant',
  content: '',
  timestamp: 1,
  thinkingActive: false,
  ui_blocks: [removableBlock, keepBlock],
});

describe('chatStore.removeUIBlock', () => {
  beforeEach(() => {
    const message = createMessage('message-1');
    const session: ChatSession = {
      id: 'session-1',
      spaceId: 'space-1',
      title: '测试会话',
      messages: [createMessage('message-1')],
      createdAt: 1,
      updatedAt: 1,
      draftMessage: '',
      scrollPosition: 0,
    };
    useChatStore.setState({
      uiBlocks: [removableBlock, keepBlock],
      messages: [message],
      sessions: [session],
      currentSessionId: session.id,
    });
  });

  it('removes a block from the global and targeted message collections', () => {
    useChatStore.getState().removeUIBlock('temporary-form', 'message-1');

    const state = useChatStore.getState();
    expect(state.uiBlocks.map(block => block.id)).toEqual(['keep-form']);
    expect(state.messages[0].ui_blocks?.map(block => block.id)).toEqual(['keep-form']);
    expect(state.sessions[0].messages[0].ui_blocks?.map(block => block.id)).toEqual(['keep-form']);
  });
});
