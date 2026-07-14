import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useChatStore } from './chatStore';
import { usePlanStore } from './planStore';
import type {
  SpaceStore,
  SpaceSyncMutation,
  SpaceSyncResult,
  StudySpace,
} from '../types/space';
import * as persistenceApi from '@/services/spaceChatPersistenceApi';
import {
  isPersistenceApiError,
  toPersistenceSyncIssue,
} from '@/services/persistenceClient';

// 生成唯一ID
const generateSpaceId = () => `space_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

// 默认颜色选项
const DEFAULT_COLORS = [
  '#3b82f6', // 蓝色
  '#10b981', // 绿色
  '#f59e0b', // 橙色
  '#ef4444', // 红色
  '#8b5cf6', // 紫色
  '#ec4899', // 粉色
  '#06b6d4', // 青色
  '#84cc16', // 黄绿色
];

// 获取随机颜色
const getRandomColor = () => DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];

const spaceSyncPromises = new Map<string, Promise<SpaceSyncResult>>();
const spaceSyncTimers = new Map<string, number>();
let spaceHydrationPromise: Promise<void> | null = null;

const createMutationId = () => (
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `space-sync-${crypto.randomUUID()}`
    : `space-sync-${Date.now()}-${Math.random().toString(36).slice(2)}`
);

const normalizeDate = (value: Date | string | number | undefined, fallback = Date.now()) => {
  const date = value instanceof Date ? value : new Date(value ?? fallback);
  return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
};

const normalizeSpaceDates = (space: StudySpace): StudySpace => ({
  ...space,
  goal: {
    ...space.goal,
    examDate: normalizeDate(space.goal?.examDate),
  },
  schedule: {
    ...space.schedule,
    startDate: normalizeDate(space.schedule?.startDate),
  },
  createdAt: normalizeDate(space.createdAt),
  updatedAt: normalizeDate(space.updatedAt),
  lastActiveAt: normalizeDate(space.lastActiveAt),
  deletedAt: space.deletedAt ? normalizeDate(space.deletedAt) : undefined,
  deletionScheduledAt: space.deletionScheduledAt
    ? normalizeDate(space.deletionScheduledAt)
    : undefined,
});

const compactSpaceMutations = (
  mutations: SpaceSyncMutation[],
  mutation: SpaceSyncMutation
) => {
  if (mutation.kind === 'permanent_delete_space') {
    return [
      ...mutations.filter(item => item.spaceId !== mutation.spaceId),
      mutation,
    ];
  }
  return [
    ...mutations.filter(item => item.spaceId !== mutation.spaceId),
    mutation,
  ];
};

async function executeSpaceMutation(mutation: SpaceSyncMutation) {
  if (mutation.kind === 'save_space_snapshot') {
    await persistenceApi.saveSpace(mutation.payload);
    return;
  }
  await persistenceApi.permanentlyDeleteSpace(mutation.spaceId);
}

function applyRemoteSpaceConflict(spaceId: string, current: persistenceApi.RemoteSpace) {
  const remoteSpace = persistenceApi.deserializeSpace(current);
  useSpaceStore.setState(state => {
    const spaces = state.spaces.some(space => space.id === spaceId)
      ? state.spaces.map(space => space.id === spaceId ? remoteSpace : space)
      : [...state.spaces, remoteSpace];
    const currentSpaceId = state.currentSpaceId === spaceId && remoteSpace.isDeleted
      ? spaces.find(space => !space.isDeleted)?.id ?? null
      : state.currentSpaceId;
    return { spaces, currentSpaceId };
  });
}

function runSpaceSync(spaceId: string): Promise<SpaceSyncResult> {
  const existing = spaceSyncPromises.get(spaceId);
  if (existing) return existing;

  const promise = (async (): Promise<SpaceSyncResult> => {
    while (true) {
      const mutation = useSpaceStore.getState().pendingMutations
        .find(item => item.spaceId === spaceId);
      if (!mutation) {
        useSpaceStore.setState(state => ({
          syncErrorBySpace: { ...state.syncErrorBySpace, [spaceId]: null },
        }));
        void usePlanStore.getState().flushPlanSync(spaceId);
        void useChatStore.getState().flushChatSync();
        return { status: 'synced', error: null };
      }
      try {
        await executeSpaceMutation(mutation);
        useSpaceStore.setState(state => ({
          pendingMutations: state.pendingMutations.filter(item => item.id !== mutation.id),
          syncErrorBySpace: { ...state.syncErrorBySpace, [spaceId]: null },
        }));
      } catch (error) {
        const issue = toPersistenceSyncIssue(error);
        if (
          isPersistenceApiError(error) &&
          error.code === 'STALE_WRITE_CONFLICT'
        ) {
          const mutationIsCurrent = useSpaceStore.getState().pendingMutations
            .some(item => item.id === mutation.id);
          if (!mutationIsCurrent) {
            continue;
          }
          const current = (error.details as { current?: persistenceApi.RemoteSpace } | undefined)
            ?.current;
          if (current) applyRemoteSpaceConflict(spaceId, current);
          useSpaceStore.setState(state => ({
            pendingMutations: state.pendingMutations.filter(item => item.id !== mutation.id),
            syncErrorBySpace: { ...state.syncErrorBySpace, [spaceId]: issue },
          }));
          return { status: 'synced', error: issue };
        }
        useSpaceStore.setState(state => ({
          syncErrorBySpace: { ...state.syncErrorBySpace, [spaceId]: issue },
        }));
        return { status: 'pending', error: issue };
      }
    }
  })().finally(() => {
    spaceSyncPromises.delete(spaceId);
  });

  spaceSyncPromises.set(spaceId, promise);
  return promise;
}

function enqueueSpaceMutation(mutation: SpaceSyncMutation, immediate = false) {
  useSpaceStore.setState(state => ({
    pendingMutations: compactSpaceMutations(state.pendingMutations, mutation),
  }));
  const existingTimer = spaceSyncTimers.get(mutation.spaceId);
  if (existingTimer) window.clearTimeout(existingTimer);
  spaceSyncTimers.delete(mutation.spaceId);

  if (immediate || mutation.kind === 'permanent_delete_space') {
    void runSpaceSync(mutation.spaceId);
    return;
  }

  const timer = window.setTimeout(() => {
    spaceSyncTimers.delete(mutation.spaceId);
    void runSpaceSync(mutation.spaceId);
  }, 500);
  spaceSyncTimers.set(mutation.spaceId, timer);
}

async function hydrateSpaces() {
  if (spaceHydrationPromise) return spaceHydrationPromise;
  spaceHydrationPromise = (async () => {
    useSpaceStore.setState({ hydrationStatus: 'loading' });
    const spaceIds = new Set(
      useSpaceStore.getState().pendingMutations.map(mutation => mutation.spaceId)
    );
    await Promise.all(Array.from(spaceIds, spaceId => runSpaceSync(spaceId)));
    try {
      const remoteSpaces = await persistenceApi.listSpaces(true);
      const state = useSpaceStore.getState();
      const pendingIds = new Set(state.pendingMutations.map(item => item.spaceId));
      const pendingLocalSpaces = state.spaces.filter(space => pendingIds.has(space.id));
      const remoteIds = new Set(remoteSpaces.map(space => space.id));
      const nextSpaces = [
        ...remoteSpaces.filter(space => !pendingIds.has(space.id)),
        ...pendingLocalSpaces.filter(space => !remoteIds.has(space.id) || pendingIds.has(space.id)),
      ];
      const currentSpaceId = state.currentSpaceId &&
        nextSpaces.some(space => space.id === state.currentSpaceId)
        ? state.currentSpaceId
        : nextSpaces.find(space => !space.isDeleted)?.id ?? null;
      useSpaceStore.setState({
        spaces: nextSpaces,
        currentSpaceId,
        hydrationStatus: 'loaded',
      });
    } catch (error) {
      useSpaceStore.setState({ hydrationStatus: 'error' });
      throw error;
    }
  })().finally(() => {
    spaceHydrationPromise = null;
  });
  return spaceHydrationPromise;
}

export const useSpaceStore = create<SpaceStore>()(
  persist(
    immer((set, get) => ({
      // 初始状态
      spaces: [],
      currentSpaceId: null,
      isLoading: false,
      pendingMutations: [],
      hydrationStatus: 'idle',
      syncErrorBySpace: {},

      // 创建新学习空间
      createSpace: (config) => {
        const newSpace: StudySpace = {
          id: generateSpaceId(),
          name: config.name,
          description: config.description || '',
          color: config.color || getRandomColor(),
          goal: config.goal,
          subjects: config.subjects,
          schedule: config.schedule,
          status: 'planning',
          currentPhase: '准备阶段',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastActiveAt: new Date(),
          stats: {
            totalStudyHours: 0,
            consecutiveDays: 0,
            overallProgress: 0,
            tasksCompleted: 0,
            tasksTotal: 0,
          },
        };
        set((state)=>{
          state.spaces.push(newSpace);
          state.currentSpaceId = newSpace.id;
        })
        enqueueSpaceMutation({
          id: createMutationId(),
          kind: 'save_space_snapshot',
          spaceId: newSpace.id,
          payload: newSpace,
        }, true);
        return newSpace.id;
      },

      // 切换空间
      switchSpace: (spaceId) => {
        set((state) => {
          const space = state.spaces.find(s => s.id === spaceId);
          if (space) {
            state.currentSpaceId = spaceId;
            const now = new Date();
            space.lastActiveAt = now;
            space.updatedAt = now;
          }
        });
        const space = get().spaces.find(item => item.id === spaceId);
        if (space) {
          enqueueSpaceMutation({
            id: createMutationId(),
            kind: 'save_space_snapshot',
            spaceId,
            payload: space,
          });
        }
      },
      // 更新空间信息
      updateSpace: (spaceId, updates) => {
        set((state) => {
          const spaceIndex = state.spaces.findIndex(s => s.id === spaceId);
          if (spaceIndex !== -1) {
            Object.assign(state.spaces[spaceIndex], updates);
            state.spaces[spaceIndex].updatedAt = new Date();
          }
        });
        const space = get().spaces.find(item => item.id === spaceId);
        if (space) {
          enqueueSpaceMutation({
            id: createMutationId(),
            kind: 'save_space_snapshot',
            spaceId,
            payload: space,
          });
        }
      },

      // 删除空间
      deleteSpace: (spaceId) => get().permanentlyDeleteSpace(spaceId),

      // 获取当前空间
      getCurrentSpace: () => {
        const state = get();
        if (!state.currentSpaceId) return null;
        return state.spaces.find(s => s.id === state.currentSpaceId) || null;
      },

      // 获取所有空间（按活跃度排序）
      getAllSpaces: () => {
        const state = get();
        return [...state.spaces]
          .filter(s => !s.isDeleted) // 只返回未删除的空间
          .sort((a, b) =>
            new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
          );
      },

      // 更新学习统计
      updateSpaceStats: (spaceId, statsUpdate) => {
        set((state) => {
          const space = state.spaces.find(s => s.id === spaceId);
          if (space) {
            space.stats = { ...space.stats, ...statsUpdate };
            space.updatedAt = new Date();
          }
        });
        const space = get().spaces.find(item => item.id === spaceId);
        if (space) {
          enqueueSpaceMutation({
            id: createMutationId(),
            kind: 'save_space_snapshot',
            spaceId,
            payload: space,
          });
        }
      },

      // 搜索空间
      searchSpaces: (query) => {
        const state = get();
        const lowerQuery = query.toLowerCase();
        return state.spaces.filter(space =>
          !space.isDeleted && (
            space.name.toLowerCase().includes(lowerQuery) ||
            space.description.toLowerCase().includes(lowerQuery) ||
            space.goal.primaryGoal.toLowerCase().includes(lowerQuery)
          )
        );
      },

      // 软删除学习空间（30天后永久删除）
      softDeleteSpace: (spaceId) => {
        set((state) => {
          const space = state.spaces.find(s => s.id === spaceId);
          if (space && !space.isDeleted) {
            space.isDeleted = true;
            space.deletedAt = new Date();
            space.deletionScheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天后
            space.updatedAt = new Date();

            // 如果删除的是当前空间，切换到其他活跃空间
            if (state.currentSpaceId === spaceId) {
              const activeSpaces = state.spaces.filter(s => !s.isDeleted);
              state.currentSpaceId = activeSpaces.length > 0 ? activeSpaces[0].id : null;
            }
          }
        });
        const space = get().spaces.find(item => item.id === spaceId);
        if (space) {
          enqueueSpaceMutation({
            id: createMutationId(),
            kind: 'save_space_snapshot',
            spaceId,
            payload: space,
          }, true);
        }
      },

      // 恢复已删除的学习空间
      restoreSpace: (spaceId) => {
        set((state) => {
          const space = state.spaces.find(s => s.id === spaceId);
          if (space && space.isDeleted) {
            space.isDeleted = false;
            space.deletedAt = undefined;
            space.deletionScheduledAt = undefined;
            space.updatedAt = new Date();
            space.lastActiveAt = new Date(); // 更新活跃时间
          }
        });
        const space = get().spaces.find(item => item.id === spaceId);
        if (space) {
          enqueueSpaceMutation({
            id: createMutationId(),
            kind: 'save_space_snapshot',
            spaceId,
            payload: space,
          }, true);
        }
      },

      // 🆕 更新空间的特定字段（支持嵌套路径，如 "goal.examDate"）
      updateSpaceFields: (spaceId: string, fieldsData: Record<string, unknown>) => {
        set((state) => {
          const space = state.spaces.find(s => s.id === spaceId);
          if (!space) return;

          // 遍历所有字段数据
          Object.entries(fieldsData).forEach(([fieldPath, value]) => {
            const parts = fieldPath.split('.');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic nested path traversal
            let current = space as any;

            // 遍历路径，找到要更新的对象
            for (let i = 0; i < parts.length - 1; i++) {
              const part = parts[i];

              // 处理数组字段（如 subjects[]）
              if (part.endsWith('[]')) {
                // 对于数组字段，暂时跳过或者特殊处理
                continue;
              }

              if (!current[part]) {
                current[part] = {};
              }
              current = current[part];
            }

            // 设置最终值
            const lastPart = parts[parts.length - 1];

            // 处理数组字段（如 subjects）
            if (lastPart.endsWith('[]')) {
              const arrayField = lastPart.slice(0, -2);
              if (!current[arrayField]) {
                current[arrayField] = [];
              }
              // 如果是数组，合并值
              if (Array.isArray(value)) {
                current[arrayField] = [...current[arrayField], ...value];
              } else {
                current[arrayField].push(value);
              }
            } else {
              current[lastPart] = value;
            }
          });

          space.updatedAt = new Date();
          space.lastActiveAt = new Date();
        });
        const space = get().spaces.find(item => item.id === spaceId);
        if (space) {
          enqueueSpaceMutation({
            id: createMutationId(),
            kind: 'save_space_snapshot',
            spaceId,
            payload: space,
          });
        }
      },

      // 永久删除学习空间
      permanentlyDeleteSpace: (spaceId) => {
        set((state) => {
          state.spaces = state.spaces.filter(s => s.id !== spaceId);

          // 如果删除的是当前空间，切换到其他活跃空间
          if (state.currentSpaceId === spaceId) {
            const activeSpaces = state.spaces.filter(s => !s.isDeleted);
            state.currentSpaceId = activeSpaces.length > 0 ? activeSpaces[0].id : null;
          }
        });
        useChatStore.getState().deleteSessionsBySpace(spaceId);
        usePlanStore.setState(state => {
          const planIds = state.plans
            .filter(plan => plan.spaceId === spaceId)
            .map(plan => plan.id);
          return {
            plans: state.plans.filter(plan => plan.spaceId !== spaceId),
            tasks: state.tasks.filter(task => !planIds.includes(task.planId)),
            blocks: state.blocks.filter(block => !planIds.includes(block.planId)),
            executions: state.executions.filter(execution => execution.spaceId !== spaceId),
            pendingMutations: state.pendingMutations.filter(
              mutation => mutation.spaceId !== spaceId
            ),
          };
        });
        enqueueSpaceMutation({
          id: createMutationId(),
          kind: 'permanent_delete_space',
          spaceId,
        });
      },

      // 获取已删除的空间列表
      getDeletedSpaces: () => {
        const state = get();
        return state.spaces
          .filter(s => s.isDeleted)
          .sort((a, b) => {
            const aTime = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
            const bTime = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
            return bTime - aTime; // 按删除时间倒序
          });
      },

      hydrateSpaces,

      flushSpaceSync: async (spaceId?: string) => {
        const ids = spaceId
          ? [spaceId]
          : Array.from(new Set(get().pendingMutations.map(item => item.spaceId)));
        ids.forEach(id => {
          const timer = spaceSyncTimers.get(id);
          if (timer) window.clearTimeout(timer);
          spaceSyncTimers.delete(id);
        });
        const results = await Promise.all(ids.map(runSpaceSync));
        const pending = results.find(result => result.status === 'pending');
        return pending || { status: 'synced', error: null };
      },

      clearSpaceSyncIssue: (spaceId: string) => {
        set(state => {
          state.syncErrorBySpace[spaceId] = null;
        });
      },
    })),
    {
      name: 'studySpace-storage',
      version: 2,
      migrate: (persistedState: unknown, version?: number) => {
        const state = persistedState && typeof persistedState === 'object'
          ? persistedState as Partial<SpaceStore>
          : {};
        return {
          ...state,
          spaces: Array.isArray(state.spaces)
            ? state.spaces.map(space => normalizeSpaceDates(space))
            : [],
          pendingMutations: version !== undefined && version >= 2 &&
            Array.isArray(state.pendingMutations)
            ? state.pendingMutations
            : [],
        };
      },
      partialize: (state) => ({
        spaces: state.spaces,
        currentSpaceId: state.currentSpaceId,
        pendingMutations: state.pendingMutations,
        // 不持久化 isLoading
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.spaces = state.spaces.map(normalizeSpaceDates);
      },
    }
  )
);
