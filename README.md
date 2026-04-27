# AI 学习规划 Agent Web App

一个面向学生/自学者的 AI 学习规划 Agent Web 应用。不仅提供智能对话功能，更重要的是实现了**完整的学习空间管理系统**，支持学习目标创建、智能规划、任务管理和进度追踪。

> **当前状态**: 基础架构完成，核心功能开发阶段 (45%完成度)
> **技术特点**: React 19 + TypeScript + Zustand + 侧边抽屉UI + 分步向导

## Features

### 🎯 学习空间管理系统 (已完成)
- **📚 完整CRUD操作** - 创建、编辑、删除学习空间
- **🔄 软删除机制** - 30天恢复期，防止误操作
- **📝 分步创建向导** - 5步骤智能引导，降低复杂度
- **⚙️ 完整操作菜单** - 编辑、删除、暂停/恢复、统计、分享、导出
- **📱 现代化UI** - 侧边抽屉、响应式设计、流畅动画

### 🤖 AI Agent 能力 (开发中)
- **🧠 智能对话** - 基于Claude 3.5的自然语言交互
- **📊 实时流式响应** - 观看AI回复的生成过程
- **🔧 工具调用** - 支持计算器、天气查询、网页搜索等工具
- **💾 持久化存储** - 聊天记录和学习状态本地保存
- **🔒 空间隔离** - 每个学习空间独立的聊天记录和对话上下文

### 🎨 技术特性
- **⚡ 快速开发** - Vite构建，热重载，TypeScript类型安全
- **🎭 状态管理** - Zustand + Immer，简洁高效的状态管理
- **🎨 现代UI** - 侧边抽屉、模态框、分步向导等丰富交互
- **📱 响应式设计** - 完美适配桌面和移动设备

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **State Management**: Zustand + Immer
- **Styling**: 自定义CSS + 侧边抽屉组件
- **AI SDK**: Anthropic SDK (Claude)
- **Package Manager**: pnpm

## Project Structure

```
src/
├── components/           # UI Components
│   ├── workspace/       # 学习空间管理 ✅
│   │   ├── WorkSpacePanel.tsx    # 主管理面板
│   │   ├── SpaceCard.tsx         # 空间卡片
│   │   ├── CreateSpaceWizard.tsx # 分步创建向导
│   │   ├── EditSpaceForm.tsx     # 编辑表单
│   │   ├── SpaceActionsMenu.tsx  # 操作菜单
│   │   └── DeletedSpacesList.tsx # 已删除空间
│   ├── common/          # 共享组件 ✅
│   │   ├── SideDrawer.tsx        # 侧边抽屉
│   │   ├── Modal.tsx             # 模态框
│   │   └── Button.tsx            # 按钮
│   ├── chat/            # 聊天组件 ✅
│   │   ├── ChatPanel.tsx
│   │   ├── MessageList.tsx
│   │   └── MessageInput.tsx
│   └── ui/              # UI基础组件
│       ├── button/
│       ├── input/
│       └── dialog/
├── store/               # 状态管理 ✅
│   ├── spaceStore.ts    # 学习空间状态
│   └── chatStore.ts     # 聊天状态
├── types/               # TypeScript类型 ✅
│   ├── space.ts         # 学习空间类型
│   ├── chat.ts          # 聊天类型
│   └── agent.ts         # Agent类型
├── router/              # 路由配置 ✅
│   └── index.ts         # 路由定义
└── utils/               # 工具函数
    ├── messageFormatter.ts
    ├── constants.ts
    └── streamParser.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- An Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd react-project
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm run dev
```

4. Open your browser to `http://localhost:5173` (or the port shown in terminal)

### Usage

#### 🎯 学习空间管理

1. **创建学习空间**
   - 点击"创建学习空间"按钮
   - 按照5步向导填写信息：
     - 基础信息（名称、描述、颜色）
     - 学习目标（主要目标、考试日期、目标分数）
     - 学科设置（添加学科、设置水平）
     - 时间安排（每日学习时间、可用日期）
     - 确认创建

2. **管理学习空间**
   - 点击卡片进入学习空间
   - 使用右上角菜单进行操作：
     - ✏️ 编辑空间信息
     - ⏸️ 暂停/恢复学习
     - 📊 查看学习统计
     - 🔗 分享学习空间
     - 📥 导出学习报告
     - 🗑️ 删除空间（30天可恢复）

3. **恢复误删空间**
   - 点击顶部的"已删除空间"按钮
   - 选择要恢复的空间
   - 点击"恢复"按钮

#### 🤖 AI对话功能

1. **输入API密钥**: 首次启动时输入Anthropic API密钥
2. **开始对话**: 输入消息并按Enter发送
3. **观看流式响应**: 实时查看AI回复过程
4. **工具调用**: 询问天气、计算、搜索等问题

#### 🎨 界面操作

- **点击空间卡片**: 跳转到对应的学习空间聊天界面
- **侧边抽屉**: 所有表单使用侧边抽屉，保持上下文
- **视图切换**: 支持网格视图和列表视图
- **筛选搜索**: 按状态筛选，搜索学习空间

## Available Tools

### Weather Tool
Get current weather information for any location.
```
User: "What's the weather in Tokyo?"
Agent: [Uses weather tool to fetch Tokyo's weather]
```

### Calculator Tool
Perform mathematical calculations.
```
User: "What's 25 * 37?"
Agent: [Uses calculator tool]
```

### Web Search Tool
Search the web for information (simulated).
```
User: "Search for the latest React updates"
Agent: [Uses web search tool]
```

## Configuration

### 学习空间配置

学习空间在 `src/store/spaceStore.ts` 中配置：

```typescript
// 创建学习空间
createSpace: {
  name: "高等数学期末冲刺",
  description: "为期末考试做好准备",
  goal: {
    primaryGoal: "期末考试获得85分以上",
    examDate: new Date("2024-06-15"),
    targetScore: 85
  },
  subjects: [
    {
      name: "高等数学",
      currentLevel: 60,
      targetLevel: 85,
      weight: 0.8
    }
  ],
  schedule: {
    availableHoursPerDay: 4,
    availableDays: ["周一", "周二", "周三", "周四", "周五"],
    preferredTimeSlots: ["晚上"],
    startDate: new Date()
  }
}
```

### 状态管理配置

项目使用Zustand进行状态管理，主要Store包括：

- **spaceStore**: 学习空间管理 (创建、编辑、删除、恢复)
- **chatStore**: 聊天会话管理 (消息历史、当前会话)

### 添加新的操作菜单

在 `src/components/workspace/SpaceActionsMenu.tsx` 中扩展：

```typescript
// 添加新的操作类型
interface SpaceActionsMenuProps {
  // ... 现有操作
  onNewAction?: () => void;  // 新操作
}

// 在菜单中添加按钮
<button onClick={() => handleAction(onNewAction)}>
  新操作
</button>
```

## Development

### Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Run ESLint

### Building for Production

```bash
pnpm run build
```

The built files will be in the `dist/` directory.

## Key Features

### 🎯 学习空间管理系统
- **分步创建向导**: 5步骤智能引导，复杂信息轻松录入
- **完整CRUD操作**: 创建、读取、更新、删除学习空间
- **软删除保护**: 30天恢复期，避免误操作导致数据丢失
- **丰富操作菜单**: 编辑、暂停、统计、分享、导出等6种操作
- **状态管理**: 支持规划中、进行中、已暂停、已完成等状态

### 🎨 现代化UI交互
- **侧边抽屉设计**: 保持上下文的同时提供足够的表单空间
- **响应式布局**: 完美适配桌面和移动设备
- **流畅动画**: 优雅的过渡效果和加载状态
- **直观操作**: 点击卡片跳转、右键菜单、快捷键支持

### 💾 智能数据管理
- **本地持久化**: 使用LocalStorage保存学习空间和聊天记录
- **状态同步**: Zustand + Immer确保状态一致性
- **数据验证**: TypeScript类型系统确保数据安全
- **错误恢复**: 软删除机制支持数据恢复

### 🤖 AI对话能力
- **实时流式响应**: 观看AI回复的生成过程
- **工具调用**: 支持计算器、天气查询、网页搜索等工具
- **上下文管理**: 每个学习空间维护独立的对话上下文
- **多轮对话**: 支持连续对话和上下文理解

## Troubleshooting

### API Key Issues
Make sure your Anthropic API key is valid and has sufficient credits.

### Build Issues
Try clearing the node_modules and reinstalling:
```bash
rm -rf node_modules
pnpm install
```

### 学习空间数据丢失
学习空间数据保存在浏览器的LocalStorage中：
- 检查浏览器是否清除了LocalStorage
- 查看浏览器控制台是否有错误信息
- 尝试在隐身模式下测试（功能正常则为数据问题）

### UI组件显示异常
1. 清除浏览器缓存
2. 检查是否有JavaScript错误
3. 确认所有依赖已正确安装：`pnpm install`
4. 尝试重启开发服务器

## Future Enhancements

### 🎯 即将推出的功能

- [ ] **Schema-Driven Generative UI** - AI输出结构化UI组件
- [ ] **智能学习计划生成** - 基于目标的自动规划算法
- [ ] **任务管理系统** - 学习任务拆解和追踪
- [ ] **学习Dashboard** - 进度分析、风险预警、学习统计
- [ ] **多AI Agent协作** - 不同专长的Agent协同工作

### 🚀 长期规划

- [ ] 移动端优化和原生应用
- [ ] 数据云同步和备份
- [ ] 学习社区和模板分享
- [ ] 个性化学习算法优化
- [ ] 开放API和插件生态

## License

MIT License - feel free to use this project for learning and development.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📊 项目完成度

**当前版本**: v0.3.0-beta
**发布日期**: 2026-04-27
**总体完成度**: 50%

### ✅ 已完成功能
- ✅ 学习空间完整CRUD系统
- ✅ 分步创建向导 (5步骤)
- ✅ 软删除机制 (30天恢复)
- ✅ 侧边抽屉UI组件
- ✅ 操作菜单系统
- ✅ 基础聊天界面
- ✅ 状态管理系统
- ✅ 响应式设计
- ✅ **空间聊天隔离** - 每个学习空间独立的聊天记录

### 🔥 开发中功能
- 🔥 AI学习规划算法
- 🔥 任务管理系统
- 🔥 学习Dashboard
- 🔥 Schema-Driven UI
- 🔥 智能计划生成

**项目状态**: 🟢 学习空间与聊天系统集成完成，AI功能开发准备就绪
**下一步**: 实现Schema系统，开始AI学习规划核心功能开发
