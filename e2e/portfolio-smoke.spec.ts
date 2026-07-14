import { expect, test, type Page, type Route } from '@playwright/test';

type JsonRecord = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const captureScreenshots = process.env.CAPTURE_PORTFOLIO_SCREENSHOTS === '1';

function createPlanFixture(spaceId: string) {
  const planId = 'plan-portfolio-1';
  const task = {
    id: 'task-calculus-1',
    planId,
    subject: '高等数学',
    title: '微积分核心概念与例题',
    type: 'study',
    priority: 'high',
    status: 'pending',
    estimatedMinutes: 60,
    scheduledDate: '2026-07-15',
    groupLabel: '7月15日 周三',
    order: 0,
    dependencies: [],
  };
  const summaryProps = {
    spaceName: '高等数学期末冲刺',
    spaceDescription: '围绕期末考试进行可执行的复习安排。',
    primaryGoal: '期末考试获得85分以上',
    targetScore: 85,
    currentScore: 65,
    examDate: '2026-08-13',
    daysRemaining: 30,
    overallProgress: 0,
    subjects: [{ name: '高等数学', progress: 0, targetLevel: 85 }],
  };
  const dailyProps = {
    date: '2026-07-15',
    tasks: [{
      id: task.id,
      subject: task.subject,
      task: task.title,
      duration: task.estimatedMinutes,
      priority: task.priority,
      status: task.status,
      scheduledDate: task.scheduledDate,
      groupLabel: task.groupLabel,
    }],
    totalTaskCount: 1,
    displayedTaskCount: 1,
    scheduleGroups: [{
      date: task.scheduledDate,
      label: task.groupLabel,
      tasks: [{
        id: task.id,
        subject: task.subject,
        task: task.title,
        duration: task.estimatedMinutes,
        priority: task.priority,
        status: task.status,
        scheduledDate: task.scheduledDate,
        groupLabel: task.groupLabel,
      }],
    }],
    totalDuration: 60,
    completionRate: 0,
  };
  const timelineProps = {
    startDate: '2026-07-15',
    endDate: '2026-08-13',
    events: [
      { date: '2026-07-15', title: '基础巩固阶段', type: 'milestone', importance: 'medium' },
      { date: '2026-08-13', title: '期末考试', type: 'exam', importance: 'high' },
    ],
  };
  const blockMeta = {
    timestamp: 1,
    planId,
    planVersion: 1,
    persisted: true,
  };
  const uiBlocks = [
    { id: `${planId}:summary`, type: 'summary-card', title: '期末冲刺学习计划', props: summaryProps, meta: blockMeta },
    { id: `${planId}:tasks`, type: 'daily-task-list', title: '今日学习任务', props: dailyProps, meta: blockMeta },
    { id: `${planId}:timeline`, type: 'study-timeline', title: '学习时间线', props: timelineProps, meta: blockMeta },
  ];

  return {
    uiBlocks,
    snapshot: {
      plan: {
        id: planId,
        spaceId,
        title: '期末冲刺学习计划',
        status: 'active',
        version: 1,
        createdAt: 1,
        updatedAt: 1,
      },
      tasks: [task],
      blocks: [
        { id: `${planId}:summary`, planId, type: 'summary-card', title: '期末冲刺学习计划', order: 0, props: summaryProps, taskIds: [] },
        { id: `${planId}:tasks`, planId, type: 'daily-task-list', title: '今日学习任务', order: 1, props: { date: dailyProps.date, totalTaskCount: 1, displayedTaskCount: 1, totalDuration: 60, completionRate: 0 }, taskIds: [task.id] },
        { id: `${planId}:timeline`, planId, type: 'study-timeline', title: '学习时间线', order: 2, props: timelineProps, taskIds: [] },
      ],
    },
  };
}

async function installPortfolioApiFixture(page: Page) {
  const spaces: JsonRecord[] = [];
  const sessions = new Map<string, JsonRecord>();
  let planSnapshot: JsonRecord | null = null;
  let latestExecution: JsonRecord | null = null;

  const fulfillJson = (route: Route, data: unknown, status = 200) => route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ success: status < 400, data, error: null }),
  });

  await page.route('http://localhost:3001/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method();

    if (path === '/chat' && method === 'POST') {
      const body = request.postDataJSON() as JsonRecord;
      const spaceId = body.studySpaceId as string;
      const fixture = createPlanFixture(spaceId);
      planSnapshot = fixture.snapshot;
      const executionId = 'execution-portfolio-1';
      const events = [
        {
          type: 'agent_execution_start',
          executionId,
          title: '创建学习计划',
          steps: [
            { stepId: 'load_space_context', title: '读取学习空间' },
            { stepId: 'analyze_requirements', title: '分析学习目标' },
            { stepId: 'generate_plan', title: '生成任务排程' },
          ],
        },
        { type: 'workflow_step', step: 'analyzing', progress: 45 },
        { type: 'workflow_step', step: 'generating', progress: 75 },
        ...fixture.uiBlocks.map(block => ({ type: 'ui_block_update', action: 'add', block })),
        { type: 'agent_execution_finish', executionId, status: 'completed', summary: '学习计划已生成' },
        { type: 'workflow_step', step: 'finalized', progress: 100 },
        { type: 'content', content: '学习计划已生成，可查看今日任务和学习时间线。' },
      ].map(event => ({
        runId: body.runId,
        messageId: body.messageId,
        timestamp: Date.now(),
        ...event,
      }));
      latestExecution = {
        executionId,
        title: '创建学习计划',
        status: 'completed',
        steps: [],
        spaceId,
        sessionId: '',
        messageId: body.messageId,
        updatedAt: Date.now(),
      };
      await new Promise(resolve => setTimeout(resolve, 800));
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: { 'Cache-Control': 'no-cache' },
        body: `${events.map(event => `data: ${JSON.stringify(event)}\n\n`).join('')}data: [DONE]\n\n`,
      });
      return;
    }

    if (path === '/study-spaces' && method === 'GET') {
      await fulfillJson(route, spaces);
      return;
    }
    const spaceMatch = path.match(/^\/study-spaces\/([^/]+)$/);
    if (spaceMatch && method === 'PUT') {
      const next = request.postDataJSON() as JsonRecord;
      const existingIndex = spaces.findIndex(space => space.id === next.id);
      if (existingIndex >= 0) spaces[existingIndex] = next;
      else spaces.push(next);
      await fulfillJson(route, next);
      return;
    }
    if (path === '/chat-sessions' && method === 'GET') {
      await fulfillJson(route, Array.from(sessions.values()));
      return;
    }
    const sessionMatch = path.match(/^\/chat-sessions\/([^/]+)$/);
    if (sessionMatch && method === 'PUT') {
      const body = request.postDataJSON() as JsonRecord;
      const snapshot = { ...body.session, messages: body.messages };
      sessions.set(snapshot.id, snapshot);
      await fulfillJson(route, snapshot);
      return;
    }
    if (path === '/plans' && method === 'POST') {
      planSnapshot = request.postDataJSON() as JsonRecord;
      await fulfillJson(route, planSnapshot);
      return;
    }
    if (/^\/plans\/[^/]+\/activate$/.test(path) && method === 'PATCH') {
      if (planSnapshot) planSnapshot.plan.status = 'active';
      await fulfillJson(route, planSnapshot);
      return;
    }
    if (/^\/spaces\/[^/]+\/plans\/latest$/.test(path) && method === 'GET') {
      await fulfillJson(route, planSnapshot);
      return;
    }
    if (/^\/spaces\/[^/]+\/executions\/latest$/.test(path) && method === 'GET') {
      await fulfillJson(route, latestExecution);
      return;
    }
    if (/^\/spaces\/[^/]+\/executions$/.test(path) && method === 'POST') {
      latestExecution = request.postDataJSON() as JsonRecord;
      await fulfillJson(route, latestExecution);
      return;
    }
    if (/^\/spaces\/[^/]+\/plan-change-sets\/pending$/.test(path) && method === 'GET') {
      await fulfillJson(route, null);
      return;
    }

    throw new Error(`Unhandled fixture request: ${method} ${path}`);
  });

  return { spaces };
}

test('portfolio core loop remains real, navigable, and restorable', async ({ page }) => {
  const fixture = await installPortfolioApiFixture(page);

  await page.goto('/workSpace');
  await expect(page.getByRole('button', { name: '加载示例空间' })).toBeVisible();
  await expect(page.getByText('功能开发中')).toHaveCount(0);
  await expect(page.getByText('数据分析')).toHaveCount(0);
  await expect(page.getByText('复盘记录')).toHaveCount(0);

  await page.getByRole('button', { name: '加载示例空间' }).click();
  await expect(page.locator('.space-card-title', { hasText: '高等数学期末冲刺' })).toBeVisible();
  await expect.poll(() => fixture.spaces.length).toBe(1);
  if (captureScreenshots) {
    await page.screenshot({ path: 'docs/screenshots/01-study-spaces.png', fullPage: true });
  }

  await page.getByRole('button', { name: '进入空间' }).click();
  await page.getByRole('button', { name: '生成初次学习计划' }).click();
  await expect(page.getByRole('heading', { name: '正在生成学习计划' })).toBeVisible();
  if (captureScreenshots) {
    await page.screenshot({ path: 'docs/screenshots/02-sse-generating.png', fullPage: true });
  }

  await expect(page.getByRole('heading', { name: '学习计划总览' })).toBeVisible();
  await expect(page.getByText('期末冲刺学习计划').first()).toBeVisible();

  await page.getByRole('link', { name: '今日任务' }).click();
  await expect(page.getByRole('heading', { name: '今日任务' })).toBeVisible();
  await expect(page.getByText('微积分核心概念与例题')).toBeVisible();

  await page.getByRole('link', { name: '学习时间线' }).click();
  await expect(page.getByRole('heading', { name: '学习时间线', level: 1 })).toBeVisible();
  await expect(page.getByText('期末考试')).toBeVisible();

  await page.getByRole('link', { name: '学习计划' }).click();
  await expect(page.getByText('期末冲刺学习计划').first()).toBeVisible();
  if (captureScreenshots) {
    await page.screenshot({ path: 'docs/screenshots/03-final-plan.png', fullPage: true });
  }

  await page.reload();
  await expect(page.getByRole('heading', { name: '学习计划', level: 1 })).toBeVisible();
  await expect(page.getByText('微积分核心概念与例题')).toBeVisible();
  await expect(page.getByText('复盘记录')).toHaveCount(0);
});
