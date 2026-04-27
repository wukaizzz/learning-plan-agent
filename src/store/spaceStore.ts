import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { StudySpace, SpaceStore } from '../types/space';

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

export const useSpaceStore = create<SpaceStore>()(
  persist(
    immer((set, get) => ({
      // 初始状态
      spaces: [],
      currentSpaceId: null,
      isLoading: false,

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
        return newSpace.id;
      },

      // 切换空间
      switchSpace: (spaceId) => {
        set((state) => {
          const space = state.spaces.find(s => s.id === spaceId);
          if (space) {
            state.currentSpaceId = spaceId;
            space.lastActiveAt = new Date(); // 更新最后活跃时间
          }
        });
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
      },

      // 删除空间
      deleteSpace: (spaceId) => {
        set((state) => {
          state.spaces = state.spaces.filter(s => s.id !== spaceId);

          // 如果删除的是当前空间，切换到其他空间或设为null
          if (state.currentSpaceId === spaceId) {
            if (state.spaces.length > 0) {
              state.currentSpaceId = state.spaces[0].id;
            } else {
              state.currentSpaceId = null;  
            }
          }
        });
      },

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
            Object.assign(space.stats, statsUpdate);
            space.updatedAt = new Date();
          }
        });
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
    })),
    {
      name: 'studySpace-storage',
      partialize: (state) => ({
        spaces: state.spaces,
        currentSpaceId: state.currentSpaceId,
        // 不持久化 isLoading
      }),
    }
  )
);