import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ChatStore, Message, ChatSession, WorkspaceState } from '../types/chat';
import type { UIBlock } from '../types/uiBlocks';

const generateId = () => `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

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

      addMessage: (message: Message) => set((state) => {
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
        state.currentAgentId = agentId;
      }),

      setStreaming: (isStreaming: boolean) => set((state) => {
        state.isStreaming = isStreaming;
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

        // Update in sessions
        state.sessions.forEach(session => {
          session.messages.forEach(msg => {
            if (msg.tool_calls) {
              const toolCall = msg.tool_calls.find(tc => tc.id === toolCallId);
              if (toolCall) {
                Object.assign(toolCall, updates);
              }
            }
          });
        });
      }),

      updateMessage: (messageId: string, content: string) => set((state) => {
        const message = state.messages.find(msg => msg.id === messageId);
        if (message) {
          message.content = content;
        }

        // Update in sessions
        state.sessions.forEach(session => {
          const message = session.messages.find(msg => msg.id === messageId);
          if (message) {
            message.content = content;
          }
        });
      }),

      deleteMessage: (messageId: string) => set((state) => {
        state.messages = state.messages.filter(msg => msg.id !== messageId);

        // Delete from sessions
        state.sessions.forEach(session => {
          session.messages = session.messages.filter(msg => msg.id !== messageId);
        });
      }),

      addToolCall: (messageId: string, toolCall) => set((state) => {
        const message = state.messages.find(msg => msg.id === messageId);
        if (message) {
          if (!message.tool_calls) {
            message.tool_calls = [];
          }
          message.tool_calls.push(toolCall);
        }

        // Add to sessions
        state.sessions.forEach(session => {
          const message = session.messages.find(msg => msg.id === messageId);
          if (message) {
            if (!message.tool_calls) {
              message.tool_calls = [];
            }
            message.tool_calls.push(toolCall);
          }
        });
      }),

      updateLastAssistantMessage: (content: string) => set((state) => {
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
            }
          }
        }
      }),

      // Session management
      createNewSession: (title?: string, spaceId?: string | null) => {
        const sessionId = generateId();
        const newSession: ChatSession = {
          id: sessionId,
          spaceId: spaceId || get().currentSpaceId, // 关联到当前空间或指定的空间
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
          if (spaceId) {
            state.currentSpaceId = spaceId;
          }
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
            if (state.sessions.length > 0) {
              const nextSession = state.sessions[0];
              state.currentSessionId = nextSession.id;
              state.messages = nextSession.messages;
            } else {
              state.currentSessionId = null;
              state.messages = [];
            }
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
          });
        }
      },

      // 🆕 工作流和Block管理
      setWorkspaceState: (newState: WorkspaceState) => set((state) => {
        state.workspaceState = newState;
      }),

      setUIBlocks: (blocks: UIBlock[]) => set((state) => {
        state.uiBlocks = blocks;
      }),

      addUIBlock: (block: UIBlock) => set((state) => {
        state.uiBlocks.push(block);
      }),

      clearUIBlocks: () => set((state) => {
        state.uiBlocks = [];
      }),

      getWorkspaceState: () => {
        const state = get();
        return state.workspaceState;
      },

      // 🆕 Scroll position management
      saveScrollPosition: (sessionId: string, position: number) => set((state) => {
        const session = state.sessions.find(s => s.id === sessionId);
        if (session) {
          session.scrollPosition = position;
        }
      }),

      getScrollPosition: (sessionId: string) => {
        const state = get();
        const session = state.sessions.find(s => s.id === sessionId);
        return session?.scrollPosition || 0;
      }
    })),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        messages: state.messages,
        currentAgentId: state.currentAgentId,
        currentSessionId: state.currentSessionId,
        currentSpaceId: state.currentSpaceId,
        sessions: state.sessions
      })
    }
  )
);
