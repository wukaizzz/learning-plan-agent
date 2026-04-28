/**
 * Workflow Manager - 工作流状态与 UI Blocks 的联动管理
 *
 * 这个文件实现了"阶段驱动的Block渲染"逻辑
 * 根据当前工作流状态 (WorkspaceState) 决定显示哪些 UI Blocks
 */

import type { WorkspaceState, UIBlock } from '../../types/uiBlocks';
import { createBlock } from '../../types/uiBlocks';

/**
 * 工作流阶段到 UI Blocks 的映射配置
 *
 * 每个 WorkspaceState 对应一组应该显示的 UI Blocks
 * 这样 Agent 可以通过改变 workspaceState 来控制整个 UI 的变化
 */
const WORKFLOW_BLOCK_MAPPING: Record<
  WorkspaceState,
  () => UIBlock[]
> = {
  /**
   * empty - 还没开始规划
   * 显示引导和开始按钮
   */
  empty: () => [
    createBlock('collection-form', '开始学习规划', {
      stage: 'initial',
      fields: [
        {
          name: 'goal',
          label: '学习目标',
          type: 'textarea',
          placeholder: '例如：准备期末考试达到85分以上',
          required: true
        },
        {
          name: 'examDate',
          label: '考试日期',
          type: 'date',
          required: true
        }
      ]
    }),
    createBlock('action-bar', '操作', {
      actions: [
        {
          id: 'start_planning',
          label: '开始规划',
          type: 'primary',
          onClick: () => console.log('开始规划')
        }
      ]
    })
  ],

  /**
   * collecting - 正在收集信息
   * 显示信息收集表单和当前进度
   */
  collecting: () => [
    createBlock('tool-call-status', '信息收集中', {
      currentStep: '收集学习信息',
      steps: [
        {
          name: '确认学习目标',
          status: 'completed',
          message: '已明确学习目标'
        },
        {
          name: '收集科目信息',
          status: 'running',
          message: '正在分析各科知识点...'
        },
        {
          name: '评估可用时间',
          status: 'pending',
          message: '等待科目信息收集完成'
        }
      ]
    }),
    createBlock('collection-form', '补充信息', {
      stage: 'details',
      fields: [
        {
          name: 'studyTime',
          label: '每日学习时间（小时）',
          type: 'number',
          placeholder: '例如：4',
          required: true
        },
        {
          name: 'weakSubjects',
          label: '薄弱科目',
          type: 'select',
          options: ['高等数学', '大学英语', 'C语言程序设计'],
          required: false
        }
      ]
    })
  ],

  /**
   * analyzing - Agent 正在分析
   * 显示分析进度和状态
   */
  analyzing: () => [
    createBlock('workflow-indicator', '学习规划分析中', {
      currentState: 'analyzing',
      currentStep: '正在分析学习目标和时间安排',
      steps: [
        {
          state: 'empty',
          label: '开始',
          icon: '🎯',
          completed: true
        },
        {
          state: 'collecting',
          label: '信息收集',
          icon: '📋',
          completed: true
        },
        {
          state: 'analyzing',
          label: '分析中',
          icon: '🧠',
          completed: false
        },
        {
          state: 'generating',
          label: '生成计划',
          icon: '📝',
          completed: false
        },
        {
          state: 'reviewing',
          label: '查看结果',
          icon: '👀',
          completed: false
        }
      ]
    }),
    createBlock('tool-call-status', '分析进度', {
      currentStep: '分析学习数据',
      steps: [
        {
          name: '知识点分析',
          status: 'completed',
          message: '已完成各科目知识点梳理'
        },
        {
          name: '时间分配计算',
          status: 'running',
          message: '正在优化时间分配方案...'
        },
        {
          name: '难度评估',
          status: 'pending',
          message: '等待时间分配完成'
        }
      ]
    })
  ],

  /**
   * generating - Agent 正在生成计划
   * 显示生成进度和预览
   */
  generating: () => [
    createBlock('workflow-indicator', '生成学习计划中', {
      currentState: 'generating',
      currentStep: '正在制定详细学习计划',
      steps: [
        {
          state: 'empty',
          label: '开始',
          icon: '🎯',
          completed: true
        },
        {
          state: 'collecting',
          label: '信息收集',
          icon: '📋',
          completed: true
        },
        {
          state: 'analyzing',
          label: '分析',
          icon: '🧠',
          completed: true
        },
        {
          state: 'generating',
          label: '生成中',
          icon: '📝',
          completed: false
        },
        {
          state: 'reviewing',
          label: '查看结果',
          icon: '👀',
          completed: false
        }
      ]
    }),
    createBlock('generating-skeleton', '计划生成中...', {
      message: '正在为您制定个性化的学习计划，请稍候...',
      progress: 65,
      steps: [
        {
          name: '制定学习阶段',
          status: 'completed'
        },
        {
          name: '分配每日任务',
          status: 'running'
        },
        {
          name: '生成时间轴',
          status: 'pending'
        }
      ]
    })
  ],

  /**
   * reviewing - 用户查看并调整结果
   * 显示生成的计划和调整选项
   */
  reviewing: () => [
    createBlock('workflow-indicator', '查看学习计划', {
      currentState: 'reviewing',
      currentStep: '请查看并确认学习计划',
      steps: [
        {
          state: 'empty',
          label: '开始',
          icon: '🎯',
          completed: true
        },
        {
          state: 'collecting',
          label: '信息收集',
          icon: '📋',
          completed: true
        },
        {
          state: 'analyzing',
          label: '分析',
          icon: '🧠',
          completed: true
        },
        {
          state: 'generating',
          label: '生成计划',
          icon: '📝',
          completed: true
        },
        {
          state: 'reviewing',
          label: '确认中',
          icon: '👀',
          completed: false
        }
      ]
    }),
    createBlock('summary-card', '学习概况', {
      spaceName: '高等数学复习',
      spaceDescription: '为期末考试制定系统复习计划',
      primaryGoal: '期末考试达到85分以上',
      targetScore: 85,
      currentScore: 65,
      examDate: '2026-06-15',
      daysRemaining: 49,
      overallProgress: 0,
      subjects: [
        { name: '高等数学', progress: 0, targetLevel: 85 },
        { name: '线性代数', progress: 0, targetLevel: 80 }
      ]
    }),
    createBlock('daily-task-list', '今日学习任务', {
      date: '2026-04-27',
      tasks: [
        {
          id: 'task_1',
          subject: '高等数学',
          task: '复习第一章 极限与连续',
          duration: 120,
          priority: 'high',
          status: 'pending',
          estimatedTime: '10:00-12:00'
        },
        {
          id: 'task_2',
          subject: '高等数学',
          task: '完成课后习题 1-3章',
          duration: 90,
          priority: 'medium',
          status: 'pending',
          estimatedTime: '14:00-15:30'
        }
      ],
      totalDuration: 210,
      completionRate: 0
    }),
    createBlock('progress-bar', '整体进度', {
      label: '整体学习进度',
      progress: 0,
      showPercentage: true
    }),
    createBlock('action-bar', '操作选项', {
      actions: [
        {
          id: 'confirm_plan',
          label: '确认计划',
          type: 'primary',
          onClick: () => console.log('确认计划')
        },
        {
          id: 'regenerate',
          label: '重新生成',
          type: 'secondary',
          onClick: () => console.log('重新生成')
        },
        {
          id: 'manual_edit',
          label: '手动调整',
          type: 'secondary',
          onClick: () => console.log('手动调整')
        }
      ]
    })
  ],

  /**
   * finalized - 计划已确认，执行中
   *显示执行中的计划和进度
   */
  finalized: () => [
    createBlock('workflow-indicator', '学习计划执行中', {
      currentState: 'finalized',
      currentStep: '计划执行中',
      steps: [
        {
          state: 'empty',
          label: '开始',
          icon: '🎯',
          completed: true
        },
        {
          state: 'collecting',
          label: '信息收集',
          icon: '📋',
          completed: true
        },
        {
          state: 'analyzing',
          label: '分析',
          icon: '🧠',
          completed: true
        },
        {
          state: 'generating',
          label: '生成计划',
          icon: '📝',
          completed: true
        },
        {
          state: 'reviewing',
          label: '确认',
          icon: '👀',
          completed: true
        }
      ]
    }),
    createBlock('summary-card', '学习概况', {
      spaceName: '高等数学复习',
      spaceDescription: '为期末考试制定系统复习计划',
      primaryGoal: '期末考试达到85分以上',
      targetScore: 85,
      currentScore: 72,
      examDate: '2026-06-15',
      daysRemaining: 49,
      overallProgress: 35,
      subjects: [
        { name: '高等数学', progress: 42, targetLevel: 85 },
        { name: '线性代数', progress: 28, targetLevel: 80 }
      ]
    }),
    createBlock('daily-task-list', '今日学习任务', {
      date: '2026-04-27',
      tasks: [
        {
          id: 'task_1',
          subject: '高等数学',
          task: '复习第一章 极限与连续',
          duration: 120,
          priority: 'high',
          status: 'completed',
          estimatedTime: '10:00-12:00'
        },
        {
          id: 'task_2',
          subject: '高等数学',
          task: '完成课后习题 1-3章',
          duration: 90,
          priority: 'medium',
          status: 'in_progress',
          estimatedTime: '14:00-15:30'
        },
        {
          id: 'task_3',
          subject: '线性代数',
          task: '矩阵运算练习',
          duration: 60,
          priority: 'low',
          status: 'pending',
          estimatedTime: '16:00-17:00'
        }
      ],
      totalDuration: 270,
      completionRate: 33.3
    }),
    createBlock('progress-bar', '整体进度', {
      label: '整体学习进度',
      progress: 35,
      showPercentage: true
    }),
    createBlock('risk-alert', '学习风险提示', {
      risks: [
        {
          type: 'time_pressure',
          severity: 'medium',
          message: '距离考试还有49天，建议每天增加30分钟学习时间',
          suggestion: '可以将周末学习时间从4小时调整为6小时'
        },
        {
          type: 'low_performance',
          severity: 'low',
          message: '线性代数进度较慢，可能需要额外辅导',
          suggestion: '考虑参加线上答疑或找同学讨论'
        }
      ]
    }),
    createBlock('action-bar', '操作选项', {
      actions: [
        {
          id: 'pause_plan',
          label: '暂停计划',
          type: 'secondary',
          onClick: () => console.log('暂停计划')
        },
        {
          id: 'view_analytics',
          label: '查看统计',
          type: 'secondary',
          onClick: () => console.log('查看统计')
        },
        {
          id: 'adjust_goals',
          label: '调整目标',
          type: 'secondary',
          onClick: () => console.log('调整目标')
        }
      ]
    })
  ],

  /**
   * paused - 计划已暂停
   * 显示暂停状态和恢复选项
   */
  paused: () => [
    createBlock('workflow-indicator', '计划已暂停', {
      currentState: 'paused',
      currentStep: '学习计划已暂停',
      steps: [
        {
          state: 'empty',
          label: '开始',
          icon: '🎯',
          completed: true
        },
        {
          state: 'collecting',
          label: '信息收集',
          icon: '📋',
          completed: true
        },
        {
          state: 'analyzing',
          label: '分析',
          icon: '🧠',
          completed: true
        },
        {
          state: 'generating',
          label: '生成计划',
          icon: '📝',
          completed: true
        },
        {
          state: 'reviewing',
          label: '确认',
          icon: '👀',
          completed: true
        },
        {
          state: 'finalized',
          label: '执行',
          icon: '▶️',
          completed: false
        }
      ]
    }),
    createBlock('summary-card', '学习概况', {
      spaceName: '高等数学复习',
      spaceDescription: '为期末考试制定系统复习计划（已暂停）',
      primaryGoal: '期末考试达到85分以上',
      targetScore: 85,
      currentScore: 72,
      examDate: '2026-06-15',
      daysRemaining: 49,
      overallProgress: 35,
      subjects: [
        { name: '高等数学', progress: 42, targetLevel: 85 },
        { name: '线性代数', progress: 28, targetLevel: 80 }
      ]
    }),
    createBlock('progress-bar', '整体进度', {
      label: '整体学习进度（已暂停）',
      progress: 35,
      showPercentage: true
    }),
    createBlock('action-bar', '恢复计划', {
      actions: [
        {
          id: 'resume_plan',
          label: '继续学习',
          type: 'primary',
          onClick: () => console.log('继续学习')
        },
        {
          id: 'adjust_plan',
          label: '调整计划',
          type: 'secondary',
          onClick: () => console.log('调整计划')
        },
        {
          id: 'exit_space',
          label: '退出空间',
          type: 'danger',
          onClick: () => console.log('退出空间')
        }
      ]
    })
  ]
};

/**
 * 根据当前工作流状态获取对应的 UI Blocks
 *
 * @param currentState - 当前工作流状态
 * @returns 应该显示的 UI Blocks 数组
 *
 * @example
 * const blocks = getBlocksForState('reviewing');
 * // 返回 reviewing 状态对应的 blocks
 */
export const getBlocksForState = (currentState: WorkspaceState): UIBlock[] => {
  const blocksGetter = WORKFLOW_BLOCK_MAPPING[currentState];
  if (!blocksGetter) {
    console.warn(`Unknown workspace state: ${currentState}, using empty state blocks`);
    return WORKFLOW_BLOCK_MAPPING.empty();
  }

  return blocksGetter();
};

/**
 * 转换工作流状态并获取对应的 UI Blocks
 *
 * @param newState - 新的工作流状态
 * @returns 新状态对应的 UI Blocks
 *
 * @example
 * const newBlocks = transitionToState('generating');
 * // 返回 generating 状态的 blocks
 */
export const transitionToState = (newState: WorkspaceState): UIBlock[] => {
  console.log(`🔄 Workflow state transition: ${newState}`);
  return getBlocksForState(newState);
};

/**
 * 获取工作流状态列表
 *
 * @returns 所有可用的工作流状态
 */
export const getWorkflowStates = (): WorkspaceState[] => {
  return Object.keys(WORKFLOW_BLOCK_MAPPING) as WorkspaceState[];
};

/**
 * 获取下一个工作流状态
 *
 * @param currentState - 当前状态
 * @returns 下一个状态，如果没有则返回当前状态
 *
 * @example
 * const nextState = getNextState('collecting'); // 'analyzing'
 */
export const getNextState = (currentState: WorkspaceState): WorkspaceState => {
  const states = getWorkflowStates();
  const currentIndex = states.indexOf(currentState);

  if (currentIndex === -1 || currentIndex === states.length - 1) {
    return currentState;
  }

  return states[currentIndex + 1];
};

/**
 * 获取上一个工作流状态
 *
 * @param currentState - 当前状态
 * @returns 上一个状态，如果没有则返回当前状态
 *
 * @example
 * const prevState = getPreviousState('generating'); // 'analyzing'
 */
export const getPreviousState = (currentState: WorkspaceState): WorkspaceState => {
  const states = getWorkflowStates();
  const currentIndex = states.indexOf(currentState);

  if (currentIndex <= 0) {
    return currentState;
  }

  return states[currentIndex - 1];
};
