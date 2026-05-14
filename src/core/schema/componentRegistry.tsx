/**
 * Block Registry - Schema-Driven UI 组件渲染系统
 *
 * 这个文件实现了核心的组件注册表，将 UIBlock 类型映射到实际的 React 组件
 * 当 Agent 返回结构化的 UIBlock 数据时，这个系统会自动选择对应的组件进行渲染
 */

import React from 'react';
import type { UIBlock } from '@/types/uiBlocks';
import { ProgressBar } from '@/components/ui-blocks/ProgressBar/ProgressBar';
import { ToolCallStatus } from '@/components/ui-blocks/ToolCallStatus/ToolCallStatus';
import { WorkflowIndicator } from '@/components/ui-blocks/WorkflowIndicator/WorkflowIndicator';
import { CollectionForm, type FormField } from '@/components/ui-blocks/CollectionForm';
// ✅ 新导入的 UI Block 组件
import { SummaryCard } from '@/components/ui-blocks/SummaryCard/SummaryCard';
import { DailyTaskList } from '@/components/ui-blocks/DailyTaskList/DailyTaskList';
import { StudyTimeline } from '@/components/ui-blocks/StudyTimeline/StudyTimeline';
import { RiskAlert } from '@/components/ui-blocks/RiskAlert/RiskAlert';
import { ActionBar } from '@/components/ui-blocks/ActionBar/ActionBar';
import { GeneratingSkeleton } from '@/components/ui-blocks/GeneratingSkeleton/GeneratingSkeleton';

/**
 * 渲染上下文接口
 * 用于传递工作流相关的上下文信息
 */
export interface RenderContext {
  threadId?: string;
  onSubmit?: (data: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  stepIndex?: number;
  totalSteps?: number;
  showProgress?: boolean;
}

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
 * 扁平化字段名称
 * 将嵌套的字段名称（如 'goal.examDate'）扁平化（'examDate'）
 * 同时保留原始路径用于后续处理
 * 
 * 注意：这个函数会返回一个新的数组引用，如果传入的 fields 内容相同但引用不同，
 * 返回值也会不同。这可能导致子组件的 useEffect 重复触发。
 * 
 * 优化建议：在调用处使用 useMemo 缓存结果，或者在组件内部处理字段扁平化
 */
const flattenFieldNames = (fields: FormField[]): FormField[] => {
  return fields.map(field => ({
    ...field,
    name: field.name.split('.').pop() || field.name, // 'goal.examDate' → 'examDate'
    originalPath: field.name // 保留原始路径
  }));
};

/**
 * Block 组件注册表
 * 将每个 BlockType 映射到对应的 React 组件
 *
 * TODO: 在实现完各个组件后，取消对应的注释并替换 PlaceholderBlock
 */
const BLOCK_REGISTRY: Record<string, React.ComponentType<any>> = {
  'summary-card': SummaryCard, // ✅ 已实现
  'daily-task-list': DailyTaskList, // ✅ 已实现
  'study-timeline': StudyTimeline, // ✅ 已实现
  'progress-bar': ProgressBar, // ✅ 已实现
  'risk-alert': RiskAlert, // ✅ 已实现
  'action-bar': ActionBar, // ✅ 已实现
  'tool-call-status': ToolCallStatus, // ✅ 已实现
  'collection-form': CollectionForm, // ✅ 已实现
  'generating-skeleton': GeneratingSkeleton, // ✅ 已实现
  'workflow-indicator': WorkflowIndicator // ✅ 已实现
};

/**
 * 渲染单个 UI Block
 *
 * @param block - 要渲染的 UIBlock 对象
 * @param context - 渲染上下文（可选）
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
 * return renderBlock(block, { threadId: 'space123', onSubmit: handle });
 */
export const renderBlock = (
  block: UIBlock,
  context?: RenderContext
): React.ReactElement => {
  const Component = BLOCK_REGISTRY[block.type];

  if (!Component) {
    console.warn(`Unknown block type: ${block.type}, using placeholder`);
    return React.createElement(PlaceholderBlock, { block });
  }

  // 特殊处理 collection-form - 传递上下文信息
  if (block.type === 'collection-form' && context?.onSubmit) {
    const flattenedFields = flattenFieldNames(block.props.fields || []);

    return React.createElement(CollectionForm, {
      ...block.props,
      fields: flattenedFields,
      title: block.title,
      key: block.id,
      onSubmit: context.onSubmit,
      isLoading: context.isLoading,
      externalError: context.error,
      stepIndex: context.stepIndex ?? block.props.stepIndex ?? 0,
      totalSteps: context.totalSteps ?? block.props.totalSteps ?? 1,
      showProgress: context.showProgress ?? block.props.showProgress ?? false
    });
  }

  // 其他组件正常渲染
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
 * @param context - 渲染上下文（可选）
 * @returns React 元素数组
 *
 * @example
 * const blocks = [block1, block2, block3];
 * const context = { threadId: 'space123', onSubmit: handle };
 * return <div>{renderBlocks(blocks, context)}</div>;
 */
export const renderBlocks = (
  blocks: UIBlock[],
  context?: RenderContext
): React.ReactElement[] => {
  return blocks.map(block => renderBlock(block, context));
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
