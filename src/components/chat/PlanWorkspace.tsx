import React from 'react';
import { renderBlocks } from '../../core/schema/componentRegistry.tsx';
import type { UIBlock, WorkspaceState } from '@/types/uiBlocks';
import { GeneratingSkeleton } from '@/components/ui-blocks/GeneratingSkeleton/GeneratingSkeleton';
import './PlanWorkspace.css';

interface PlanWorkspaceProps {
  workspaceState: WorkspaceState;
  uiBlocks: UIBlock[];
}

const PLAN_BLOCK_TYPES = new Set([
  'summary-card',
  'daily-task-list',
  'study-timeline',
  'risk-alert',
  'progress-bar',
  'action-bar'
]);

const ACTION_BLOCK_TYPES = new Set(['action-bar']);

const ACTIVE_GENERATION_STATES: WorkspaceState[] = ['analyzing', 'generating', 'reviewing'];

export const PlanWorkspace: React.FC<PlanWorkspaceProps> = ({
  workspaceState,
  uiBlocks
}) => {
  const planBlocks = uiBlocks.filter(block => PLAN_BLOCK_TYPES.has(block.type));
  const actionBlocks = planBlocks.filter(block => ACTION_BLOCK_TYPES.has(block.type));
  const contentBlocks = planBlocks.filter(block => !ACTION_BLOCK_TYPES.has(block.type));
  const shouldShowGenerating = planBlocks.length === 0 && ACTIVE_GENERATION_STATES.includes(workspaceState);

  if (workspaceState === 'empty' || (workspaceState === 'collecting' && planBlocks.length === 0)) {
    return null;
  }

  return (
    <aside className="plan-workspace">
      <div className="plan-workspace-header">
        <div>
          <h2 className="plan-workspace-title">学习计划</h2>
          <p className="plan-workspace-subtitle">{getWorkspaceSubtitle(workspaceState, planBlocks.length)}</p>
        </div>
        <span className={`plan-workspace-status plan-workspace-status-${workspaceState}`}>
          {getWorkspaceStatusLabel(workspaceState)}
        </span>
      </div>

      <div className="plan-workspace-content">
        {shouldShowGenerating ? (
          <GeneratingSkeleton
            title="正在生成学习计划"
            message="正在分析目标、考试时间和薄弱点，并组织每日任务与时间线。"
            progress={workspaceState === 'analyzing' ? 35 : workspaceState === 'generating' ? 70 : 90}
            steps={[
              { name: '分析学习目标', status: workspaceState === 'analyzing' ? 'running' : 'completed' },
              { name: '拆解薄弱点', status: workspaceState === 'analyzing' ? 'pending' : 'completed' },
              { name: '生成每日任务', status: workspaceState === 'generating' ? 'running' : workspaceState === 'reviewing' ? 'completed' : 'pending' },
              { name: '构建学习时间线', status: workspaceState === 'reviewing' ? 'running' : 'pending' }
            ]}
          />
        ) : contentBlocks.length > 0 ? (
          renderBlocks(contentBlocks)
        ) : (
          <div className="plan-workspace-empty">
            <h3>暂无计划内容</h3>
            <p>提交完整信息后，学习计划会在这里生成。</p>
          </div>
        )}
      </div>

      {actionBlocks.length > 0 && (
        <div className="plan-workspace-actions">
          {renderBlocks(actionBlocks)}
        </div>
      )}
    </aside>
  );
};

function getWorkspaceSubtitle(state: WorkspaceState, blockCount: number): string {
  if (blockCount > 0) {
    return '任务、时间线和调整操作会在这里集中展示';
  }

  const subtitles: Partial<Record<WorkspaceState, string>> = {
    analyzing: '正在理解你的目标与约束',
    generating: '正在生成任务拆解和学习节奏',
    reviewing: '正在整理可确认的计划视图',
    finalized: '计划已生成，可以开始执行'
  };

  return subtitles[state] || '等待计划生成';
}

function getWorkspaceStatusLabel(state: WorkspaceState): string {
  const labels: Record<WorkspaceState, string> = {
    empty: '未开始',
    collecting: '收集中',
    analyzing: '分析中',
    generating: '生成中',
    reviewing: '待确认',
    finalized: '已完成',
    paused: '已暂停'
  };

  return labels[state] || state;
}

export default PlanWorkspace;
