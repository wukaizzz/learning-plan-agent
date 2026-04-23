# AI 学习规划 Agent Web App 详细实施计划

## 🎯 项目愿景

构建一个**Agent驱动的学习规划工作台**，根据用户的学习目标、时间安排、学科优先级和执行反馈，生成可执行、可调整、可追踪的学习计划。核心特点是**Generative UI** - AI输出主要转化为结构化界面组件，而非自由文本。

## 📋 核心架构设计

### 1. 三栏式布局
```
┌─────────────┬─────────────────┬─────────────────┐
│  学习空间    │   Agent聊天区    │   Generative UI │
│   列表      │   (对话交互)     │     工作区      │
│            │                 │  (计划卡片、    │
│ 📚 高数     │ 👤 用户: 我周三  │   任务列表、    │
│ 📖 英语     │    没空          │   进度面板)     │
│ 💻 前端     │                 │                 │
│            │ 🤖 Agent: 好的， │  ┌───────────┐ │
│ ➕ 新建     │    我会调整...   │  │ 📊 75%    │ │
└─────────────┴─────────────────┴─────────────────┘
```

### 2. Generative UI System
```typescript
// Agent输出结构化block
{
  "blocks": [
    { "type": "summary-card", "data": {...} },
    { "type": "study-timeline", "data": {...} },
    { "type": "daily-task-list", "data": {...} }
  ]
}

// 前端Component Registry映射
const COMPONENT_REGISTRY = {
  "summary-card": SummaryCardComponent,
  "study-timeline": StudyTimelineComponent,
  "daily-task-list": DailyTaskListComponent,
  // ...
}
```

### 3. 数据模型
```typescript
// 核心实体关系
StudySpace (学习空间)
  ├── PlanVersion[] (计划版本)
  ├── StudyTask[] (学习任务)
  ├── ChatMessage[] (聊天记录)
  └── ProgressLog[] (进度日志)
```

## 🚀 分阶段实施计划

### 🎯 Phase 1: 核心架构 (Week 1-2)

#### 1.1 依赖安装和配置
```bash
# 安装核心依赖
pnpm add zod date-fns recharts @dnd-kit/core @dnd-kit/sortable
pnpm add react-big-calendar date-fns
```

#### 1.2 Schema系统设计
**文件**: `src/core/schema/uiBlocks.ts`

```typescript
import { z } from 'zod';

// UI Block Schema定义
export const UIBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('summary-card'),
    data: z.object({
      goal: z.string(),
      deadline: z.string(),
      progress: z.number(),
      riskLevel: z.enum(['low', 'medium', 'high'])
    })
  }),
  z.object({
    type: z.literal('study-timeline'),
    data: z.object({
      timeline: z.array(z.object({
        date: z.string(),
        tasks: z.array(z.string())
      }))
    })
  }),
  // ... 其他block类型
]);

export type UIBlock = z.infer<typeof UIBlockSchema>;
```

#### 1.3 Component Registry
**文件**: `src/core/schema/componentRegistry.ts`

```typescript
import { SummaryCard } from '../../components/ui-blocks/SummaryCard';
import { StudyTimeline } from '../../components/ui-blocks/StudyTimeline';
// ...

export const COMPONENT_REGISTRY = {
  'summary-card': SummaryCard,
  'study-timeline': StudyTimeline,
  // ...
} as const;

export type BlockType = keyof typeof COMPONENT_REGISTRY;
```

#### 1.4 学习空间Store
**文件**: `src/store/spaceStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StudySpace {
  id: string;
  name: string;
  goal: string;
  deadline: Date;
  subjects: string[];
  createdAt: Date;
}

interface SpaceStore {
  spaces: StudySpace[];
  currentSpaceId: string | null;
  
  createSpace: (data: Omit<StudySpace, 'id' | 'createdAt'>) => string;
  switchSpace: (spaceId: string) => void;
  deleteSpace: (spaceId: string) => void;
  updateSpace: (spaceId: string, data: Partial<StudySpace>) => void;
}
```

#### 1.5 基础UI组件
- [ ] SpaceList - 学习空间列表
- [ ] SpaceCard - 空间卡片组件
- [ ] SpaceCreator - 创建空间对话框
- [ ] SummaryCard - 概况卡片
- [ ] StudyTimeline - 学习时间轴

### 🎯 Phase 2: 计划生成系统 (Week 3-4)

#### 2.1 计划生成引擎
**文件**: `src/core/engine/planGenerator.ts`

```typescript
interface PlanInput {
  goal: string;
  deadline: Date;
  availableTime: number; // 每天可用小时数
  subjects: Subject[];
  currentLevel: Record<string, number>; // 各科当前水平
  priorities: string[]; // 学科优先级
}

interface PlanOutput {
  timeline: DailyPlan[];
  tasks: StudyTask[];
  riskAnalysis: Risk[];
  recommendations: string[];
}

export class PlanGenerator {
  async generatePlan(input: PlanInput): Promise<PlanOutput> {
    // 1. 分析学习目标和时间
    // 2. 计算各科所需时间
    // 3. 生成学习时间轴
    // 4. 拆解具体任务
    // 5. 分析风险和提供建议
  }
}
```

#### 2.2 任务拆解算法
**文件**: `src/core/engine/taskBreakdown.ts`

```typescript
export class TaskBreakdown {
  breakdownPlan(
    plan: PlanOutput,
    preferences: TaskPreferences
  ): StudyTask[] {
    // 1. 将计划拆解为每日任务
    // 2. 根据学习曲线分配难度
    // 3. 添加复习和练习任务
    // 4. 设置优先级和截止时间
  }
}
```

#### 2.3 Agent对话集成
**文件**: `src/core/agent/StudyAgent.ts`

```typescript
export class StudyAgent {
  async processMessage(
    message: string,
    context: SpaceContext
  ): Promise<{
    textResponse?: string;
    uiBlocks?: UIBlock[];
    planUpdates?: Partial<PlanOutput>;
  }> {
    // 1. 分析用户意图
    // 2. 提取关键信息
    // 3. 生成相应的UI blocks
    // 4. 必要时调用计划生成引擎
  }
}
```

#### 2.4 计划版本管理
**文件**: `src/store/planStore.ts`

```typescript
interface PlanVersion {
  id: string;
  spaceId: string;
  version: number;
  createdAt: Date;
  status: 'active' | 'archived';
  planData: PlanOutput;
  changes: string[]; // 与前一版本的差异
}

interface PlanStore {
  versions: PlanVersion[];
  currentVersionId: string | null;
  
  createVersion: (spaceId: string, planData: PlanOutput) => string;
  switchVersion: (versionId: string) => void;
  compareVersions: (v1: string, v2: string) => VersionDiff[];
}
```

### 🎯 Phase 3: 任务与进度系统 (Week 5-6)

#### 3.1 任务管理系统
**文件**: `src/store/taskStore.ts`

```typescript
interface StudyTask {
  id: string;
  spaceId: string;
  planId: string;
  title: string;
  subject: string;
  date: Date;
  duration: number; // 分钟
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'cancelled' | 'rescheduled';
  taskType: 'study' | 'review' | 'practice' | 'exam';
  completedAt?: Date;
}

interface TaskStore {
  tasks: StudyTask[];
  
  createTask: (task: Omit<StudyTask, 'id'>) => string;
  updateTaskStatus: (taskId: string, status: StudyTask['status']) => void;
  rescheduleTask: (taskId: string, newDate: Date) => void;
  getTasksForDate: (date: Date) => StudyTask[];
  getTasksBySubject: (subject: string) => StudyTask[];
}
```

#### 3.2 学习Dashboard组件
**文件**: `src/components/dashboard/`

- [ ] **ProgressPanel.tsx** - 进度面板
  - 总体完成率
  - 连续学习天数
  - 各科投入时间

- [ ] **StudyStats.tsx** - 学习统计
  - 学习时长图表
  - 学科分布饼图
  - 进度趋势图

- [ ] **RiskAlert.tsx** - 风险预警
  - 进度滞后警告
  - 时间压力提示
  - 薄弱科目提醒

- [ ] **FocusTasks.tsx** - 重点任务
  - 今日重点任务
  - 即将到期任务
  - 高优先级任务

#### 3.3 任务操作界面
- [ ] **TaskList.tsx** - 任务列表
- [ ] **TaskCard.tsx** - 任务卡片
- [ ] **TaskCalendar.tsx** - 任务日历视图
- [ ] **TaskDragDrop.tsx** - 拖拽重排功能

### 🎯 Phase 4: 智能重规划 (Week 7-8)

#### 4.1 执行反馈系统
```typescript
interface ExecutionFeedback {
  taskId: string;
  plannedDuration: number;
  actualDuration: number;
  completed: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  notes?: string;
}
```

#### 4.2 动态重规划引擎
**文件**: `src/core/engine/adaptivePlanner.ts`

```typescript
export class AdaptivePlanner {
  replanBasedOnFeedback(
    currentPlan: PlanOutput,
    feedback: ExecutionFeedback[]
  ): PlanOutput {
    // 1. 分析执行偏差
    // 2. 调整后续任务难度
    // 3. 重新分配时间
    // 4. 更新风险评估
  }
}
```

#### 4.3 智能调整功能
- [ ] 基于完成率调整后续计划
- [ ] 自动识别学习瓶颈
- [ ] 优化时间分配
- [ ] 动态优先级调整

### 🎯 Phase 5: 完善与优化 (Week 9-10)

#### 5.1 数据持久化
- [ ] LocalStorage集成
- [ ] IndexedDB备份
- [ ] 数据导入导出
- [ ] 状态同步机制

#### 5.2 用户体验优化
- [ ] 响应式设计
- [ ] 移动端适配
- [ ] 快捷键支持
- [ ] 加载状态优化

#### 5.3 测试和部署
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能优化
- [ ] 生产部署

## 📁 关键文件创建清单

### 核心系统
- [ ] `src/core/schema/uiBlocks.ts` - UI Block Schema
- [ ] `src/core/schema/componentRegistry.ts` - 组件注册表
- [ ] `src/core/engine/planGenerator.ts` - 计划生成引擎
- [ ] `src/core/engine/taskBreakdown.ts` - 任务拆解
- [ ] `src/core/engine/adaptivePlanner.ts` - 自适应规划
- [ ] `src/core/agent/StudyAgent.ts` - 学习规划Agent

### 状态管理
- [ ] `src/store/spaceStore.ts` - 学习空间Store
- [ ] `src/store/planStore.ts` - 计划版本Store
- [ ] `src/store/taskStore.ts` - 任务Store
- [ ] `src/store/chatStore.ts` - 聊天Store (重构)

### UI组件
- [ ] `src/components/workspace/` - 学习空间组件
- [ ] `src/components/planning/` - 计划相关组件
- [ ] `src/components/tasks/` - 任务管理组件
- [ ] `src/components/dashboard/` - 数据可视化组件
- [ ] `src/components/ui-blocks/` - Generative UI组件

### 类型定义
- [ ] `src/types/space.ts` - 学习空间类型
- [ ] `src/types/plan.ts` - 计划相关类型
- [ ] `src/types/task.ts` - 任务类型
- [ ] `src/types/uiBlocks.ts` - UI Block类型

## 🔧 技术实现要点

### 1. Schema-Driven UI
```typescript
// Agent输出验证
const validatedBlocks = UIBlockSchema.parse(rawBlocks);

// 动态渲染
{validatedBlocks.map(block => {
  const Component = COMPONENT_REGISTRY[block.type];
  return <Component key={block.id} data={block.data} />;
})}
```

### 2. 上下文管理
```typescript
// 混合上下文策略
interface SpaceContext {
  recentMessages: ChatMessage[];      // 最近5条消息
  summary: string;                     // 历史对话摘要
  structuredState: {                   // 结构化状态
    currentPlan: PlanOutput;
    taskProgress: TaskProgress;
    learningStats: LearningStats;
  };
}
```

### 3. Agent输出处理
```typescript
// Agent响应格式
interface AgentResponse {
  message?: string;                    // 文本回复（可选）
  blocks: UIBlock[];                   // 结构化UI blocks
  planUpdate?: PlanOutput;             // 计划更新（可选）
  suggestions?: string[];              // 建议操作（可选）
}
```

## 📊 成功指标

### 功能完整性
- ✅ 支持多学习空间管理
- ✅ 生成可执行的学习计划
- ✅ 动态任务调整和重规划
- ✅ 完整的进度追踪和可视化
- ✅ 智能风险预警和建议

### 用户体验
- ✅ 直观的Generative UI界面
- ✅ 流畅的交互体验
- ✅ 准确的规划算法
- ✅ 有用的学习建议

### 技术质量
- ✅ 类型安全的Schema系统
- ✅ 可维护的组件架构
- ✅ 高效的状态管理
- ✅ 良好的代码组织

## 🎯 下一步行动

### 立即开始 (Week 1)
1. **安装依赖** - 添加Zod、date-fns等核心库
2. **创建Schema系统** - 定义UI Block Schema和验证
3. **建立Component Registry** - 组件注册表基础架构
4. **设计学习空间模型** - 空间数据结构和Store

### 第一阶段目标
- ✅ 完成核心Schema系统
- ✅ 实现基础学习空间功能
- ✅ 创建第一批UI Block组件
- ✅ 建立基础对话流程

---

**项目转型**: 从通用AI聊天 → 学习规划专用Agent  
**核心价值**: Agent驱动的可执行学习计划，而非简单问答  
**技术亮点**: Schema-Driven Generative UI系统  
**最终目标**: 帮助学生更高效地规划和执行学习任务