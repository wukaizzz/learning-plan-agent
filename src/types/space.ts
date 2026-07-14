// 1. 学科信息
export interface Subject {
  name: string;                    // "高等数学"
  currentLevel: number;            // 当前水平 0-100
  targetLevel: number;             // 目标水平
  weight: number;                  // 重要程度 0-1 (用于时间分配)
  weakPoints: string[];            // 薄弱点 ["微积分", "线性代数"]
  strongPoints: string[];          // 强项 ["概率论"]
}

// 2. 学习目标
export interface StudyGoal {
  primaryGoal: string;             // 主要目标 "期末考试85+分"
  secondaryGoals: string[];        // 次要目标 ["掌握微分方程", "提高解题速度"]
  examDate: Date;                  // 考试日期
  targetScore: number;             // 目标分数
  currentScore?: number;           // 当前水平(如果有模拟测试)
}

// 3. 时间安排
export interface TimeSchedule {
  availableHoursPerDay: number;    // 每天可用小时数
  availableDays: string[];         // 可学习的日期 ["周一", "周二", ...]
  preferredTimeSlots: string[];    // 偏好时间段 ["上午", "晚上"]
  restDays: string[];              // 休息日 ["周六下午", "周日"]
  startDate: Date;                 // 开始学习日期
}

// 4. 学习空间主结构
export interface StudySpace {
  // 基础信息
  id: string;                      // 唯一标识
  name: string;                    // 空间名称 "高数期末冲刺"
  description: string;             // 描述
  color: string;                   // 主题色 (用于UI区分)

  // 学习目标
  goal: StudyGoal;                 // 学习目标详情

  // 涉及学科
  subjects: Subject[];             // 学科列表

  // 时间安排
  schedule: TimeSchedule;          // 时间安排

  // 当前状态
  status: 'planning' | 'active' | 'paused' | 'completed';
  currentPhase: string;            // 当前阶段 "基础复习", "强化训练"

  // 元数据
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;              // 最后活跃时间

  // 统计数据
  stats: {
    totalStudyHours: number;       // 总学习小时
    consecutiveDays: number;       // 连续学习天数
    overallProgress: number;       // 总体进度 0-100
    tasksCompleted: number;        // 已完成任务数
    tasksTotal: number;            // 总任务数
  };

  // 软删除相关
  isDeleted?: boolean;             // 是否已删除
  deletedAt?: Date;                // 删除时间
  deletionScheduledAt?: Date;      // 30天彻底删除时间
}

export type SpaceSyncMutation =
  | { id: string; kind: 'save_space_snapshot'; spaceId: string; payload: StudySpace }
  | { id: string; kind: 'permanent_delete_space'; spaceId: string };

export interface SpaceSyncResult {
  status: 'synced' | 'pending';
  error: PersistenceSyncIssue | null;
}

// ============== 学习空间 Store ==============

export interface SpaceStore {
  // 状态
  spaces: StudySpace[];
  currentSpaceId: string | null;
  isLoading: boolean;
  pendingMutations: SpaceSyncMutation[];
  hydrationStatus: 'idle' | 'loading' | 'loaded' | 'error';
  syncErrorBySpace: Record<string, PersistenceSyncIssue | null>;

  // Actions
  // 创建新空间
  createSpace: (config: {
    name: string;
    goal: StudyGoal;
    subjects: Subject[];
    schedule: TimeSchedule;
    description?: string;
    color?: string;
  }) => string;

  // 切换当前空间
  switchSpace: (spaceId: string) => void;

  // 更新空间信息
  updateSpace: (spaceId: string, updates: Partial<StudySpace>) => void;

  // 删除空间
  deleteSpace: (spaceId: string) => void;

  // 获取当前空间
  getCurrentSpace: () => StudySpace | null;

  // 获取所有空间（按活跃度排序）
  getAllSpaces: () => StudySpace[];

  // 更新学习统计
  updateSpaceStats: (spaceId: string, statsUpdate: Partial<StudySpace['stats']>) => void;

  // 搜索空间
  searchSpaces: (query: string) => StudySpace[];

  // 软删除相关
  softDeleteSpace: (spaceId: string) => void;           // 软删除（30天后永久删除）
  restoreSpace: (spaceId: string) => void;              // 恢复已删除的空间
  permanentlyDeleteSpace: (spaceId: string) => void;    // 永久删除空间
  getDeletedSpaces: () => StudySpace[];                 // 获取已删除的空间列表
  hydrateSpaces: () => Promise<void>;
  flushSpaceSync: (spaceId?: string) => Promise<SpaceSyncResult>;
  clearSpaceSyncIssue: (spaceId: string) => void;

  // 🆕 字段更新相关
  updateSpaceFields: (spaceId: string, fieldsData: Record<string, unknown>) => void;  // 更新特定字段（支持嵌套路径）
}
import type { PersistenceSyncIssue } from './persistence';
