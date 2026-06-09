import { renderBlocks } from '@/core/schema/componentRegistry.tsx';
import type { UIBlock } from '@/types/uiBlocks';

const PLAN_BLOCK_TYPES = new Set([
  'summary-card',
  'daily-task-list',
  'study-timeline',
  'risk-alert',
  'progress-bar',
  'action-bar'
]);

const ACTION_BLOCK_TYPES = new Set(['action-bar']);

interface PlanBlocksRendererProps {
  uiBlocks: UIBlock[];
  allowedTypes?: string[];
  emptyTitle?: string;
  emptyDescription?: string;
}

function hasActionItems(block: UIBlock): boolean {
  const actions = (block.props as { actions?: unknown }).actions;
  return Array.isArray(actions) && actions.length > 0;
}

function getPlanBlocks(uiBlocks: UIBlock[], allowedTypes?: string[]) {
  const allowedTypeSet = allowedTypes ? new Set(allowedTypes) : PLAN_BLOCK_TYPES;
  return uiBlocks.filter(block => allowedTypeSet.has(block.type));
}

export const PlanBlocksRenderer: React.FC<PlanBlocksRendererProps> = ({
  uiBlocks,
  allowedTypes,
  emptyTitle = '暂无计划内容',
  emptyDescription = '生成学习计划后，这里会展示后端返回的真实计划组件。'
}) => {
  const planBlocks = getPlanBlocks(uiBlocks, allowedTypes);
  const actionBlocks = planBlocks.filter(block => ACTION_BLOCK_TYPES.has(block.type) && hasActionItems(block));
  const contentBlocks = planBlocks.filter(block => !ACTION_BLOCK_TYPES.has(block.type));

  if (contentBlocks.length === 0 && actionBlocks.length === 0) {
    return (
      <div className="study-space-empty-card">
        <h3>{emptyTitle}</h3>
        <p>{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="plan-blocks-renderer">
      {contentBlocks.length > 0 && (
        <div className="plan-blocks-content">
          {renderBlocks(contentBlocks)}
        </div>
      )}
      {actionBlocks.length > 0 && (
        <div className="plan-blocks-actions">
          {renderBlocks(actionBlocks)}
        </div>
      )}
    </div>
  );
};
