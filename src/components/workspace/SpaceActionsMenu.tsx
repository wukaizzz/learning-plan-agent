/**
 * 学习空间操作菜单组件
 * 提供编辑、删除、暂停、统计、分享、导出等完整操作
 */

import React, { useRef, useEffect, useState } from 'react';
import type { StudySpace } from '../../types/space';
import './SpaceActionsMenu.css';

export interface SpaceActionsMenuProps {
  space: StudySpace;
  onEdit: () => void;
  onDelete: () => void;
  onPause: () => void;
  onStats: () => void;
  onShare: () => void;
  onExport: () => void;
}

export const SpaceActionsMenu: React.FC<SpaceActionsMenuProps> = ({
  space,
  onEdit,
  onDelete,
  onPause,
  onStats,
  onShare,
  onExport
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // ESC键关闭菜单
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMenu) {
        setShowMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showMenu]);

  const handleAction = (action: () => void) => {
    action();
    setShowMenu(false);
  };

  return (
    <div className="space-actions-menu" ref={menuRef}>
      {/* 三点菜单按钮 */}
      <button
        className="space-actions-trigger"
        onClick={() => setShowMenu(!showMenu)}
        aria-label="更多操作"
        title="更多操作"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="5" r="1.5" fill="currentColor"/>
          <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
          <circle cx="10" cy="15" r="1.5" fill="currentColor"/>
        </svg>
      </button>

      {/* 菜单下拉框 */}
      {showMenu && (
        <div className="space-actions-dropdown">
          {/* 编辑空间 */}
          <button
            className="space-action-item"
            onClick={() => handleAction(onEdit)}
          >
            <span className="action-icon">✏️</span>
            <span className="action-text">编辑空间</span>
          </button>

          {/* 暂停/恢复学习 */}
          <button
            className="space-action-item"
            onClick={() => handleAction(onPause)}
          >
            <span className="action-icon">
              {space.status === 'active' ? '⏸️' : '▶️'}
            </span>
            <span className="action-text">
              {space.status === 'active' ? '暂停学习' : '恢复学习'}
            </span>
          </button>

          {/* 查看统计 */}
          <button
            className="space-action-item"
            onClick={() => handleAction(onStats)}
          >
            <span className="action-icon">📊</span>
            <span className="action-text">查看统计</span>
          </button>

          {/* 分享空间 */}
          <button
            className="space-action-item"
            onClick={() => handleAction(onShare)}
          >
            <span className="action-icon">🔗</span>
            <span className="action-text">分享空间</span>
          </button>

          {/* 导出报告 */}
          <button
            className="space-action-item"
            onClick={() => handleAction(onExport)}
          >
            <span className="action-icon">📥</span>
            <span className="action-text">导出报告</span>
          </button>

          {/* 分隔线 */}
          <div className="space-action-divider" />

          {/* 删除空间 */}
          <button
            className="space-action-item space-action-danger"
            onClick={() => handleAction(onDelete)}
          >
            <span className="action-icon">🗑️</span>
            <span className="action-text">删除空间</span>
          </button>
        </div>
      )}
    </div>
  );
};