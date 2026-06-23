import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  ChatStore,
  ChatSyncMutation,
  ChatSyncResult,
  Message,
  ChatSession,
  WorkspaceState,
  UIBlock,
} from '@/types'
import { extractPlanFromUIBlocks, normalizePlanUIBlock, PLAN_BLOCK_TYPES } from '@/utils/planBlockAdapter';
import { traceAgent } from '@/shared/debug/agentTrace';
import * as persistenceApi from '@/services/spaceChatPersistenceApi';
import {
  isPersistenceApiError,
  toPersistenceSyncIssue,
} from '@/services/persistenceClient';
const generateId = () => `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

const messageHasCollectionForm = (message: Message) =>
  message.ui_blocks?.some(block => block.type === 'collection-form') ?? false;

const messageHasWorkflowProcess = (message: Message) =>
  !!message.workflow_process_steps?.length;

const PERSISTED_MESSAGE_BLOCK_TYPES = new Set([
  'collection-form',
  'schedule-task-list',
]);

// shouldPersistWorkflowEvent removed in v4 — workflow_events no longer persisted

const sanitizeMessageForStorage = (message: Message): Message => {
  // v4 瘦身：删除 workflow_events、thinkingContent、thinkingDuration、完整 agent_execution
  // 只保留需要随消息恢复的交互或查询结果 Block
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
    tool_calls: message.tool_calls,
    ui_blocks: message.ui_blocks?.filter(block => PERSISTED_MESSAGE_BLOCK_TYPES.has(block.type)),
    submitted_form_summary: message.submitted_form_summary,
    form_submission_state: message.form_submission_state,
    workflow_process_steps: message.workflow_process_steps,
    thinkingActive: false,
  };
};

const sanitizeSessionForStorage = (session: ChatSession): ChatSession => ({
  ...session,
  messages: session.messages.map(sanitizeMessageForStorage)
});

const updateSessionMessage = (
  sessions: ChatSession[],
  currentSessionId: string | null,
  messageId: string,
  updater: (message: Message) => void
) => {
  const currentSession = currentSessionId
    ? sessions.find(session => session.id === currentSessionId)
    : null;
  const sessionMessage = currentSession?.messages.find(msg => msg.id === messageId);

  if (sessionMessage && currentSession) {
    updater(sessionMessage);
    currentSession.updatedAt = Date.now();
  }
};

const createLegacySession = (
  messages: Message[],
  currentSpaceId: string | null,
  currentSessionId?: string | null
): ChatSession => {
  const now = Date.now();
  return {
    id: currentSessionId || generateId(),
    spaceId: currentSpaceId,
    title: messages.find(message => message.role === 'user')?.content.slice(0, 30) || '历史对话',
    messages: messages.map(sanitizeMessageForStorage),
    createdAt: now,
    updatedAt: now,
    draftMessage: '',
    scrollPosition: 0
  };
};

const normalizeMessageRuntimeFields = (message: Message) => {
  message.thinkingActive = false;
};

const chatSyncPromises = new Map<string, Promise<ChatSyncResult>>();
const chatSyncTimers = new Map<string, ReturnType<typeof setTimeout>>();
let chatHydrationPromise: Promise<void> | null = null;
let suppressSessionObserver = false;
let sessionFingerprints = new Map<string, string>();
let observedSessions = new Map<string, ChatSession>();

const createSyncMutationId = () => (
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `chat-sync-${crypto.randomUUID()}`
    : `chat-sync-${Date.now()}-${Math.random().toString(36).slice(2)}`
);

const sessionFingerprint = (session: ChatSession) => JSON.stringify({
  id: session.id,
  spaceId: session.spaceId,
  title: session.title,
  createdAt: session.createdAt,
  messages: session.messages.map(persistenceApi.sanitizeMessage),
});

const compactChatMutations = (
  mutations: ChatSyncMutation[],
  mutation: ChatSyncMutation
) => [
  ...mutations.filter(item => item.sessionId !== mutation.sessionId),
  mutation,
];

async function executeChatMutation(mutation: ChatSyncMutation) {
  if (mutation.kind === 'save_session_snapshot') {
    await persistenceApi.saveSession(mutation.payload);
    return;
  }
  await persistenceApi.deleteSession(mutation.sessionId);
}

function applyRemoteSessionConflict(
  sessionId: string,
  current: persistenceApi.RemoteSession
) {
  const remote = persistenceApi.deserializeSession(current);
  const state = useChatStore.getState();
  const local = state.sessions.find(session => session.id === sessionId);
  const merged: ChatSession = {
    ...remote,
    draftMessage: local?.draftMessage || '',
    scrollPosition: local?.scrollPosition || 0,
  };

  suppressSessionObserver = true;
  try {
    useChatStore.setState(currentState => {
      const sessions = currentState.sessions.some(session => session.id === sessionId)
        ? currentState.sessions.map(session => session.id === sessionId ? merged : session)
        : [merged, ...currentState.sessions];
      return {
        sessions,
        ...(currentState.currentSessionId === sessionId
          ? {
              messages: merged.messages,
              currentSpaceId: merged.spaceId,
            }
          : {}),
      };
    });
    refreshSessionObserver(useChatStore.getState().sessions);
  } finally {
    suppressSessionObserver = false;
  }
}

function runChatSync(sessionId: string): Promise<ChatSyncResult> {
  const existing = chatSyncPromises.get(sessionId);
  if (existing) return existing;

  const promise = (async (): Promise<ChatSyncResult> => {
    while (true) {
      const mutation = useChatStore.getState().pendingMutations
        .find(item => item.sessionId === sessionId);
      if (!mutation) {
        useChatStore.setState(state => ({
          syncErrorBySession: {
            ...state.syncErrorBySession,
            [sessionId]: null,
          },
        }));
        return { status: 'synced', error: null };
      }
      try {
        await executeChatMutation(mutation);
        useChatStore.setState(state => ({
          pendingMutations: state.pendingMutations.filter(item => item.id !== mutation.id),
          syncErrorBySession: {
            ...state.syncErrorBySession,
            [sessionId]: null,
          },
        }));
      } catch (error) {
        const issue = toPersistenceSyncIssue(error);
        if (
          isPersistenceApiError(error) &&
          error.code === 'STALE_WRITE_CONFLICT'
        ) {
          const mutationIsCurrent = useChatStore.getState().pendingMutations
            .some(item => item.id === mutation.id);
          if (!mutationIsCurrent) {
            continue;
          }
          const current = (error.details as { current?: persistenceApi.RemoteSession } | undefined)
            ?.current;
          if (current) applyRemoteSessionConflict(sessionId, current);
          useChatStore.setState(state => ({
            pendingMutations: state.pendingMutations.filter(item => item.id !== mutation.id),
            syncErrorBySession: {
              ...state.syncErrorBySession,
              [sessionId]: issue,
            },
          }));
          return { status: 'synced', error: issue };
        }
        useChatStore.setState(state => ({
          syncErrorBySession: {
            ...state.syncErrorBySession,
            [sessionId]: issue,
          },
        }));
        return { status: 'pending', error: issue };
      }
    }
  })().finally(() => {
    chatSyncPromises.delete(sessionId);
  });

  chatSyncPromises.set(sessionId, promise);
  return promise;
}

function enqueueChatMutation(mutation: ChatSyncMutation) {
  useChatStore.setState(state => ({
    pendingMutations: compactChatMutations(state.pendingMutations, mutation),
  }));
  const existingTimer = chatSyncTimers.get(mutation.sessionId);
  if (existingTimer) clearTimeout(existingTimer);
  if (mutation.kind === 'delete_session') {
    void runChatSync(mutation.sessionId);
    return;
  }
  const timer = setTimeout(() => {
    chatSyncTimers.delete(mutation.sessionId);
    void runChatSync(mutation.sessionId);
  }, 500);
  chatSyncTimers.set(mutation.sessionId, timer);
}

function refreshSessionObserver(sessions: ChatSession[]) {
  sessionFingerprints = new Map(
    sessions.map(session => [session.id, sessionFingerprint(session)])
  );
  observedSessions = new Map(sessions.map(session => [session.id, session]));
}

async function hydrateChatSessions() {
  if (chatHydrationPromise) return chatHydrationPromise;
  chatHydrationPromise = (async () => {
    useChatStore.setState({ hydrationStatus: 'loading' });
    const pendingIdsBefore = new Set(
      useChatStore.getState().pendingMutations.map(item => item.sessionId)
    );
    await Promise.all(Array.from(pendingIdsBefore, runChatSync));
    try {
      const remoteSessions = await persistenceApi.listSessions();
      const state = useChatStore.getState();
      const pendingIds = new Set(state.pendingMutations.map(item => item.sessionId));
      const localById = new Map(state.sessions.map(session => [session.id, session]));
      const mergedRemote = remoteSessions
        .filter(session => !pendingIds.has(session.id))
        .map(session => {
          const local = localById.get(session.id);
          return {
            ...session,
            draftMessage: local?.draftMessage || '',
            scrollPosition: local?.scrollPosition || 0,
          };
        });
      const pendingLocal = state.sessions.filter(session => pendingIds.has(session.id));
      const sessions = [...mergedRemote, ...pendingLocal]
        .sort((a, b) => b.updatedAt - a.updatedAt);
      const currentSessionId = state.currentSessionId &&
        sessions.some(session => session.id === state.currentSessionId)
        ? state.currentSessionId
        : sessions[0]?.id ?? null;
      const currentSession = sessions.find(session => session.id === currentSessionId);
      suppressSessionObserver = true;
      useChatStore.setState({
        sessions,
        currentSessionId,
        currentSpaceId: currentSession?.spaceId ?? state.currentSpaceId,
        messages: currentSession?.messages ?? [],
        hydrationStatus: 'loaded',
      });
      refreshSessionObserver(sessions);
      suppressSessionObserver = false;
    } catch (error) {
      useChatStore.setState({ hydrationStatus: 'error' });
      throw error;
    }
  })().finally(() => {
    suppressSessionObserver = false;
    chatHydrationPromise = null;
  });
  return chatHydrationPromise;
}

/**
 * v3 → v4 迁移：从旧 session messages 的 workflow_events 提取计划数据
 * 写入 plan-storage（localStorage），然后瘦身 messages
 *
 * 关键修正：按 space 只取最新一条含计划 blocks 的 assistant message，不累积
 */
const migrateV3ToV4PlanData = (sessions: unknown[]) => {
  try {
    // 按 spaceId 分组，每组取最新含计划 blocks 的 message
    const spacePlanBlocks = new Map<string, {
      blocks: UIBlock[];
      sessionId?: string;
      messageId?: string;
    }>();

    for (const session of sessions) {
      const s = session as Record<string, unknown>;
      const spaceId = s.spaceId as string | null;
      if (!spaceId) continue;

      const messages = Array.isArray(s.messages) ? s.messages : [];
      // 从最新 assistant message 往前找第一条含计划 blocks 的
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i] as Record<string, unknown>;
        if (msg.role !== 'assistant') continue;

        const events = Array.isArray(msg.workflow_events) ? msg.workflow_events : [];
        const planBlocks: UIBlock[] = [];

        for (const event of events) {
          const e = event as Record<string, unknown>;
          if (e.type === 'ui_block_update' && (e.action === 'add' || e.action === 'update') && e.block) {
            const block = e.block as UIBlock;
            if (PLAN_BLOCK_TYPES.has(block.type)) {
              // 去重：同 id 的 block 只保留最新
              const existingIdx = planBlocks.findIndex(candidate => candidate.id === block.id);
              if (existingIdx >= 0) {
                planBlocks[existingIdx] = block;
              } else {
                planBlocks.push(block);
              }
            }
          }
        }

        if (planBlocks.length > 0) {
          // 只保留最新的一条 message 的 blocks（不累积旧计划）
          if (!spacePlanBlocks.has(spaceId)) {
            spacePlanBlocks.set(spaceId, {
              blocks: planBlocks,
              sessionId: s.id as string,
              messageId: msg.id as string,
            });
          }
          break; // 找到最新的就够了
        }
      }
    }

    // 写入 plan-storage
    if (spacePlanBlocks.size > 0) {
      try {
        const planStorage = localStorage.getItem('plan-storage');
        const existing = (planStorage ? JSON.parse(planStorage) : {
          plans: [],
          tasks: [],
          blocks: [],
          executions: [],
          version: 1,
        }) as {
          plans: Array<{ spaceId?: string }>;
          tasks: unknown[];
          blocks: unknown[];
          executions: unknown[];
          version: number;
        };

        for (const [spaceId, data] of spacePlanBlocks) {
          const extracted = extractPlanFromUIBlocks(spaceId, data.blocks, {
            sessionId: data.sessionId,
            messageId: data.messageId,
          });
          if (extracted) {
            extracted.plan.status = 'active'; // 旧数据已经是生成完毕的
            // 移除同 space 的旧 plan
            existing.plans = existing.plans.filter(plan => plan.spaceId !== spaceId);
            existing.plans.push(extracted.plan);
            existing.tasks.push(...extracted.tasks);
            existing.blocks.push(...extracted.blocks);
          }
        }

        localStorage.setItem('plan-storage', JSON.stringify(existing));
        console.log(`[migrateV3ToV4] Migrated plan data for ${spacePlanBlocks.size} spaces`);
      } catch (e) {
        console.error('[migrateV3ToV4] Failed to write plan-storage:', e);
      }
    }
  } catch (e) {
    console.error('[migrateV3ToV4] Migration failed:', e);
  }
};

export const useChatStore = create<ChatStore>()(
  persist(
    immer((set, get) => ({
      messages: [],
      currentAgentId: null,
      isStreaming: false,
      currentSessionId: null,
      currentSpaceId: null, // 当前关联的学习空间ID
      workspaceState: 'empty' as WorkspaceState, //  工作流状态
      uiBlocks: [], //  当前显示的UI Blocks
      sessions: [],
      activeFormStep: 0, // 🆕 当前激活的表单步骤
      formStepsData: {}, // 🆕 已提交的表单数据
      workflowInterrupted: false, // 🆕 工作流是否中断
      lastFormStep: null, // 🆕 中断时的表单步骤
      currentWorkflowEvents: [], // 🆕 当前消息的工作流事件
      pendingMutations: [],
      hydrationStatus: 'idle',
      syncErrorBySession: {},

      addMessage: (message: Message) => set((state) => {
        normalizeMessageRuntimeFields(message);
        traceAgent({
          layer: 'frontend:messageStore', label: 'addMessage',
          messageId: message.id,
          eventType: 'addMessage',
          data: { role: message.role, hasWorkflowEvents: !!message.workflow_events?.length }
        });
        // 🆕 如果是 assistant 消息且有当前工作流事件，附加到消息
        if (message.role === 'assistant' && state.currentWorkflowEvents.length > 0 && !message.workflow_events) {
          message.workflow_events = [...state.currentWorkflowEvents];
        }

        state.messages.push(message);

        // Update current session
        if (state.currentSessionId) {
          const session = state.sessions.find(s => s.id === state.currentSessionId);
          if (session) {
            session.messages.push(message);
            session.updatedAt = Date.now();

            // Update session title if it's a new session with first user message
            if (session.messages.filter(m => m.role === 'user').length === 1 && message.role === 'user') {
              session.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
            }
          }
        }
      }),

      clearMessages: () => set((state) => {
        state.messages = [];

        // Clear current session messages
        if (state.currentSessionId) {
          const session = state.sessions.find(s => s.id === state.currentSessionId);
          if (session) {
            session.messages = [];
            session.updatedAt = Date.now();
          }
        }
      }),

      setCurrentAgent: (agentId: string | null) => set((state) => {
        if (state.currentAgentId !== agentId) {
          state.currentAgentId = agentId;
        }
      }),

      setStreaming: (isStreaming: boolean) => set((state) => {
        if (state.isStreaming !== isStreaming) {
          state.isStreaming = isStreaming;
        }
      }),

      updateToolCall: (toolCallId: string, updates) => set((state) => {
        state.messages.forEach(msg => {
          if (msg.tool_calls) {
            const toolCall = msg.tool_calls.find(tc => tc.id === toolCallId);
            if (toolCall) {
              Object.assign(toolCall, updates);
            }
          }
        });

        const session = state.currentSessionId
          ? state.sessions.find(session => session.id === state.currentSessionId)
          : null;
        session?.messages.forEach(msg => {
          if (msg.tool_calls) {
            const toolCall = msg.tool_calls.find(tc => tc.id === toolCallId);
            if (toolCall) {
              Object.assign(toolCall, updates);
            }
          }
        });
        if (session) {
          session.updatedAt = Date.now();
        }
      }),

      updateMessage: (messageId: string, content: string) => set((state) => {
        traceAgent({
          layer: 'frontend:messageStore', label: 'updateMessage',
          messageId, eventType: 'updateMessage',
          data: { contentLength: content.length }
        });
        const message = state.messages.find(msg => msg.id === messageId);
        if (message) {
          message.content = content;
        }

        updateSessionMessage(state.sessions, state.currentSessionId, messageId, sessionMessage => {
          sessionMessage.content = content;
        });
      }),

      updateMessageThinking: (messageId, patch) => set((state) => {
        const applyThinkingPatch = (message: Message) => {
          if (patch.content !== undefined) {
            message.thinkingContent = patch.content;
          }
          if (patch.active !== undefined) {
            message.thinkingActive = patch.active;
          }
          if (patch.duration !== undefined) {
            message.thinkingDuration = patch.duration;
          }
        };

        const message = state.messages.find(msg => msg.id === messageId);
        if (message) {
          applyThinkingPatch(message);
        }

        updateSessionMessage(state.sessions, state.currentSessionId, messageId, applyThinkingPatch);
      }),

      deleteMessage: (messageId: string) => set((state) => {
        state.messages = state.messages.filter(msg => msg.id !== messageId);

        const session = state.currentSessionId
          ? state.sessions.find(session => session.id === state.currentSessionId)
          : null;
        if (session) {
          session.messages = session.messages.filter(msg => msg.id !== messageId);
          session.updatedAt = Date.now();
        }
      }),

      addToolCall: (messageId: string, toolCall) => set((state) => {
        const message = state.messages.find(msg => msg.id === messageId);
        if (message) {
          if (!message.tool_calls) {
            message.tool_calls = [];
          }
          message.tool_calls.push(toolCall);
        }

        updateSessionMessage(state.sessions, state.currentSessionId, messageId, sessionMessage => {
          if (!sessionMessage.tool_calls) {
            sessionMessage.tool_calls = [];
          }
          sessionMessage.tool_calls.push(toolCall);
        });
      }),

      updateLastAssistantMessage: (content: string) => set((state) => {
        traceAgent({
          layer: 'frontend:messageStore', label: 'updateLastAssistantMessage',
          eventType: 'updateLastAssistantMessage',
          data: { contentLength: content.length }
        });
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = content;
        }

        // Update in sessions
        if (state.currentSessionId) {
          const session = state.sessions.find(s => s.id === state.currentSessionId);
          if (session) {
            const lastMessage = session.messages[session.messages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = content;
              session.updatedAt = Date.now();
            }
          }
        }
      }),

      addUIBlockToMessage: (messageId: string, block: UIBlock) => set((state) => {
        const updater = (message: Message) => {
          const existingBlocks = message.ui_blocks || [];
          const nextBlocks = existingBlocks.filter(existing => existing.id !== block.id);
          message.ui_blocks = [...nextBlocks, block];
          message.form_submission_state = message.form_submission_state || 'idle';
        };

        const message = state.messages.find(msg => msg.id === messageId);
        if (message) {
          updater(message);
        }

        updateSessionMessage(state.sessions, state.currentSessionId, messageId, updater);
      }),

      addUIBlockToLastAssistantMessage: (block: UIBlock) => set((state) => {
        traceAgent({
          layer: 'frontend:messageStore', label: 'addUIBlockToLastAssistantMessage',
          eventType: 'addUIBlockToLastAssistantMessage',
          data: { blockType: block.type, blockId: block.id }
        });
        const lastMessage = [...state.messages].reverse().find(msg => msg.role === 'assistant');
        if (!lastMessage) {
          return;
        }

        const updater = (message: Message) => {
          const existingBlocks = message.ui_blocks || [];
          const nextBlocks = existingBlocks.filter(existing => existing.id !== block.id);
          message.ui_blocks = [...nextBlocks, block];
          message.form_submission_state = message.form_submission_state || 'idle';
        };

        updater(lastMessage);
        updateSessionMessage(state.sessions, state.currentSessionId, lastMessage.id, updater);
      }),

      markLatestCollectionFormSubmitting: () => set((state) => {
        const message = [...state.messages].reverse().find(messageHasCollectionForm);
        if (!message) {
          return;
        }
        traceAgent({
          layer: 'frontend:messageStore', label: 'markCollectionForm: submitting',
          messageId: message.id, eventType: 'markLatestCollectionFormSubmitting',
          data: { messageId: message.id }
        });

        message.form_submission_state = 'submitting';
        updateSessionMessage(state.sessions, state.currentSessionId, message.id, sessionMessage => {
          sessionMessage.form_submission_state = 'submitting';
        });
      }),

      markLatestCollectionFormSubmitted: (summary) => set((state) => {
        const message = [...state.messages].reverse().find(messageHasCollectionForm);
        if (!message) {
          return;
        }
        traceAgent({
          layer: 'frontend:messageStore', label: 'markCollectionForm: submitted',
          messageId: message.id, eventType: 'markLatestCollectionFormSubmitted',
          data: { messageId: message.id }
        });

        const updater = (targetMessage: Message) => {
          targetMessage.form_submission_state = 'submitted';
          targetMessage.submitted_form_summary = summary;
          targetMessage.ui_blocks = targetMessage.ui_blocks?.filter(block => block.type !== 'collection-form') || [];
          if (/^\s*\[需要信息\]/.test(targetMessage.content)) {
            targetMessage.content = '';
          }
        };

        updater(message);
        updateSessionMessage(state.sessions, state.currentSessionId, message.id, updater);
      }),

      resetLatestCollectionFormSubmissionState: () => set((state) => {
        const message = [...state.messages].reverse().find(message =>
          messageHasCollectionForm(message) || messageHasWorkflowProcess(message)
        );
        if (!message) {
          return;
        }
        traceAgent({
          layer: 'frontend:messageStore', label: 'markCollectionForm: reset',
          messageId: message.id, eventType: 'resetLatestCollectionFormSubmissionState',
          data: { messageId: message.id }
        });

        message.form_submission_state = 'idle';
        updateSessionMessage(state.sessions, state.currentSessionId, message.id, sessionMessage => {
          sessionMessage.form_submission_state = 'idle';
        });
      }),

      initializeLatestWorkflowProcessSteps: (steps) => set((state) => {
        const message = [...state.messages].reverse().find(message =>
          messageHasCollectionForm(message) || message.form_submission_state === 'submitted'
        );
        if (!message) {
          return;
        }

        const updater = (targetMessage: Message) => {
          targetMessage.workflow_process_steps = steps.map(step => ({ ...step }));
        };

        updater(message);
        updateSessionMessage(state.sessions, state.currentSessionId, message.id, updater);
      }),

      updateLatestWorkflowProcessStep: (stepId, status) => set((state) => {
        const message = [...state.messages].reverse().find(messageHasWorkflowProcess);
        if (!message) {
          return;
        }

        const updater = (targetMessage: Message) => {
          targetMessage.workflow_process_steps = targetMessage.workflow_process_steps?.map(step =>
            step.id === stepId ? { ...step, status } : step
          );
        };

        updater(message);
        updateSessionMessage(state.sessions, state.currentSessionId, message.id, updater);
      }),

      // Session management
      createNewSession: (title?: string, spaceId?: string | null) => {
        const sessionId = generateId();
        const resolvedSpaceId = spaceId !== undefined ? spaceId : get().currentSpaceId;
        const newSession: ChatSession = {
          id: sessionId,
          spaceId: resolvedSpaceId, // 关联到当前空间或指定的空间
          title: title || '新对话',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          draftMessage: '',
          scrollPosition: 0 // 初始化滚动位置
        };

        set((state) => {
          state.sessions.unshift(newSession);
          state.currentSessionId = sessionId;
          state.messages = [];
          // 更新当前空间ID
          state.currentSpaceId = resolvedSpaceId;
        });

        return sessionId;
      },

      switchSession: (sessionId: string) => {
        set((state) => {
          const session = state.sessions.find(s => s.id === sessionId);
          if (session) {
            state.currentSessionId = sessionId;
            state.messages = session.messages;
            // 同时更新 currentSpaceId，确保空间关联正确
            if (session.spaceId !== state.currentSpaceId) {
              state.currentSpaceId = session.spaceId;
            }
          }
        });
      },

      deleteSession: (sessionId: string) => {
        set((state) => {
          state.sessions = state.sessions.filter(s => s.id !== sessionId);

          // If deleting current session, switch to another or create new
          if (state.currentSessionId === sessionId) {
            const nextSession = state.sessions
              .filter(session => session.spaceId === state.currentSpaceId)
              .sort((a, b) => b.updatedAt - a.updatedAt)[0];
            if (nextSession) {
              state.currentSessionId = nextSession.id;
              state.messages = nextSession.messages;
            } else {
              state.currentSessionId = null;
              state.messages = [];
            }
          }
        });
      },

      deleteSessionsBySpace: (spaceId: string) => {
        set((state) => {
          const currentSessionBeforeDelete = state.currentSessionId
            ? state.sessions.find(session => session.id === state.currentSessionId)
            : null;
          const shouldResetCurrentSession = currentSessionBeforeDelete?.spaceId === spaceId;

          state.sessions = state.sessions.filter(session => session.spaceId !== spaceId);

          if (shouldResetCurrentSession) {
            state.currentSessionId = null;
            state.messages = [];
            state.uiBlocks = [];
            state.currentWorkflowEvents = [];
            state.formStepsData = {};
            state.workflowInterrupted = false;
            state.lastFormStep = null;
            state.activeFormStep = 0;
            state.workspaceState = 'empty';
          }

          if (state.currentSpaceId === spaceId) {
            state.currentSpaceId = null;
          }
        });
      },

      updateSessionTitle: (sessionId: string, title: string) => set((state) => {
        const session = state.sessions.find(s => s.id === sessionId);
        if (session) {
          session.title = title;
          session.updatedAt = Date.now();
        }
      }),

      getAllSessions: () => {
        return get().sessions;
      },

      getSessionsBySpace: (spaceId: string) => {
        const state = get();
        return state.sessions.filter(s => s.spaceId === spaceId);
      },

      getGlobalSessions: () => {
        const state = get();
        return state.sessions.filter(s => s.spaceId === null);
      },

      //  Draft management
      setSessionDraft: (sessionId: string, draft: string) => {
        set((state) => {
          const session = state.sessions.find(s => s.id === sessionId);
          if (session) {
            session.draftMessage = draft;
            session.updatedAt = Date.now();
          }
        });
      },

      getSessionDraft: (sessionId: string) => {
        const state = get();
        const session = state.sessions.find(s => s.id === sessionId);
        return session?.draftMessage || '';
      },

      clearSessionDraft: (sessionId: string) => {
        set((state) => {
          const session = state.sessions.find(s => s.id === sessionId);
          if (session) {
            session.draftMessage = '';
            session.updatedAt = Date.now();
          }
        });
      },

      // Space management
      setCurrentSpace: (spaceId: string | null) => {
        set((state) => {
          state.currentSpaceId = spaceId;
          const latestSession = state.sessions
            .filter(session => session.spaceId === spaceId)
            .sort((a, b) => b.updatedAt - a.updatedAt)[0];
          state.currentSessionId = latestSession?.id ?? null;
          state.messages = latestSession?.messages ?? [];
        });
      },

      switchToSpaceSession: (spaceId: string) => {
        const state = get();
        // 查找该空间的最新会话
        const spaceSessions = state.sessions.filter(s => s.spaceId === spaceId);

        if (spaceSessions.length > 0) {
          // 切换到该空间的最新会话
          const latestSession = spaceSessions.sort((a, b) => b.updatedAt - a.updatedAt)[0];
          get().switchSession(latestSession.id);
        } else {
          // 如果该空间没有会话，创建一个新会话
          const sessionId = get().createNewSession('新对话', spaceId);
          set((state) => {
            state.currentSessionId = sessionId;
            state.currentSpaceId = spaceId;
            state.messages = [];
            // ✅ 重置工作流状态，避免旧数据污染
            state.activeFormStep = 0;
            state.formStepsData = {};
            state.workflowInterrupted = false;
            state.lastFormStep = null;
            state.workspaceState = 'empty';
            state.uiBlocks = [];
            console.log('🔄 切换到新空间，工作流状态已重置');
          });
        }
      },

      // 🆕 工作流和Block管理
      setWorkspaceState: (newState: WorkspaceState) => set((state) => {
        if (state.workspaceState !== newState) {
          traceAgent({
            layer: 'frontend:messageStore', label: 'setWorkspaceState',
            eventType: 'setWorkspaceState',
            data: { from: state.workspaceState, to: newState }
          });
          state.workspaceState = newState;
        }
      }),

      setUIBlocks: (blocks: UIBlock[]) => set((state) => {
        if (state.uiBlocks !== blocks) {
          state.uiBlocks = blocks.map(normalizePlanUIBlock);
        }
      }),

      addUIBlock: (block: UIBlock) => set((state) => {
        const normalizedBlock = normalizePlanUIBlock(block);
        const existingIndex = state.uiBlocks.findIndex(existing => existing.id === normalizedBlock.id);

        if (existingIndex >= 0) {
          state.uiBlocks[existingIndex] = normalizedBlock;
          return;
        }

        state.uiBlocks.push(normalizedBlock);
      }),

      clearUIBlocks: () => set((state) => {
        if (state.uiBlocks.length > 0) {
          state.uiBlocks = [];
        }
      }),

      getWorkspaceState: () => {
        const state = get();
        return state.workspaceState;
      },

      // 🆕 Scroll position management
      saveScrollPosition: (sessionId: string, position: number) => set((state) => {
        const session = state.sessions.find(s => s.id === sessionId);
        if (session && session.scrollPosition !== position) {
          session.scrollPosition = position;
        }
      }),

      getScrollPosition: (sessionId: string) => {
        const state = get();
        const session = state.sessions.find(s => s.id === sessionId);
        return session?.scrollPosition || 0;
      },

      // 🆕 Multi-form collection management
      setActiveFormStep: (step: number) => set((state) => {
        if (state.activeFormStep !== step) {
          state.activeFormStep = step;
        }
      }),
 
      submitFormStep: (stepIndex: number, data: Record<string, unknown>) => set((state) => {
        const existingData = state.formStepsData[stepIndex];
        if (!existingData || JSON.stringify(existingData) !== JSON.stringify(data)) {
          state.formStepsData[stepIndex] = data;
          console.log(`✅ 表单步骤 ${stepIndex} 提交成功:`, data);
        }
      }),

      markWorkflowInterrupted: (step: number) => set((state) => {
        if (!state.workflowInterrupted || state.lastFormStep !== step) {
          state.workflowInterrupted = true;
          state.lastFormStep = step;
          console.log(`⚠️ 工作流在步骤 ${step} 中断`);
        }
      }),
      
      resetFormCollection: () => set((state) => {
        if (state.activeFormStep !== 0 || 
            Object.keys(state.formStepsData).length > 0 || 
            state.workflowInterrupted !== false ||
            state.lastFormStep !== null) {
          state.activeFormStep = 0;
          state.formStepsData = {};
          state.workflowInterrupted = false;
          state.lastFormStep = null;
          console.log('🔄 表单收集状态已重置');
        }
      }),

      isFormCollectionComplete: () => {
        const state = get();
        const collectionForms = state.uiBlocks.filter(b => b.type === 'collection-form');
        const totalSteps = collectionForms.length;
        const completedSteps = Object.keys(state.formStepsData).length;
        return completedSteps >= totalSteps;
      },

      // 🆕 Workflow events management for current message
      setCurrentWorkflowEvents: (events) => set((state) => {
        state.currentWorkflowEvents = events;
      }),

      addWorkflowEvent: (event) => set((state) => {
        state.currentWorkflowEvents.push(event);
      }),

      updateMessageWorkflowEvents: (messageId, events) => set((state) => {
        const message = state.messages.find(msg => msg.id === messageId);
        if (message) {
          message.workflow_events = events;
        }

        updateSessionMessage(state.sessions, state.currentSessionId, messageId, sessionMessage => {
          sessionMessage.workflow_events = events;
        });
      }),

      updateAgentExecution: (messageId, execution) => set((state) => {
        const prev = state.messages.find(msg => msg.id === messageId)?.agent_execution;
        traceAgent({
          layer: 'frontend:messageStore', label: 'updateAgentExecution',
          messageId,
          executionId: execution.executionId,
          eventType: 'updateAgentExecution',
          data: {
            prevStatus: prev?.status,
            nextStatus: execution.status,
            prevStepStatuses: prev?.steps.map(s => `${s.stepId}:${s.status}`),
            nextStepStatuses: execution.steps.map(s => `${s.stepId}:${s.status}`)
          }
        });

        const message = state.messages.find(msg => msg.id === messageId);
        if (message) {
          message.agent_execution = execution;
        }

        updateSessionMessage(state.sessions, state.currentSessionId, messageId, sessionMessage => {
          sessionMessage.agent_execution = execution;
        });
      }),

      hydrateChatSessions,

      flushChatSync: async (sessionId?: string) => {
        const ids = sessionId
          ? [sessionId]
          : Array.from(new Set(get().pendingMutations.map(item => item.sessionId)));
        ids.forEach(id => {
          const timer = chatSyncTimers.get(id);
          if (timer) clearTimeout(timer);
          chatSyncTimers.delete(id);
        });
        const results = await Promise.all(ids.map(runChatSync));
        const pending = results.find(result => result.status === 'pending');
        return pending || { status: 'synced', error: null };
      },

      clearChatSyncIssue: (sessionId: string) => {
        set(state => {
          state.syncErrorBySession[sessionId] = null;
        });
      },
    })),
    {
      name: 'chat-storage',
      version: 6,
      migrate: (persistedState: unknown, version?: number) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState as Record<string, unknown>;
        }

        const state = persistedState as Record<string, unknown>;
        const sessions = Array.isArray(state.sessions)
          ? state.sessions
          : [];
        const legacyMessages = Array.isArray(state.messages)
          ? state.messages
          : [];

        // v3 → v4：提取旧 workflow_events 中的计划数据写入 plan-storage
        if (version !== undefined && version < 4 && sessions.length > 0) {
          migrateV3ToV4PlanData(sessions);
        }

        if (sessions.length === 0 && legacyMessages.length > 0) {
          const legacySession = createLegacySession(
            legacyMessages,
            (state.currentSpaceId as string | null) ?? null,
            state.currentSessionId as string | null
          );
          return {
            ...state,
            sessions: [sanitizeSessionForStorage(legacySession)],
            currentSessionId: legacySession.id,
            messages: []
          };
        }

        const migrated = {
          ...state,
          sessions: sessions.map(session => sanitizeSessionForStorage(session as ChatSession)),
          messages: legacyMessages.map(message => sanitizeMessageForStorage(message as Message)),
          pendingMutations: version !== undefined && version >= 6 &&
            Array.isArray(state.pendingMutations)
            ? state.pendingMutations
            : [],
        };
        return migrated;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        state.sessions.forEach(session => {
          session.messages.forEach(normalizeMessageRuntimeFields);
        });

        const currentSession = state.currentSessionId
          ? state.sessions.find(session => session.id === state.currentSessionId)
          : null;

        if (currentSession) {
          state.messages = currentSession.messages;
          state.currentSpaceId = currentSession.spaceId;
        } else {
          const latestSession = state.sessions
            .filter(session => session.spaceId === state.currentSpaceId)
            .sort((a, b) => b.updatedAt - a.updatedAt)[0];
          state.currentSessionId = latestSession?.id ?? null;
          state.messages = latestSession?.messages ?? [];
        }
        refreshSessionObserver(state.sessions);
      },
      partialize: (state) => ({
        currentAgentId: state.currentAgentId,
        currentSessionId: state.currentSessionId,
        currentSpaceId: state.currentSpaceId,
        sessions: state.sessions.map(sanitizeSessionForStorage),
        activeFormStep: state.activeFormStep,
        formStepsData: state.formStepsData,
        workflowInterrupted: state.workflowInterrupted,
        lastFormStep: state.lastFormStep,
        pendingMutations: state.pendingMutations,
        // ❌ 不需要持久化 currentWorkflowEvents，因为它只用于当前消息构建
      })
    }
  )
);

refreshSessionObserver(useChatStore.getState().sessions);

useChatStore.subscribe((state) => {
  if (suppressSessionObserver) return;
  const nextFingerprints = new Map(
    state.sessions.map(session => [session.id, sessionFingerprint(session)])
  );
  const nextSessions = new Map(state.sessions.map(session => [session.id, session]));
  const changes: ChatSyncMutation[] = [];

  for (const session of state.sessions) {
    if (sessionFingerprints.get(session.id) !== nextFingerprints.get(session.id)) {
      changes.push({
        id: createSyncMutationId(),
        kind: 'save_session_snapshot',
        sessionId: session.id,
        spaceId: session.spaceId,
        payload: persistenceApi.buildSessionSnapshot(session),
      });
    }
  }

  for (const [sessionId, previous] of observedSessions) {
    if (!nextSessions.has(sessionId)) {
      changes.push({
        id: createSyncMutationId(),
        kind: 'delete_session',
        sessionId,
        spaceId: previous.spaceId,
      });
    }
  }

  sessionFingerprints = nextFingerprints;
  observedSessions = nextSessions;
  changes.forEach(enqueueChatMutation);
});
