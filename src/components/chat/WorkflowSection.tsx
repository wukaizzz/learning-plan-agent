/**
 * WorkflowSection Component
 * 在ChatPanel中显示工作流相关的UI Blocks
 *
 * 功能：
 * - 根据 workspaceState 决定是否显示
 * - 渲染当前状态的 UI Blocks
 * - 支持折叠/展开
 * - 提供工作流状态控制
 * - 🆕 支持多表单顺序收集
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { useLangGraphWorkflow } from '@/hooks/useLangGraphWorkflow';
import { useChatStore } from '@/store/chatStore';
import { renderBlocks, type RenderContext } from '../../core/schema/componentRegistry.tsx';
import type { UIBlock, WorkspaceState } from '../../types/uiBlocks';

interface WorkflowSectionProps {
  workspaceState: WorkspaceState;
  uiBlocks: UIBlock[];
  onStateChange?: (newState: WorkspaceState) => void;
}

export const WorkflowSection: React.FC<WorkflowSectionProps> = ({
  workspaceState,
  uiBlocks
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // 🆕 使用精确 selector，只订阅需要的字段
  const activeFormStep = useChatStore(state => state.activeFormStep);
  const formStepsData = useChatStore(state => state.formStepsData);
  const submitFormStep = useChatStore(state => state.submitFormStep);
  const setActiveFormStep = useChatStore(state => state.setActiveFormStep);
  const markWorkflowInterrupted = useChatStore(state => state.markWorkflowInterrupted);

  // 🆕 使用 ref 存储最新状态和函数引用
  const latestStateRef = useRef({
    workspaceState,
     activeFormStep,
     totalFormSteps: 0,
   });
  
  const markWorkflowInterruptedRef = useRef(markWorkflowInterrupted);
  const hasMarkedInterruptedRef = useRef(false);

  // 获取路由参数和工作流 hooks
  const { spaceId } = useParams();
  const { resume, isLoading, error } = useLangGraphWorkflow();

  // 🆕 获取 collection-form blocks
  const collectionForms = uiBlocks.filter(block => block.type === 'collection-form');
  const totalFormSteps = collectionForms.length;

  // 始终同步最新值到 ref
  useEffect(() => {
    latestStateRef.current = {
      workspaceState,
      activeFormStep,
      totalFormSteps,
    };
    markWorkflowInterruptedRef.current = markWorkflowInterrupted;
  }, [workspaceState, activeFormStep, totalFormSteps, markWorkflowInterrupted]);

  /**
   * 处理表单提交
   * 🆕 支持多表单顺序提交
   */
  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    console.log('📝 表单提交数据:', formData);

    // 🆕 保存当前步骤的表单数据
    submitFormStep(activeFormStep, formData);

    // 🆕 检查是否还有下一个表单
    if (activeFormStep < totalFormSteps - 1) {
      // 切换到下一个表单
      setActiveFormStep(activeFormStep + 1);
      console.log(`✅ 表单步骤 ${activeFormStep} 完成，切换到步骤 ${activeFormStep + 1}`);
      return;
    }

    // 🆕 所有表单都已完成，提交到后端
    if (!spaceId) {
      console.error('❌ 缺少 spaceId');
      alert('无法提交：缺少学习空间标识');
      return;
    }

    try {
      // 🆕 合并所有表单数据
      const allFormData = Object.values(formStepsData).reduce((acc, data) => {
        return { ...acc, ...(data as Record<string, unknown>) };
      }, formData as Record<string, unknown>);

      console.log('📝 提交所有表单数据:', allFormData);

      const response = await resume(spaceId, allFormData as Record<string, string | number>);

      if (response.success) {
        console.log('✅ 所有表单提交成功，工作流已恢复');
        // 🆕 后续的工作流事件将自动附加到当前消息，由 useStream 处理
      } else if (response.error) {
        console.error('❌ 表单提交失败:', response.error);
        alert(`提交失败: ${response.error}`);
      }
    } catch (err) {
      console.error('❌ 表单提交异常:', err);
      alert('提交失败，请稍后重试');
    }
  };

  /**
   * 创建渲染上下文
   * 🆕 传递表单步骤信息到 collection-form
   */
  const renderContext: RenderContext = {
    threadId: spaceId,
    onSubmit: handleFormSubmit,
    isLoading,
    error,
    stepIndex: activeFormStep,
    totalSteps: totalFormSteps,
    showProgress: totalFormSteps > 1
  };

  // 🆕 组件卸载时标记工作流中断（只在真正卸载时执行）
  useEffect(() => {
    hasMarkedInterruptedRef.current = false;
    
    return () => {
      if (hasMarkedInterruptedRef.current) {
        return;
      }
      
      const { workspaceState, activeFormStep, totalFormSteps } = latestStateRef.current;
      
      if (workspaceState === 'collecting' && activeFormStep < totalFormSteps) {
        hasMarkedInterruptedRef.current = true;
        markWorkflowInterruptedRef.current(activeFormStep);  // ✅ 使用 ref 中的函数引用
      }
    };
  }, []); // ✅ 空依赖数组，只在卸载时执行

  // workspaceState 为 'empty' 时不显示
  if (workspaceState === 'empty' || uiBlocks.length === 0) {
    return null;
  }

  // 🆕 过滤 UI Blocks：只显示当前步骤的表单和其他非表单 blocks
  const currentFormBlock = collectionForms[activeFormStep];
  const nonFormBlocks = uiBlocks.filter(block => block.type !== 'collection-form');
  const currentUIBlocks = currentFormBlock
    ? [...nonFormBlocks, currentFormBlock]
    : nonFormBlocks;

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
            {renderBlocks(currentUIBlocks, renderContext)}
          </div>

          {/* 工作流信息 */}
          {currentUIBlocks.length > 0 && (
            <div className="workflow-section-info">
              <span className="workflow-blocks-count">
                {currentUIBlocks.length} 个 UI 组件
              </span>
              <span className="workflow-state-description">
                {getStateDescription(workspaceState, totalFormSteps, activeFormStep)}
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
 * 🆕 添加表单步骤信息
 */
function getStateDescription(
  state: WorkspaceState,
  totalFormSteps: number = 0,
  currentStep: number = 0
): string {
  const baseDescriptions: Record<WorkspaceState, string> = {
    'empty': '等待开始',
    'collecting': totalFormSteps > 1
      ? `正在收集学习信息 (${currentStep + 1}/${totalFormSteps})`
      : '正在收集学习信息...',
    'analyzing': '正在分析数据...',
    'generating': '正在生成学习计划...',
    'reviewing': '请查看并确认生成的计划',
    'finalized': '计划执行中',
    'paused': '计划已暂停'
  };

  return baseDescriptions[state] || '处理中...';
}
