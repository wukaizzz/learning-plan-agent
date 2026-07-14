import React, { useState } from 'react';
import { renderBlocks } from '../../core/schema/componentRegistry.tsx';
import type { UIBlock, WorkspaceState } from '../../types/uiBlocks';
import './WorkflowSection.css';

const WORKFLOW_BLOCK_TYPES = new Set([
  'workflow-indicator',
  'generating-skeleton',
  'tool-call-status'
]);

interface WorkflowSectionProps {
  workspaceState: WorkspaceState;
  uiBlocks: UIBlock[];
}

export const WorkflowSection: React.FC<WorkflowSectionProps> = ({
  workspaceState,
  uiBlocks
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const workflowBlocks = uiBlocks.filter(block => WORKFLOW_BLOCK_TYPES.has(block.type));

  if (workspaceState === 'empty' || workflowBlocks.length === 0) {
    return null;
  }

  return (
    <div className={`workflow-section ${isMinimized ? 'minimized' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="workflow-section-header">
        <div className="workflow-section-header-left">
          <div className="workflow-section-indicator" />
          <h3 className="workflow-section-title">
            AI 工作流处理
          </h3>
          <span className="workflow-section-state">
            {workspaceState}
          </span>
        </div>

        <div className="workflow-section-controls">
          <button
            className="workflow-section-control-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? '展开' : '最小化'}
          >
            {isMinimized ? '▾' : '▴'}
          </button>
          <button
            className="workflow-section-control-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? '折叠内容' : '展开内容'}
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {isExpanded && !isMinimized && (
        <div className="workflow-section-content">
          <div className="workflow-blocks-container">
            {renderBlocks(workflowBlocks)}
          </div>

          <div className="workflow-section-info">
            <span className="workflow-blocks-count">
              {workflowBlocks.length} 个 UI 组件
            </span>
            <span className="workflow-state-description">
              {getStateDescription(workspaceState)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

function getStateDescription(state: WorkspaceState): string {
  const descriptions: Record<WorkspaceState, string> = {
    empty: '等待开始',
    collecting: '正在收集学习信息...',
    analyzing: '正在分析数据...',
    generating: '正在生成学习计划...',
    reviewing: '请查看并确认生成的计划',
    finalized: '计划执行中',
    paused: '计划已暂停'
  };

  return descriptions[state] || '处理中...';
}
