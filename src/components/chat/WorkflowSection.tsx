/**
 * WorkflowSection Component
 * 在ChatPanel中显示工作流相关的UI Blocks
 *
 * 功能：
 * - 根据 workspaceState 决定是否显示
 * - 渲染当前状态的 UI Blocks
 * - 支持折叠/展开
 * - 提供工作流状态控制
 */

import React, { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { renderBlocks } from '../../core/schema/componentRegistry.tsx';
import type { UIBlock,WorkspaceState } from '../../types/uiBlocks';

interface WorkflowSectionProps {
  workspaceState: WorkspaceState;
  uiBlocks: UIBlock[];
  onStateChange?: (newState: WorkspaceState) => void;
}

export const WorkflowSection: React.FC<WorkflowSectionProps> = ({
  workspaceState,
  uiBlocks,
  onStateChange
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // workspaceState 为 'empty' 时不显示
  if (workspaceState === 'empty' || uiBlocks.length === 0) {
    return null;
  }

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className={`workflow-section ${isMinimized ? 'minimized' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* 工作流头部 */}
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
            onClick={handleToggleMinimize}
            title={isMinimized ? '展开' : '最小化'}
          >
            {isMinimized ? '⬇' : '⬆'}
          </button>
          <button
            className="workflow-section-control-btn"
            onClick={handleToggleExpand}
            title={isExpanded ? '折叠内容' : '展开内容'}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* 工作流内容 */}
      {isExpanded && !isMinimized && (
        <div className="workflow-section-content">
          {/* UI Blocks 渲染区域 */}
          <div className="workflow-blocks-container">
            {renderBlocks(uiBlocks)}
          </div>

          {/* 工作流信息 */}
          {uiBlocks.length > 0 && (
            <div className="workflow-section-info">
              <span className="workflow-blocks-count">
                {uiBlocks.length} 个 UI 组件
              </span>
              <span className="workflow-state-description">
                {getStateDescription(workspaceState)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 获取工作流状态的描述文本
 */
function getStateDescription(state: WorkspaceState): string {
  const descriptions: Record<WorkspaceState, string> = {
    'empty': '等待开始',
    'collecting': '正在收集学习信息...',
    'analyzing': '正在分析数据...',
    'generating': '正在生成学习计划...',
    'reviewing': '请查看并确认生成的计划',
    'finalized': '计划执行中',
    'paused': '计划已暂停'
  };

  return descriptions[state] || '处理中...';
}
