/**
 * 侧边抽屉组件
 * 支持左右侧滑出，用于显示表单、详情等内容
 */

import React, { useEffect, useRef } from 'react';
import './SideDrawer.css';

export interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
  width?: string;
  showCloseButton?: boolean;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  width = '480px',
  showCloseButton = true,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // 处理ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 处理焦点管理
  useEffect(() => {
    if (isOpen) {
      // 保存当前焦点元素
      previousActiveElement.current = document.activeElement as HTMLElement;

      // 阻止body滚动
      document.body.style.overflow = 'hidden';

      // 聚焦到抽屉
      setTimeout(() => {
        drawerRef.current?.focus();
      }, 100);

      return () => {
        // 恢复body滚动
        document.body.style.overflow = '';

        // 恢复焦点
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen]);

  // 点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`side-drawer-overlay side-drawer-${position}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
    >
      <div
        ref={drawerRef}
        className={`side-drawer side-drawer-${position}`}
        style={{ width }}
        tabIndex={-1}
      >
        {/* 抽屉头部 */}
        {(title || showCloseButton) && (
          <div className="side-drawer-header">
            {title && (
              <h2 id="drawer-title" className="side-drawer-title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                className="side-drawer-close"
                onClick={onClose}
                aria-label="关闭"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {/* 抽屉内容 */}
        <div className="side-drawer-content">
          {children}
        </div>
      </div>
    </div>
  );
};