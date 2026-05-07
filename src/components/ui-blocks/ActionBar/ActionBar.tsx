/**
 * ActionBar UI Block
 * 显示操作按钮栏
 */

import React from 'react';
import type { ActionBarProps } from '@/types/uiBlocks';
import './ActionBar.css';

interface ActionBarComponentProps extends ActionBarProps {
  title?: string;
}

export const ActionBar: React.FC<ActionBarComponentProps> = ({
  title,
  actions
}) => {
  // 获取按钮样式类
  const getButtonClass = (type: string): string => {
    const typeMap: Record<string, string> = {
      primary: 'action-button-primary',
      secondary: 'action-button-secondary',
      danger: 'action-button-danger'
    };
    return typeMap[type] || 'action-button-secondary';
  };

  return (
    <div className="action-bar">
      {title && <div className="action-bar-title">{title}</div>}
      <div className="action-bar-buttons">
        {actions.map((action) => (
          <button
            key={action.id}
            className={`action-button ${getButtonClass(action.type)}`}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.label}
          >
            {action.icon && <span className="action-button-icon">{action.icon}</span>}
            <span className="action-button-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActionBar;
