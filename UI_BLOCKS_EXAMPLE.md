import { z } from 'zod';

// ============== UI Block Schema 定义 ==============

// 1. 概况卡片 Block
export const SummaryCardBlockSchema = z.object({
  type: z.literal('summary-card'),
  data: z.object({
    goal: z.string(),                    // 学习目标
    deadline: z.string(),                // 考试日期 "2024-06-15"
    daysRemaining: z.number(),           // 剩余天数
    overallProgress: z.number(),         // 总体进度 0-100
    riskLevel: z.enum(['low', 'medium', 'high']), // 风险等级
    keyMetrics: z.object({
      totalTasks: z.number(),            // 总任务数
      completedTasks: z.number(),        // 已完成任务
      studyHours: z.number(),            // 已投入学习小时
      consecutiveDays: z.number(),       // 连续学习天数
    })
  })
});

// 2. 学习时间轴 Block
export const StudyTimelineBlockSchema = z.object({
  type: z.literal('study-timeline'),
  data: z.object({
    timeline: z.array(z.object({
      date: z.string(),                  // "2024-05-20"
      dayOfWeek: z.string(),             // "周一"
      isToday: z.boolean(),              // 是否是今天
      tasks: z.array(z.object({
        id: z.string(),
        subject: z.string(),             // "高数"
        title: z.string(),               // "微积分基本定理"
        duration: z.number(),            // 120 (分钟)
        priority: z.enum(['high', 'medium', 'low']),
        taskType: z.enum(['study', 'review', 'practice', 'exam']),
        status: z.enum(['pending', 'completed', 'cancelled'])
      }))
    }))
  })
});

// 3. 每日任务列表 Block
export const DailyTaskListBlockSchema = z.object({
  type: z.literal('daily-task-list'),
  data: z.object({
    date: z.string(),
    totalTasks: z.number(),
    estimatedTime: z.number(),          // 总预计时间(分钟)
    tasks: z.array(z.object({
      id: z.string(),
      timeSlot: z.string(),             // "09:00-11:00"
      subject: z.string(),
      title: z.string(),
      duration: z.number(),
      priority: z.enum(['high', 'medium', 'low']),
      taskType: z.enum(['study', 'review', 'practice', 'exam']),
      resources: z.array(z.string()).optional(), // 学习资料
      notes: z.string().optional()      // 备注
    }))
  })
});

// 4. 进度面板 Block
export const ProgressPanelBlockSchema = z.object({
  type: z.literal('progress-panel'),
  data: z.object({
    overallProgress: z.number(),        // 总体进度 0-100
    subjectProgress: z.array(z.object({
      subject: z.string(),              // "高数"
      progress: z.number(),             // 75
      target: z.number(),               // 目标进度
      hoursSpent: z.number(),           // 投入小时
      tasksCompleted: z.number(),       // 完成任务数
      totalTasks: z.number()
    })),
    weeklyStats: z.object({
      studyHours: z.number(),           // 本周学习小时
      tasksCompleted: z.number(),       // 本周完成任务
      activeDays: z.number(),           // 学习天数
      completionRate: z.number()        // 完成率
    })
  })
});

// 5. 风险预警 Block
export const RiskAlertBlockSchema = z.object({
  type: z.literal('risk-alert'),
  data: z.object({
    risks: z.array(z.object({
      id: z.string(),
      type: z.enum(['schedule_delay', 'time_pressure', 'weak_subject', 'task_overload']),
      severity: z.enum(['warning', 'critical', 'info']),
      title: z.string(),                // "高数进度滞后"
      description: z.string(),          // "比计划慢了3天，需要加强投入"
      suggestedActions: z.array(z.string()), // 建议措施
      affectedSubjects: z.array(z.string())  // 影响的科目
    }))
  })
});

// 6. 操作建议 Block
export const ActionBarBlockSchema = z.object({
  type: z.literal('action-bar'),
  data: z.object({
    actions: z.array(z.object({
      id: z.string(),
      type: z.enum(['adjust_plan', 'add_task', 'reschedule', 'focus_mode']),
      title: z.string(),                // "调整计划"
      description: z.string(),          // "根据当前进度优化后续安排"
      icon: z.string(),                 // "🔄"
      priority: z.enum(['high', 'medium', 'low']),
      params: z.record(z.any()).optional() // 执行参数
    }))
  })
});

// 7. 学科分析 Block
export const SubjectAnalysisBlockSchema = z.object({
  type: z.literal('subject-analysis'),
  data: z.object({
    subjects: z.array(z.object({
      name: z.string(),                 // "高数"
      currentLevel: z.number(),         // 当前水平 0-100
      targetLevel: z.number(),          // 目标水平
      progress: z.number(),             // 进度百分比
      strongPoints: z.array(z.string()), // 强项
      weakPoints: z.array(z.string()),  // 薄弱点
      recommendedFocus: z.string(),     // 建议重点
      timeAllocation: z.number()        // 建议时间分配
    }))
  })
});

// ============== 联合类型 ==============
export const UIBlockSchema = z.discriminatedUnion('type', [
  SummaryCardBlockSchema,
  StudyTimelineBlockSchema,
  DailyTaskListBlockSchema,
  ProgressPanelBlockSchema,
  RiskAlertBlockSchema,
  ActionBarBlockSchema,
  SubjectAnalysisBlockSchema
]);

export type UIBlock = z.infer<typeof UIBlockSchema>;
export type UIBlockType = UIBlock['type'];

// ============== Agent 响应格式 ==============
export const AgentResponseSchema = z.object({
  message: z.string().optional(),       // 可选的文本消息
  blocks: z.array(UIBlockSchema),       // UI Block 数组
  planUpdate: z.any().optional(),       // 计划更新数据
  suggestions: z.array(z.string()).optional(), // 建议操作
  metadata: z.object({
    timestamp: z.string(),
    confidence: z.number(),             // 置信度 0-1
    reasoning: z.string().optional()    // 推理过程
  }).optional()
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

// ============== 使用示例 ==============
export const EXAMPLE_AGENT_RESPONSE: AgentResponse = {
  message: "根据你当前的学习进度，我为你调整了明天的学习计划：",
  blocks: [
    {
      type: "summary-card",
      data: {
        goal: "高数期末冲刺",
        deadline: "2024-06-15",
        daysRemaining: 26,
        overallProgress: 45,
        riskLevel: "medium",
        keyMetrics: {
          totalTasks: 120,
          completedTasks: 54,
          studyHours: 48,
          consecutiveDays: 7
        }
      }
    },
    {
      type: "daily-task-list",
      data: {
        date: "2024-05-20",
        totalTasks: 4,
        estimatedTime: 240,
        tasks: [
          {
            id: "task-1",
            timeSlot: "09:00-11:00",
            subject: "高数",
            title: "微分方程基础",
            duration: 120,
            priority: "high",
            taskType: "study",
            resources: ["教材第8章", "习题集8-1至8-5"],
            notes: "重点掌握一阶线性微分方程"
          },
          {
            id: "task-2",
            timeSlot: "14:00-15:00",
            subject: "英语",
            title: "阅读理解专项训练",
            duration: 60,
            priority: "medium",
            taskType: "practice",
            resources: ["真题集2023"]
          }
        ]
      }
    },
    {
      type: "risk-alert",
      data: {
        risks: [
          {
            id: "risk-1",
            type: "schedule_delay",
            severity: "warning",
            title: "线性代数进度滞后",
            description: "比原计划慢了2天，建议增加练习时间",
            suggestedActions: [
              "每天额外增加30分钟线性代数练习",
              "周末安排2小时集中复习"
            ],
            affectedSubjects: ["线性代数"]
          }
        ]
      }
    }
  ],
  metadata: {
    timestamp: "2024-05-19T10:30:00Z",
    confidence: 0.92,
    reasoning: "基于你最近3天的完成情况和考试时间"
  }
};

console.log(AgentResponseSchema.parse(EXAMPLE_AGENT_RESPONSE));