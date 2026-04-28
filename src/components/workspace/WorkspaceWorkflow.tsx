/**
 * WorkspaceWorkflow - 工作流展示和 UI Blocks 渲染组件
 *
 * 这个组件演示了如何将整个系统整合在一起：
 * 1. 从 chatStore 读取当前 workspaceState
 * 2. 使用 workflowManager 获取对应的 UI Blocks
 * 3. 使用 componentRegistry 渲染这些 Blocks
 */

import React, { useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { getBlocksForState } from '../../core/workflow/workflowManager';
import { renderBlocks } from '../../core/schema/componentRegistry.tsx';
import type { WorkspaceState } from '../../types/uiBlocks';
import './WorkspaceWorkflow.css';

/**
 * 工作流状态控制面板 - 用于测试和演示
 */
const WorkflowControls: React.FC = () => {
  const { workspaceState, setWorkspaceState, setUIBlocks } = useChatStore();

  const states: WorkspaceState[] = [
    'empty',
    'collecting',
    'analyzing',
    'generating',
    'reviewing',
    'finalized',
    'paused'
  ];

  const handleStateChange = (newState: WorkspaceState) => {
    console.log('🎯 Manual state change:', newState);
    setWorkspaceState(newState);
    const newBlocks = getBlocksForState(newState);
    setUIBlocks(newBlocks);
  };

  return (
    <div className="workflow-controls">
      <h3>工作流状态控制 (测试面板)</h3>
      <div className="state-buttons">
        {states.map(state => (
          <button
            key={state}
            onClick={() => handleStateChange(state)}
            className={`state-button ${workspaceState === state ? 'active' : ''}`}
          >
            {state}
          </button>
        ))}
      </div>
      <p className="current-state-display">
        当前状态: <strong>{workspaceState}</strong>
      </p>
    </div>
  );
};

/**
 * UI Blocks 渲染区域
 */
const BlocksRenderer: React.FC = () => {
  const { uiBlocks, workspaceState } = useChatStore();

  if (uiBlocks.length === 0) {
    return (
      <div className="blocks-empty">
        <p>当前状态 (<strong>{workspaceState}</strong>) 没有显示的 UI Blocks</p>
        <p className="hint">提示：使用上方控制面板切换工作流状态</p>
      </div>
    );
  }

  return (
    <div className="blocks-container">
      <div className="blocks-header">
        <h3>UI Blocks 渲染区域</h3>
        <span className="blocks-count">{uiBlocks.length} 个 Blocks</span>
      </div>
      <div className="blocks-content">
        {renderBlocks(uiBlocks)}
      </div>
    </div>
  );
};

/**
 * 主工作流组件
 */
export const WorkspaceWorkflow: React.FC = () => {
  const { workspaceState, uiBlocks, setUIBlocks } = useChatStore();

  // 当 workspaceState 变化时，自动获取对应的 UI Blocks
  useEffect(() => {
    console.log('🔄 Workspace state changed to:', workspaceState);
    const newBlocks = getBlocksForState(workspaceState);
    console.log('📦 Generated blocks:', newBlocks.length);
    setUIBlocks(newBlocks);
  }, [workspaceState, setUIBlocks]);

  return (
    <div className="workspace-workflow">
      <div className="workflow-header">
        <h2>🎯 Agent 工作流展示和 Schema-Driven UI</h2>
        <p className="workflow-description">
          这个组件演示了 Agent 如何通过改变工作流状态来控制 UI 显示
        </p>
      </div>

      {/* 工作流状态控制面板 */}
      <WorkflowControls />

      {/* UI Blocks 渲染区域 */}
      <BlocksRenderer />

      {/* 调试信息 */}
      <div className="workflow-debug">
        <h4>🔍 调试信息</h4>
        <div className="debug-content">
          <p><strong>当前工作流状态:</strong> {workspaceState}</p>
          <p><strong>UI Blocks 数量:</strong> {uiBlocks.length}</p>
          <p><strong>Blocks 类型:</strong> {uiBlocks.map(b => b.type).join(', ') || '无'}</p>
        </div>
      </div>
    </div>
  );
};
