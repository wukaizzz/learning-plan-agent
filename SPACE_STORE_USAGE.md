# Space Store 使用指南

## 🎯 功能概述

`useSpaceStore` 是学习空间管理的核心状态管理，提供了完整的学习空间 CRUD 操作。

## 📋 基础使用

### 1. 创建学习空间

```typescript
import { useSpaceStore } from '@/store/spaceStore';

function CreateSpaceForm() {
  const { createSpace } = useSpaceStore();

  const handleCreate = () => {
    const spaceId = createSpace({
      name: "高数期末冲刺",
      description: "为期末考试做准备，目标85分以上",
      color: "#3b82f6", // 可选，不提供会随机分配
      goal: {
        primaryGoal: "期末考试85+分",
        secondaryGoals: [
          "掌握微分方程基础",
          "提高线性代数解题能力"
        ],
        examDate: new Date("2024-06-15"),
        targetScore: 85,
        currentScore: 72
      },
      subjects: [
        {
          name: "高等数学",
          currentLevel: 72,
          targetLevel: 90,
          weight: 0.5,
          weakPoints: ["微分方程", "无穷级数"],
          strongPoints: ["极限", "导数"]
        },
        {
          name: "线性代数",
          currentLevel: 68,
          targetLevel: 85,
          weight: 0.3,
          weakPoints: ["矩阵运算"],
          strongPoints: ["行列式"]
        }
      ],
      schedule: {
        availableHoursPerDay: 3,
        availableDays: ["周一", "周二", "周三", "周四", "周五"],
        preferredTimeSlots: ["晚上", "下午"],
        restDays: ["周六下午", "周日"],
        startDate: new Date("2024-05-20")
      }
    });

    console.log("创建的学习空间ID:", spaceId);
  };

  return <button onClick={handleCreate}>创建学习空间</button>;
}
```

### 2. 获取和显示学习空间

```typescript
function SpaceList() {
  const { spaces, currentSpaceId, getAllSpaces } = useSpaceStore();

  // 获取按活跃度排序的空间列表
  const sortedSpaces = getAllSpaces();

  return (
    <div>
      {sortedSpaces.map(space => (
        <div
          key={space.id}
          className={space.id === currentSpaceId ? 'active' : ''}
        >
          <h3>{space.name}</h3>
          <p>{space.description}</p>
          <div className="status">
            状态: {space.status}
            进度: {space.stats.overallProgress}%
          </div>
          <div className="stats">
            学习时间: {space.stats.totalStudyHours}小时
            连续学习: {space.stats.consecutiveDays}天
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 3. 切换学习空间

```typescript
function SpaceSelector() {
  const { spaces, currentSpaceId, switchSpace } = useSpaceStore();

  return (
    <select
      value={currentSpaceId || ''}
      onChange={(e) => switchSpace(e.target.value)}
    >
      <option value="">选择学习空间...</option>
      {spaces.map(space => (
        <option key={space.id} value={space.id}>
          {space.name}
        </option>
      ))}
    </select>
  );
}
```

### 4. 更新学习空间

```typescript
function SpaceEditor({ spaceId }: { spaceId: string }) {
  const { updateSpace, getCurrentSpace } = useSpaceStore();
  const space = getCurrentSpace();

  const handleUpdateName = (newName: string) => {
    updateSpace(spaceId, {
      name: newName,
      updatedAt: new Date() // 会自动更新，这里可以省略
    });
  };

  const handleStartLearning = () => {
    updateSpace(spaceId, {
      status: 'active',
      currentPhase: '基础学习'
    });
  };

  if (!space || space.id !== spaceId) return null;

  return (
    <div>
      <input
        type="text"
        value={space.name}
        onChange={(e) => handleUpdateName(e.target.value)}
      />
      <button onClick={handleStartLearning}>
        开始学习
      </button>
    </div>
  );
}
```

### 5. 更新学习统计

```typescript
function StudyTracker({ spaceId }: { spaceId: string }) {
  const { updateSpaceStats, addStudyTime } = useSpaceStore();

  const recordStudySession = (hours: number) => {
    updateSpaceStats(spaceId, {
      totalStudyHours: hours, // 会累加到现有值
      consecutiveDays: 5,
      overallProgress: 75
    });
  };

  const quickAddTime = (hours: number) => {
    addStudyTime(spaceId, hours);
  };

  return (
    <div>
      <button onClick={() => quickAddTime(2)}>
        记录2小时学习
      </button>
      <button onClick={() => recordStudySession(2)}>
        详细记录
      </button>
    </div>
  );
}
```

### 6. 搜索学习空间

```typescript
function SpaceSearch() {
  const [query, setQuery] = useState('');
  const { searchSpaces } = useSpaceStore();

  const results = searchSpaces(query);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索学习空间..."
      />
      <div>
        {results.map(space => (
          <div key={space.id}>
            <h4>{space.name}</h4>
            <p>{space.goal.primaryGoal}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 7. 删除学习空间

```typescript
function SpaceDeleteButton({ spaceId }: { spaceId: string }) {
  const { deleteSpace, spaces } = useSpaceStore();

  const handleDelete = () => {
    if (confirm('确定要删除这个学习空间吗？')) {
      deleteSpace(spaceId);
    }
  };

  // 防止删除最后一个空间
  const isLastSpace = spaces.length === 1;

  return (
    <button
      onClick={handleDelete}
      disabled={isLastSpace}
      className={isLastSpace ? 'disabled' : 'danger'}
    >
      {isLastSpace ? '至少保留一个空间' : '删除空间'}
    </button>
  );
}
```

## 🔧 高级用法

### 获取当前空间信息

```typescript
function CurrentSpaceDashboard() {
  const { getCurrentSpace } = useSpaceStore();
  const currentSpace = getCurrentSpace();

  if (!currentSpace) {
    return <div>请先选择或创建一个学习空间</div>;
  }

  const daysUntilExam = Math.ceil(
    (currentSpace.goal.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div>
      <h2>{currentSpace.name}</h2>
      <div className="exam-countdown">
        距离考试还有 {daysUntilExam} 天
      </div>
      <div className="subjects">
        {currentSpace.subjects.map(subject => (
          <div key={subject.name}>
            <h4>{subject.name}</h4>
            <progress value={subject.currentLevel} max={100} />
            <span>{subject.currentLevel}% → {subject.targetLevel}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 响应空间变化

```typescript
import { useEffect } from 'react';

function SpaceListener() {
  const { currentSpaceId, getCurrentSpace } = useSpaceStore();

  useEffect(() => {
    if (currentSpaceId) {
      const currentSpace = getCurrentSpace();
      console.log('当前空间切换到:', currentSpace?.name);

      // 可以在这里触发空间切换后的操作
      // 比如加载该空间的任务、计划等
    }
  }, [currentSpaceId, getCurrentSpace]);

  return null;
}
```

### 批量更新空间信息

```typescript
function BatchUpdate({ spaceId }: { spaceId: string }) {
  const { updateSpace } = useSpaceStore();

  const updateMultipleFields = () => {
    updateSpace(spaceId, {
      name: "高数期末冲刺 - 更新版",
      status: 'active',
      currentPhase: '强化训练',
      goal: {
        ...space.goal, // 保留原有目标信息
        targetScore: 90 // 提高目标分数
      }
    });
  };

  return <button onClick={updateMultipleFields}>批量更新</button>;
}
```

## 📊 完整示例：学习空间创建向导

```typescript
function CreateSpaceWizard() {
  const [step, setStep] = useState(1);
  const { createSpace } = useSpaceStore();

  const [spaceConfig, setSpaceConfig] = useState({
    name: '',
    description: '',
    goal: {
      primaryGoal: '',
      secondaryGoals: [],
      examDate: new Date(),
      targetScore: 80
    },
    subjects: [],
    schedule: {
      availableHoursPerDay: 2,
      availableDays: [],
      preferredTimeSlots: [],
      restDays: []
    }
  });

  const handleSubmit = () => {
    const spaceId = createSpace(spaceConfig);
    console.log('学习空间创建成功:', spaceId);
    // 可以跳转到新创建的空间
  };

  return (
    <div className="wizard">
      {step === 1 && (
        <Step1BasicInfo
          config={spaceConfig}
          onChange={setSpaceConfig}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <Step2Goals
          config={spaceConfig}
          onChange={setSpaceConfig}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <Step3Subjects
          config={spaceConfig}
          onChange={setSpaceConfig}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <Step4Schedule
          config={spaceConfig}
          onChange={setSpaceConfig}
          onSubmit={handleSubmit}
          onBack={() => setStep(3)}
        />
      )}
    </div>
  );
}
```

## 🎨 UI 组件集成示例

```typescript
import { useSpaceStore } from '@/store/spaceStore';
import { useEffect } from 'react';

export function SpaceSidebar() {
  const { spaces, currentSpaceId, switchSpace, getAllSpaces } = useSpaceStore();

  const sortedSpaces = getAllSpaces();

  return (
    <div className="space-sidebar">
      <div className="space-header">
        <h3>学习空间</h3>
        <button>+</button>
      </div>

      <div className="space-list">
        {sortedSpaces.map(space => (
          <div
            key={space.id}
            className={`space-item ${space.id === currentSpaceId ? 'active' : ''}`}
            onClick={() => switchSpace(space.id)}
            style={{ borderLeftColor: space.color }}
          >
            <h4>{space.name}</h4>
            <p>{space.goal.primaryGoal}</p>
            <div className="space-meta">
              <span className="status">{space.status}</span>
              <span className="progress">{space.stats.overallProgress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔍 调试和开发

### 查看当前 Store 状态

```typescript
// 在浏览器控制台中
import { useSpaceStore } from '@/store/spaceStore';

// 获取当前状态
const state = useSpaceStore.getState();
console.log('当前所有空间:', state.spaces);
console.log('当前空间ID:', state.currentSpaceId);
console.log('当前空间详情:', state.getCurrentSpace());

// 监听状态变化
useSpaceStore.subscribe((state, prevState) => {
  console.log('空间状态变化:', {
    prevSpaces: prevState.spaces.length,
    currentSpaces: state.spaces.length,
    currentSpace: state.currentSpaceId
  });
});
```

## 💡 最佳实践

1. **颜色选择**: 为不同的学习空间选择不同的主题色，便于视觉区分
2. **空间命名**: 使用清晰的名称，如"高数期末冲刺"、"英语六级准备"
3. **及时更新**: 定期更新学习进度，保持数据准确性
4. **合理规划**: 根据实际情况设置可用的学习时间
5. **数据备份**: 重要数据定期导出备份

## 🚀 下一步

完善 spaceStore 后，接下来需要实现：
- PlanStore (计划版本管理)
- TaskStore (任务管理)  
- ChatStore (对话管理，重构现有)
- UI Block 组件系统
