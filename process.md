# AI 学习规划 Agent Web App 项目概览

> **最后更新**: 2026-04-27
> **项目状态**: 基础架构完成，核心功能开发阶段
> **产品定位**: 学生/自学者学习规划工作台 + 学习空间管理系统

## 📋 项目简介

这是一个面向学生/自学者的 AI 学习规划 Agent Web App。项目核心目标是：根据用户的学习目标、考试日期、可投入时间、薄弱科目和执行反馈，生成可执行、可调整、可追踪的学习计划，并通过 **generative UI** 的方式把结果渲染为任务卡片、时间轴、进度面板、风险提示和可编辑表单，而不是只返回文本建议。

### 🎯 核心价值
- **Agent驱动界面** - AI输出主要转化为结构化UI block，而非长文本
- **动态学习规划** - 根据执行反馈、时间变化自动调整计划
- **可执行任务系统** - 把学习计划拆解为具体的daily tasks
- **学习可视化** - 完成率、投入时间、风险预警的实时展示

## 🏗️ 技术栈与架构

### 核心技术重点
- **Schema-Driven Generative UI** - TypeScript + Zod定义UI block schema
- **Component Registry** - type映射到React组件的注册系统
- **状态管理** - 学习空间、任务、计划版本的分离管理
- **上下文管理** - 近期消息 + 摘要 + 结构化状态的混合方式

### 前端技术栈
- **React 19** + TypeScript + Vite
- **Zustand** + Immer - 学习状态管理
- **Tailwind CSS** + shadcn/ui - UI组件
- **Anthropic SDK** - Claude AI集成
- **Zod** - Schema验证和类型推导

### 新增核心依赖 (待安装)
```json
{
  "zod": "^3.x",           // Schema定义和验证
  "date-fns": "^3.x",      // 日期处理和计算
  "recharts": "^2.x",      // 学习数据可视化
  "dnd-kit": "^6.x",       // 任务拖拽排序
  "react-big-calendar": "^1.x" // 学习日历视图
}
```

## 📁 项目架构 (重构规划)

### 新的项目结构
```
src/
├── core/                       # 核心系统
│   ├── agent/                 # 学习规划Agent
│   │   ├── StudyAgent.ts     # 主Agent逻辑
│   │   ├── planGenerator.ts  # 计划生成引擎
│   │   └── contextManager.ts # 对话上下文管理
│   ├── schema/                # Generative UI Schema
│   │   ├── uiBlocks.ts       # UI Block定义
│   │   ├── componentRegistry.ts # 组件注册表
│   │   └── validators.ts     # Zod验证器
│   └── engine/                # 规划引擎
│       ├── taskBreakdown.ts  # 任务拆解
│       ├── timeOptimizer.ts  # 时间优化
│       └── riskAnalyzer.ts   # 风险分析
│
├── components/                 # React组件
│   ├── workspace/             # 学习空间 ✅
│   │   ├── WorkSpacePanel.tsx# 学习空间管理面板 ✅
│   │   ├── SpaceCard.tsx     # 空间卡片 ✅
│   │   ├── CreateSpaceWizard.tsx # 分步创建向导 ✅
│   │   ├── EditSpaceForm.tsx  # 编辑表单 ✅
│   │   ├── SpaceActionsMenu.tsx # 操作菜单 ✅
│   │   └── DeletedSpacesList.tsx # 已删除空间管理 ✅
│   ├── common/                # 通用组件 ✅
│   │   ├── SideDrawer.tsx    # 侧边抽屉 ✅
│   │   ├── Modal.tsx         # 模态框 ✅
│   │   └── Button.tsx        # 按钮 ✅
│   ├── planning/              # 计划相关
│   │   ├── PlanTimeline.tsx  # 计划时间轴
│   │   ├── PlanVersion.tsx   # 版本对比
│   │   └── PlanAdjuster.tsx  # 计划调整
│   ├── tasks/                 # 任务系统
│   │   ├── TaskList.tsx      # 任务列表
│   │   ├── TaskCard.tsx      # 任务卡片
│   │   └── TaskCalendar.tsx  # 任务日历
│   ├── dashboard/             # 学习Dashboard
│   │   ├── ProgressPanel.tsx # 进度面板
│   │   ├── StudyStats.tsx    # 学习统计
│   │   ├── RiskAlert.tsx     # 风险提示
│   │   └── FocusTasks.tsx    # 重点任务
│   ├── chat/                  # Agent对话
│   │   ├── ChatPanel.tsx     # 聊天面板 ✅
│   │   ├── MessageList.tsx   # 消息列表 ✅
│   │   └── MessageInput.tsx  # 消息输入 ✅
│   └── ui-blocks/             # Generative UI组件
│       ├── SummaryCard.tsx   # 概况卡片
│       ├── StudyTimeline.tsx # 学习时间轴
│       ├── DailyTaskList.tsx # 每日任务
│       ├── ProgressBar.tsx   # 进度条
│       └── ActionBar.tsx     # 操作栏
│
├── store/                      # 状态管理
│   ├── spaceStore.ts         # 学习空间状态 ✅
│   ├── planStore.ts          # 计划版本状态
│   ├── taskStore.ts          # 任务状态
│   └── chatStore.ts          # 聊天状态 ✅
│
├── types/                      # 类型定义
│   ├── space.ts              # 学习空间类型 ✅
│   ├── plan.ts               # 计划类型
│   ├── task.ts               # 任务类型
│   ├── uiBlocks.ts           # UI Block类型
│   ├── agent.ts              # Agent类型
│   └── chat.ts               # 聊天类型 ✅
│
└── utils/                      # 工具函数
    ├── dateHelper.ts         # 日期处理
    ├── studyCalculator.ts    # 学习计算
    └── progressTracker.ts    # 进度追踪
```

## 🎯 核心功能架构

### 1. 多学习空间管理
- **空间创建** - 围绕学习目标创建独立空间（"高数期末"、"英语六级"）
- **空间隔离** - 每个空间有独立的聊天记录、计划版本、任务列表
- **空间切换** - 在不同学习目标间快速切换
- **上下文管理** - 每个空间维护独立的对话上下文

### 2. 计划版本管理
- **计划生成** - 基于目标、时间、学科优先级生成初始计划
- **版本控制** - 保留计划历史，支持版本切换
- **变化追踪** - 展示新旧计划之间的差异
- **动态调整** - 根据执行反馈自动重规划

### 3. Generative UI系统
- **结构化输出** - Agent返回UI block而非自由文本
- **组件注册表** - type到React组件的映射系统
- **Schema验证** - 使用Zod确保输出结构正确
- **动态渲染** - 根据Agent输出动态生成界面

### 4. 任务管理系统
- **任务拆解** - 计划→daily tasks的自动拆解
- **任务状态** - 完成、延期、取消、重新分配
- **任务优先级** - 基于考试时间和学科重要性
- **任务提醒** - 重要任务和截止日期提醒

### 5. 学习分析Dashboard
- **进度追踪** - 完成率、连续学习天数、投入时长
- **风险预警** - 学习进度滞后、时间不足警告
- **学科分析** - 每科投入时间、薄弱点识别
- **短期重点** - 未来几天重点任务展示

### 6. Agent对话系统
- **需求澄清** - 智能询问学习目标、时间安排
- **计划解释** - 解释推荐原因和调整逻辑
- **局部调整** - 根据反馈微调计划而非重生成
- **上下文管理** - 近期消息 + 摘要 + 结构化状态

## 🎨 交互设计

### 布局结构
```
┌─────────────┬─────────────────┬─────────────────┐
│  学习空间    │   Agent聊天区    │   Generative UI │
│   列表      │   (对话交互)     │     工作区      │
│            │                 │  (计划卡片、    │
│ 空间1      │  用户: 我周三    │   任务列表、    │
│ 空间2      │  没空            │   进度面板)     │
│ 空间3      │                 │                 │
│            │  Agent: 好的，   │  ┌───────────┐ │
│ + 新建     │  我会调整...    │  │ 进度面板  │ │
└─────────────┴─────────────────┴─────────────────┘
```

### Generative UI Blocks
Agent返回的结构化block类型：

```typescript
// 概况卡片
{
  type: "summary-card",
  data: {
    goal: "高数期末冲刺",
    deadline: "2024-06-15",
    progress: 45,
    riskLevel: "medium"
  }
}

// 学习时间轴
{
  type: "study-timeline", 
  data: {
    timeline: [
      { date: "5/20", tasks: ["微积分复习", "习题集A"] },
      { date: "5/21", tasks: ["线性代数", "公式记忆"] }
    ]
  }
}

// 每日任务列表
{
  type: "daily-task-list",
  data: {
    date: "2024-05-20",
    tasks: [
      { id: 1, subject: "高数", duration: "2h", priority: "high" },
      { id: 2, subject: "英语", duration: "1h", priority: "medium" }
    ]
  }
}

// 进度面板
{
  type: "progress-panel",
  data: {
    completionRate: 75,
    studyDays: 12,
    totalHours: 48
  }
}

// 风险警告
{
  type: "risk-alert",
  data: {
    risks: [
      { type: "behind_schedule", message: "高数进度滞后3天" },
      { type: "time_pressure", message: "距离考试仅15天" }
    ]
  }
}
```

## 📊 数据模型

### 核心数据实体
```typescript
// 学习空间
interface StudySpace {
  id: string;
  name: string;              // "高数期末冲刺"
  goal: string;              // "目标分数85+"
  deadline: Date;            // 考试日期
  subjects: Subject[];       // 涵盖科目
  createdAt: Date;
  updatedAt: Date;
}

// 计划版本
interface PlanVersion {
  id: string;
  spaceId: string;
  version: number;           // v1, v2, v3...
  status: 'active' | 'archived';
  createdAt: Date;
  changes: string[];         // 与前一版本的差异
  planData: PlanData;
}

// 聊天消息
interface ChatMessage {
  id: string;
  spaceId: string;
  role: 'user' | 'assistant';
  content: string;
  uiBlocks?: UIBlock[];      // 结构化UI输出
  timestamp: Date;
}

// 学习任务
interface StudyTask {
  id: string;
  spaceId: string;
  planId: string;
  title: string;             // "高数微分方程练习"
  subject: string;           // "高数"
  date: Date;
  duration: number;          // 分钟
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'cancelled' | 'rescheduled';
  taskType: 'study' | 'review' | 'practice' | 'exam';
}

// UI Block结构
interface UIBlock {
  type: 'summary-card' | 'study-timeline' | 'daily-task-list' | 
        'progress-panel' | 'risk-alert' | 'action-bar';
  data: Record<string, any>;
  metadata?: {
    timestamp: Date;
    confidence: number;
  };
}
```

## 🚀 项目推进计划

### 🎯 第一阶段：核心框架搭建 (Week 1-2) ✅ 部分完成
**目标**: 建立Schema-Driven Generative UI基础架构

#### 1.1 Schema系统
- [ ] 安装核心依赖 (Zod, date-fns, recharts)
- [ ] 定义UI Block Schema (uiBlocks.ts)
- [ ] 实现Component Registry (componentRegistry.ts)
- [ ] 创建基础UI Block组件

#### 1.2 学习空间系统 ✅
- [x] 设计空间数据模型和Store
- [x] 实现空间列表和创建功能
- [x] 建立空间隔离和切换机制
- [x] 空间卡片和列表UI组件
- [x] 分步创建向导 (5步骤)
- [x] 软删除机制 (30天恢复)
- [x] 完整编辑功能
- [x] 操作菜单系统

#### 1.3 基础Agent对话
- [ ] 重构StudyAgent核心逻辑
- [ ] 实现学习目标采集对话流程
- [ ] 建立对话上下文管理
- [x] 基础聊天界面（复用现有组件）

### 🎯 第二阶段：计划生成系统 (Week 3-4)
**目标**: 实现智能学习计划生成和版本管理

#### 2.1 计划生成引擎
- [ ] 设计计划生成算法
- [ ] 实现任务自动拆解逻辑
- [ ] 时间优化和冲突检测
- [ ] 风险分析和预警系统

#### 2.2 计划版本管理
- [ ] 版本控制和存储
- [ ] 版本对比和变化展示
- [ ] 计划切换和回滚功能
- [ ] 计划历史记录

#### 2.3 Generative UI集成
- [ ] Agent输出UI Block
- [ ] 动态组件渲染系统
- [ ] 计划可视化组件
- [ ] 时间轴和任务列表UI

### 🎯 第三阶段：任务与进度系统 (Week 5-6)
**目标**: 完整的任务管理和学习分析功能

#### 3.1 任务系统
- [ ] 任务CRUD操作
- [ ] 任务状态管理
- [ ] 任务拖拽和重排
- [ ] 任务提醒和通知

#### 3.2 学习Dashboard
- [ ] 进度追踪和统计
- [ ] 学习数据分析
- [ ] 风险预警面板
- [ ] 学科投入可视化

#### 3.3 动态重规划
- [ ] 基于执行反馈调整计划
- [ ] 智能任务重新分配
- [ ] 优先级动态调整
- [ ] 学习进度补偿机制

### 🎯 第四阶段：完善与优化 (Week 7-8)
**目标**: 用户体验优化和功能完善

#### 4.1 交互优化
- [ ] 响应式设计和移动端适配
- [ ] 快捷键和操作优化
- [ ] 加载状态和动画效果
- [ ] 错误处理和用户提示

#### 4.2 数据持久化
- [ ] LocalStorage/IndexedDB存储
- [ ] 数据导入导出功能
- [ ] 云同步准备（架构预留）
- [ ] 数据备份和恢复

#### 4.3 测试和部署
- [ ] 单元测试和集成测试
- [ ] 性能优化和代码分割
- [ ] 生产环境配置
- [ ] 文档和部署准备

## 🔑 关键文件说明 (重构后)

### 核心系统
- **src/core/agent/StudyAgent.ts** - 学习规划Agent核心逻辑
- **src/core/schema/uiBlocks.ts** - UI Block Schema定义
- **src/core/schema/componentRegistry.ts** - 组件注册表
- **src/core/engine/planGenerator.ts** - 计划生成引擎
- **src/core/engine/taskBreakdown.ts** - 任务拆解逻辑

### 状态管理
- **src/store/spaceStore.ts** - 学习空间状态管理
- **src/store/planStore.ts** - 计划版本状态管理
- **src/store/taskStore.ts** - 任务状态管理
- **src/store/chatStore.ts** - 聊天状态管理

### UI组件
- **src/components/workspace/SpaceList.tsx** - 学习空间列表
- **src/components/planning/PlanTimeline.tsx** - 计划时间轴
- **src/components/dashboard/ProgressPanel.tsx** - 进度面板
- **src/components/tasks/TaskList.tsx** - 任务列表
- **src/components/ui-blocks/** - Generative UI组件集

### 类型定义
- **src/types/space.ts** - 学习空间类型
- **src/types/plan.ts** - 计划相关类型
- **src/types/task.ts** - 任务类型定义
- **src/types/uiBlocks.ts** - UI Block类型

### 配置文件
- **tailwind.config.js** - Tailwind CSS配置
- **vite.config.ts** - Vite构建配置（需添加路径别名）
- **tsconfig.json** - TypeScript配置

## 🚀 快速开始

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm run dev
```

### 构建生产版本
```bash
pnpm run build
```

### 代码检查
```bash
pnpm run lint
```

## 📊 项目完成度评估 (最新更新)

| 模块 | 完成度 | 说明 |
|------|--------|------|
| 通用聊天功能 | 95% | 基础聊天架构完整 |
| 会话管理 | 95% | ✅ 多空间会话隔离 + 独立聊天记录 |
| 学习空间系统 | 90% | ✅ 完整CRUD + 软删除 + 分步向导 + 聊天集成 |
| 通用UI组件 | 60% | ✅ SideDrawer + Modal + Button等 |
| 状态管理 | 85% | ✅ spaceStore完善 + chatStore空间隔离 |
| Schema-Driven UI | 0% | 🔥 核心待实现 |
| 计划生成引擎 | 0% | 🔥 核心待实现 |
| 任务管理系统 | 0% | 🔥 核心待实现 |
| 学习Dashboard | 0% | 🔥 核心待实现 |
| **总体完成度** | **50%** | **🟢 空间聊天隔离完成，AI功能开发准备就绪** |

### 🎯 当前优先任务
1. **✅ 学习空间基础** - 已完成CRUD、软删除、分步创建向导
2. **✅ ChatPanel集成** - ✅ 已完成空间隔离的聊天系统
3. **✅ 会话管理升级** - ✅ 多空间会话隔离和独立聊天记录
4. **🔥 Schema系统** - 实现UI Block定义和组件注册
5. **🔥 核心业务逻辑** - 学习规划和任务管理算法
6. **🔥 数据模型** - 扩展学习计划相关数据结构

## 🎓 项目核心亮点

### 技术亮点
1. **Schema-Driven Generative UI** - Zod验证 + 动态组件渲染
2. **多空间隔离架构** - 独立上下文和状态管理
3. **动态规划引擎** - 基于反馈的智能调整
4. **结构化Agent输出** - UI block而非自由文本
5. **版本管理系统** - 计划版本控制和变化追踪

### 产品亮点
1. **可执行学习计划** - 不是建议，而是具体任务
2. **智能重规划** - 根据执行情况动态调整
3. **学习可视化** - 进度、风险、投入的直观展示
4. **上下文感知** - 基于学习状态的个性化对话

## 📝 重要说明

### 项目定位
这不是一个通用AI聊天应用，而是一个专门的**学习规划工作台**。核心价值在于：

- ❌ **不是**: 简单的问答助手或待办工具
- ✅ **而是**: Agent驱动的学习规划和任务管理系统

### 技术重点
- **前端工程**: Schema设计、状态管理、组件注册表
- **AI集成**: 结构化输出、上下文管理、规划算法
- **产品设计**: 学习体验、进度可视化、智能推荐

## 🔮 发展愿景

### 短期目标 (2-3个月)
- ✅ 完整的学习规划功能
- ✅ 可用的任务管理系统  
- ✅ 基础的学习分析Dashboard

### 中期目标 (6个月)
- 🎯 移动端适配和响应式设计
- 🎯 数据持久化和云同步
- 🎯 社区模板和最佳实践

### 长期愿景 (1年+)
- 🚀 个性化学习算法优化
- 🚀 多用户和协作功能
- 🚀 开放API和插件生态

---

**项目维护者**: wukaizzz
**项目定位**: AI学习规划Agent Web App
**最后更新**: 2026-04-27
**当前阶段**: 🟢 学习空间与聊天系统集成完成，AI功能开发准备就绪
**下一步**: 实现Schema系统，开始AI学习规划核心功能开发