import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AgentExecutionCard } from '@/components/chat/message/AgentExecutionCard';
import { GeneratingSkeleton } from '@/components/ui-blocks/GeneratingSkeleton/GeneratingSkeleton';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useChat, useStream, usePlanHydration } from '@/hooks';
import { useChatStore, useSpaceStore } from '@/store';
import { mapSpaceToContext } from '@/utils/spaceContextMapper';
import type { StudySpace } from '@/types/space';
import type { AgentExecutionState, Message } from '@/types/chat';
import { PlanBlocksRenderer } from './PlanBlocksRenderer';
import { getHasGeneratedPlan, isPlanGenerationState } from './spacePlanStatus';
import './SpacePages.css';

const INITIAL_PLANNING_PROMPT = '请基于当前学习空间信息生成初次学习计划。';

function useSpacePageData() {
  const { spaceId } = useParams();
  const spaces = useSpaceStore(state => state.spaces);
  const workspaceState = useChatStore(state => state.workspaceState);
  const messages = useChatStore(state => state.messages);
  const currentChatSpaceId = useChatStore(state => state.currentSpaceId);
  const isStreaming = useChatStore(state => state.isStreaming);

  // 🆕 从 planStore 获取持久化 blocks + hasPlan（订阅式）
  const { uiBlocks: planUiBlocks, hasPlan: persistedHasPlan } = usePlanHydration(spaceId);

  const space = spaceId ? spaces.find(item => item.id === spaceId) || null : null;
  const isCurrentChatSpace = currentChatSpaceId === spaceId;
  const effectiveWorkspaceState = isCurrentChatSpace ? workspaceState : 'empty';
  const effectiveUiBlocks = planUiBlocks;
  const effectiveMessages = isCurrentChatSpace ? messages : [];
  const hasPlan = persistedHasPlan || getHasGeneratedPlan(space, effectiveUiBlocks);
  const latestExecution = getLatestAgentExecution(effectiveMessages);
  const isGenerating = !hasPlan && (
    isPlanGenerationState(effectiveWorkspaceState) ||
    latestExecution?.status === 'running' ||
    (isCurrentChatSpace && isStreaming)
  );

  return {
    spaceId,
    space,
    workspaceState: effectiveWorkspaceState,
    uiBlocks: effectiveUiBlocks,
    messages: effectiveMessages,
    isStreaming: isCurrentChatSpace && isStreaming,
    hasPlan,
    latestExecution,
    isGenerating
  };
}

export const SpaceOverviewPage: React.FC = () => {
  const { space, uiBlocks, isStreaming, hasPlan, latestExecution, isGenerating, workspaceState } = useSpacePageData();
  const { addUserMessage } = useChat();
  const { streamResponse } = useStream();
  const switchToSpaceSession = useChatStore(state => state.switchToSpaceSession);
  const navigate = useNavigate();

  const handleStartPlanning = async () => {
    if (!space || isStreaming) return;

    switchToSpaceSession(space.id);
    addUserMessage(INITIAL_PLANNING_PROMPT);

    try {
      await streamResponse(
        useChatStore.getState().messages,
        'deepseek',
        { studySpaceContext: mapSpaceToContext(space) }
      );
    } catch (error) {
      console.error('Failed to start initial planning:', error);
      window.alert(`生成学习计划失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  if (!space) {
    return <SpacePageShell title="学习空间" description="未找到当前学习空间。" />;
  }

  if (isGenerating) {
    return (
      <SpacePageShell title="正在生成学习计划" description="Agent 正在基于当前学习空间信息生成计划。">
        <div className="study-space-generation-grid">
          {latestExecution && <AgentExecutionCard execution={latestExecution} />}
          <GeneratingSkeleton
            message="正在分析目标、科目、考试日期和每日可用时间。"
            progress={getGenerationProgress(workspaceState)}
            steps={[
              { name: '读取空间信息', status: 'completed' },
              { name: '分析学习目标', status: workspaceState === 'collecting' ? 'running' : 'completed' },
              { name: '生成任务拆解', status: workspaceState === 'generating' ? 'running' : workspaceState === 'reviewing' ? 'completed' : 'pending' },
              { name: '构建计划视图', status: workspaceState === 'reviewing' ? 'running' : 'pending' }
            ]}
          />
          <SpaceInfoSummary space={space} />
          <Link className="study-space-secondary-link" to={`/workSpace/${space.id}/chat`}>
            查看 Agent 对话
          </Link>
        </div>
      </SpacePageShell>
    );
  }

  if (hasPlan) {
    return (
      <SpacePageShell title="学习计划总览" description="这里展示后端返回的真实计划组件。">
        <PlanBlocksRenderer uiBlocks={uiBlocks} />
      </SpacePageShell>
    );
  }

  return (
    <SpacePageShell title={space.name} description={space.description || space.goal.primaryGoal}>
      <div className="study-space-overview-actions">
        <button className="study-space-primary-button" type="button" onClick={handleStartPlanning} disabled={isStreaming}>
          {isStreaming ? (
            <>
              <LoadingSpinner size="sm" />
              正在生成
            </>
          ) : '生成初次学习计划'}
        </button>
        <button className="study-space-secondary-button" type="button" onClick={() => navigate(`/workSpace/${space.id}/chat`)}>
          进入 Agent 对话
        </button>
      </div>
      <SpaceInfoDetails space={space} />
    </SpacePageShell>
  );
};

export const SpaceAgentChatPage: React.FC = () => <ChatPanel />;

export const SpaceTasksPage: React.FC = () => {
  const { hasPlan, uiBlocks } = useSpacePageData();

  return (
    <SpacePageShell title="今日任务" description="当前阶段优先展示学习计划里的任务摘要。">
      {hasPlan ? (
        <PlanBlocksRenderer
          uiBlocks={uiBlocks}
          allowedTypes={['daily-task-list']}
          emptyTitle="暂无今日任务"
          emptyDescription="生成计划后，后端返回的 daily-task-list 会显示在这里。"
        />
      ) : (
        <LockedPageMessage message="请先生成学习计划后查看今日任务" />
      )}
    </SpacePageShell>
  );
};

export const SpacePlanPage: React.FC = () => {
  const { hasPlan, uiBlocks } = useSpacePageData();

  return (
    <SpacePageShell title="学习计划" description="完整计划会从后端返回的 UI Blocks 中渲染。">
      {hasPlan ? (
        <PlanBlocksRenderer
          uiBlocks={uiBlocks}
          allowedTypes={['summary-card', 'daily-task-list', 'risk-alert', 'action-bar', 'plan-change-preview']}
          emptyTitle="暂无完整计划"
          emptyDescription="当前会话没有可渲染的计划 blocks。"
        />
      ) : (
        <LockedPageMessage message="请先生成学习计划后查看完整计划" />
      )}
    </SpacePageShell>
  );
};

export const SpaceTimelinePage: React.FC = () => {
  const { hasPlan, uiBlocks } = useSpacePageData();

  return (
    <SpacePageShell title="学习时间线" description="按时间顺序查看计划里的关键节点。">
      {hasPlan ? (
        <PlanBlocksRenderer
          uiBlocks={uiBlocks}
          allowedTypes={['study-timeline']}
          emptyTitle="暂无学习时间线"
          emptyDescription="生成计划后，后端返回的 study-timeline 会显示在这里。"
        />
      ) : (
        <LockedPageMessage message="请先生成学习计划后查看学习时间线" />
      )}
    </SpacePageShell>
  );
};

export const SpaceReviewPage: React.FC = () => (
  <SpacePageShell title="复盘记录" description="完成任务后，这里会承载复盘数据。">
    <LockedPageMessage message="生成计划并完成任务后，这里会展示复盘数据" />
  </SpacePageShell>
);

export const SpaceSettingsPage: React.FC = () => {
  const { space } = useSpacePageData();

  return (
    <SpacePageShell title="空间设置" description="当前阶段只读展示学习空间基础字段。">
      {space ? <SpaceInfoDetails space={space} compact /> : <LockedPageMessage message="未找到当前学习空间" />}
    </SpacePageShell>
  );
};

function SpacePageShell({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="study-space-page">
      <header className="study-space-page-header">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </header>
      <div className="study-space-page-body">
        {children}
      </div>
    </section>
  );
}

function LockedPageMessage({ message }: { message: string }) {
  return (
    <div className="study-space-empty-card">
      <h3>{message}</h3>
      <p>计划生成完成后，该页面会自动解除限制。</p>
    </div>
  );
}

function SpaceInfoDetails({ space, compact = false }: { space: StudySpace; compact?: boolean }) {
  return (
    <div className={`study-space-info-grid ${compact ? 'study-space-info-grid-compact' : ''}`}>
      <InfoCard title="目标">
        <InfoRow label="主要目标" value={space.goal.primaryGoal} />
        <InfoRow label="目标分数" value={formatValue(space.goal.targetScore)} />
        <InfoRow label="考试日期" value={formatDate(space.goal.examDate)} />
        <InfoRow label="次要目标" value={space.goal.secondaryGoals.join('、') || '未设置'} />
      </InfoCard>

      <InfoCard title="时间安排">
        <InfoRow label="每日可用时间" value={`${space.schedule.availableHoursPerDay} 小时`} />
        <InfoRow label="可学习日期" value={space.schedule.availableDays.join('、')} />
        <InfoRow label="偏好时段" value={space.schedule.preferredTimeSlots.join('、') || '未设置'} />
        <InfoRow label="休息安排" value={space.schedule.restDays.join('、') || '未设置'} />
        <InfoRow label="开始日期" value={formatDate(space.schedule.startDate)} />
      </InfoCard>

      <InfoCard title="当前状态">
        <InfoRow label="阶段" value={space.currentPhase || '未设置'} />
        <InfoRow label="总学习时长" value={`${space.stats.totalStudyHours} 小时`} />
        <InfoRow label="连续学习" value={`${space.stats.consecutiveDays} 天`} />
        <InfoRow label="整体进度" value={`${space.stats.overallProgress}%`} />
        <InfoRow label="任务完成" value={`${space.stats.tasksCompleted}/${space.stats.tasksTotal}`} />
      </InfoCard>

      <InfoCard title="科目">
        <div className="study-space-subject-list">
          {space.subjects.map(subject => (
            <div className="study-space-subject" key={subject.name}>
              <div className="study-space-subject-title">
                <strong>{subject.name}</strong>
                <span>{subject.currentLevel} → {subject.targetLevel}</span>
              </div>
              <InfoRow label="薄弱点" value={subject.weakPoints.join('、') || '未设置'} />
              <InfoRow label="强项" value={subject.strongPoints.join('、') || '未设置'} />
            </div>
          ))}
        </div>
      </InfoCard>
    </div>
  );
}

function SpaceInfoSummary({ space }: { space: StudySpace }) {
  const summaryItems = useMemo(() => [
    { label: '目标', value: space.goal.primaryGoal },
    { label: '考试日期', value: formatDate(space.goal.examDate) },
    { label: '科目', value: space.subjects.map(subject => subject.name).join('、') },
    { label: '每日可用时间', value: `${space.schedule.availableHoursPerDay} 小时` }
  ], [space]);

  return (
    <div className="study-space-summary-card">
      {summaryItems.map(item => (
        <div key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value || '未设置'}</strong>
        </div>
      ))}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="study-space-info-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="study-space-info-row">
      <span>{label}</span>
      <strong>{value || '未设置'}</strong>
    </div>
  );
}

function getLatestAgentExecution(messages: Message[]): AgentExecutionState | undefined {
  return [...messages].reverse().find(message =>
    message.role === 'assistant' && message.agent_execution
  )?.agent_execution;
}

function getGenerationProgress(workspaceState: string) {
  if (workspaceState === 'collecting') return 20;
  if (workspaceState === 'analyzing') return 40;
  if (workspaceState === 'generating') return 70;
  if (workspaceState === 'reviewing') return 90;
  return 15;
}

function formatDate(value: Date | string | number | undefined) {
  if (!value) return '未设置';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);
  return date.toLocaleDateString('zh-CN');
}

function formatValue(value: string | number | undefined) {
  return value === undefined || value === '' ? '未设置' : String(value);
}
