// ============== 学习空间相关类型定义 ==============

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
}

// ============== 学习空间 Store ==============

interface SpaceStore {
  // 状态
  spaces: StudySpace[];
  currentSpaceId: string | null;
  isLoading: boolean;

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
}

// ============== 使用示例 ==============

// 创建一个学习空间
const exampleSpace: StudySpace = {
  id: "space_12345",
  name: "高数期末冲刺",
  description: "为期末考试做准备，目标85分以上",
  color: "#3b82f6",

  goal: {
    primaryGoal: "期末考试85+分",
    secondaryGoals: [
      "掌握微分方程基础",
      "提高线性代数解题能力",
      "熟悉概率论重点题型"
    ],
    examDate: new Date("2024-06-15"),
    targetScore: 85,
    currentScore: 72 // 基于平时成绩估算
  },

  subjects: [
    {
      name: "高等数学",
      currentLevel: 72,
      targetLevel: 90,
      weight: 0.5, // 占50%比重
      weakPoints: ["微分方程", "无穷级数"],
      strongPoints: ["极限", "导数"]
    },
    {
      name: "线性代数", 
      currentLevel: 68,
      targetLevel: 85,
      weight: 0.3, // 占30%比重
      weakPoints: ["矩阵运算", "特征值"],
      strongPoints: ["行列式"]
    },
    {
      name: "概率论",
      currentLevel: 80,
      targetLevel: 85,
      weight: 0.2, // 占20%比重
      weakPoints: ["随机变量"],
      strongPoints: ["概率计算", "分布函数"]
    }
  ],

  schedule: {
    availableHoursPerDay: 3,       // 每天3小时
    availableDays: ["周一", "周二", "周三", "周四", "周五"],
    preferredTimeSlots: ["晚上", "下午"],
    restDays: ["周六下午", "周日"],
    startDate: new Date("2024-05-20")
  },

  status: "active",
  currentPhase: "基础复习",

  createdAt: new Date("2024-05-15"),
  updatedAt: new Date("2024-05-19"),
  lastActiveAt: new Date("2024-05-19"),

  stats: {
    totalStudyHours: 12,
    consecutiveDays: 4,
    overallProgress: 15, // 刚开始15%
    tasksCompleted: 8,
    tasksTotal: 120
  }
};

// ============== 空间之间的隔离示例 ==============

// 用户可以有多个独立的学习空间：
const userSpaces: StudySpace[] = [
  {
    id: "space_1",
    name: "高数期末冲刺",
    goal: { primaryGoal: "期末85+", examDate: new Date("2024-06-15"), ... },
    subjects: [{ name: "高数", currentLevel: 72, ... }],
    schedule: { availableHoursPerDay: 3, ... },
    // ... 这个空间的所有聊天、任务、计划都独立
  },
  {
    id: "space_2", 
    name: "英语六级准备",
    goal: { primaryGoal: "六级500+", examDate: new Date("2024-06-20"), ... },
    subjects: [{ name: "英语", currentLevel: 65, ... }],
    schedule: { availableHoursPerDay: 2, ... },
    // ... 完全独立的上下文
  },
  {
    id: "space_3",
    name: "前端面试准备", 
    goal: { primaryGoal: "拿到offer", examDate: new Date("2024-07-01"), ... },
    subjects: [{ name: "JavaScript", ... }, { name: "React", ... }],
    schedule: { availableHoursPerDay: 4, ... },
    // ... 又是一个独立的学习项目
  }
];

// ============== 空间隔离的好处 ==============

/*
1. **上下文隔离**：每个空间的对话历史、计划版本、任务都独立
2. **专注管理**：避免多个学习目标混在一起混乱
3. **进度独立**：每个空间有自己的进度追踪和分析
4. **灵活切换**：可以在不同学习项目间快速切换
5. **数据隔离**：一个空间的调整不影响其他空间

就像你有不同的"学习工作区"，每个工作区专门处理一个学习目标。
*/
