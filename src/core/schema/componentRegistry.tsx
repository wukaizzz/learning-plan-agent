/**
 * Block Registry - Schema-Driven UI 组件渲染系统
 *
 * 这个文件实现了核心的组件注册表，将 UIBlock 类型映射到实际的 React 组件
 * 当 Agent 返回结构化的 UIBlock 数据时，这个系统会自动选择对应的组件进行渲染
 */

import React from 'react';
import type { UIBlock } from '../../types/uiBlocks';
import { ProgressBar } from '../../components/ui-blocks/ProgressBar/ProgressBar';
import { ToolCallStatus } from '../../components/ui-blocks/ToolCallStatus/ToolCallStatus';
import { WorkflowIndicator } from '../../components/ui-blocks/WorkflowIndicator/WorkflowIndicator';
import { CollectionForm } from '../../components/ui-blocks/CollectionForm';

// TODO: 逐步导入各个 UI Block 组件
// import { SummaryCard } from '../../components/ui-blocks/SummaryCard';
// import { DailyTaskList } from '../../components/ui-blocks/DailyTaskList';
// import { StudyTimeline } from '../../components/ui-blocks/StudyTimeline';
// import { RiskAlert } from '../../components/ui-blocks/RiskAlert';
// import { ActionBar } from '../../components/ui-blocks/ActionBar';
// import { GeneratingSkeleton } from '../../components/ui-blocks/GeneratingSkeleton';

/**
 * 临时占位组件 - 用于尚未实现的 Block 类型
 */
const PlaceholderBlock: React.FC<{ block: UIBlock }> = ({ block }) => (
  <div style={{
    padding: '20px',
    border: '2px dashed #ccc',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    textAlign: 'center'
  }}>
    <h3>{block.title}</h3>
    <p>Block Type: <code>{block.type}</code></p>
    <p style={{ color: '#666', fontSize: '14px' }}>
      这个组件尚未实现，请根据 props 定义开发对应的 UI 组件
    </p>
    <pre style={{
      textAlign: 'left',
      backgroundColor: '#fff',
      padding: '10px',
      borderRadius: '4px',
      fontSize: '12px',
      overflow: 'auto'
    }}>
      {JSON.stringify(block.props, null, 2)}
    </pre>
  </div>
);

/**
 * Block 组件注册表
 * 将每个 BlockType 映射到对应的 React 组件
 *
 * TODO: 在实现完各个组件后，取消对应的注释并替换 PlaceholderBlock
 */
const BLOCK_REGISTRY: Record<string, React.ComponentType<any>> = {
  'summary-card': PlaceholderBlock, // SummaryCard
  'daily-task-list': PlaceholderBlock, // DailyTaskList
  'study-timeline': PlaceholderBlock, // StudyTimeline
  'progress-bar': ProgressBar, // ✅ 已实现
  'risk-alert': PlaceholderBlock, // RiskAlert
  'action-bar': PlaceholderBlock, // ActionBar
  'tool-call-status': ToolCallStatus, // ✅ 已实现
  'collection-form': CollectionForm, // ✅ 已实现
  'generating-skeleton': PlaceholderBlock, // GeneratingSkeleton
  'workflow-indicator': WorkflowIndicator // ✅ 已实现
};

/**
 * 渲染单个 UI Block
 *
 * @param block - 要渲染的 UIBlock 对象
 * @returns 渲染后的 React 元素
 *
 * @example
 * const block = {
 *   id: 'block_123',
 *   type: 'summary-card',
 *   title: '学习概况',
 *   props: { spaceName: '高等数学', ... }
 * };
 *
 * return renderBlock(block);
 */
export const renderBlock = (block: UIBlock): React.ReactElement => {
  const Component = BLOCK_REGISTRY[block.type];

  if (!Component) {
    console.warn(`Unknown block type: ${block.type}, using placeholder`);
    return React.createElement(PlaceholderBlock, { block });
  }

  return React.createElement(Component, {
    ...block.props,
    title: block.title,
    meta: block.meta,
    key: block.id
  });
};

/**
 * 渲染多个 UI Blocks
 *
 * @param blocks - UIBlock 数组
 * @returns React 元素数组
 *
 * @example
 * const blocks = [block1, block2, block3];
 * return <div>{renderBlocks(blocks)}</div>;
 */
export const renderBlocks = (blocks: UIBlock[]): React.ReactElement[] => {
  return blocks.map(block => renderBlock(block));
};

/**
 * 注册新的 Block 组件
 * 用于动态扩展 Block 类型
 *
 * @param blockType - Block 类型标识
 * @param component - 对应的 React 组件
 *
 * @example
 * registerBlockComponent('custom-block', CustomBlockComponent);
 */
export const registerBlockComponent = (
  blockType: string,
  component: React.ComponentType<any>
): void => {
  BLOCK_REGISTRY[blockType] = component;
  console.log(`Registered new block component: ${blockType}`);
};

/**
 * 检查某个 Block 类型是否已注册
 *
 * @param blockType - Block 类型标识
 * @returns 是否已注册对应组件
 */
export const isBlockTypeRegistered = (blockType: string): boolean => {
  return blockType in BLOCK_REGISTRY;
};

/**z
 * 获取所有已注册的 Block 类型
 *
 * @returns 已注册的 Block 类型数组
 */
export const getRegisteredBlockTypes = (): string[] => {
  return Object.keys(BLOCK_REGISTRY);
};
