/**
 * 已删除学习空间列表组件
 * 显示和管理已删除的学习空间，支持恢复和永久删除
 */

import React from 'react';
import type { StudySpace } from '../../../types/space';
import './DeletedSpacesList.css';

export interface DeletedSpacesListProps {
  spaces: StudySpace[];
  onRestore: (spaceId: string) => void;
  onPermanentDelete: (spaceId: string) => void;
}

export const DeletedSpacesList: React.FC<DeletedSpacesListProps> = ({
  spaces,
  onRestore,
  onPermanentDelete
}) => {
  // 计算距离永久删除的剩余天数
  const getDaysUntilPermanentDelete = (space: StudySpace): number => {
    if (!space.deletionScheduledAt) return 0;
    const now = new Date().getTime();
    const scheduledTime = new Date(space.deletionScheduledAt).getTime();
    const diff = scheduledTime - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="deleted-spaces-list">
      {/* 头部说明 */}
      <div className="deleted-list-header">
        <div className="deleted-header-info">
          <h3>🗑️ 已删除的学习空间</h3>
          <p className="deleted-header-description">
            这些空间将在30天后被永久删除。您可以在此之前恢复它们。
          </p>
        </div>
        <div className="deleted-count">
          共 {spaces.length} 个已删除空间
        </div>
      </div>

      {/* 空状态 */}
      {spaces.length === 0 ? (
        <div className="deleted-empty">
          <div className="deleted-empty-icon">📭</div>
          <h4>没有已删除的学习空间</h4>
          <p>已删除的学习空间会显示在这里</p>
        </div>
      ) : (
        /* 已删除空间列表 */
        <div className="deleted-spaces-items">
          {spaces.map((space) => {
            const daysRemaining = getDaysUntilPermanentDelete(space);

            return (
              <div key={space.id} className="deleted-space-item">
                {/* 空间信息 */}
                <div className="deleted-space-info">
                  <div
                    className="deleted-space-color"
                    style={{ backgroundColor: space.color }}
                  />
                  <div className="deleted-space-details">
                    <h4 className="deleted-space-name">{space.name}</h4>
                    <p className="deleted-space-description">
                      {space.description}
                    </p>
                    <div className="deleted-space-meta">
                      <span className="deleted-space-date">
                        删除于 {new Date(space.deletedAt!).toLocaleDateString('zh-CN')}
                      </span>
                      <span className="deleted-space-remaining">
                        ⏰ {daysRemaining}天后永久删除
                      </span>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="deleted-space-actions">
                  <button
                    className="deleted-action-btn deleted-action-restore"
                    onClick={() => onRestore(space.id)}
                    title="恢复此空间"
                  >
                    <span className="action-icon">🔄</span>
                    <span className="action-text">恢复</span>
                  </button>
                  <button
                    className="deleted-action-btn deleted-action-delete"
                    onClick={() => {
                      if (confirm(`确定要永久删除"${space.name}"吗？此操作不可撤销。`)) {
                        onPermanentDelete(space.id);
                      }
                    }}
                    title="永久删除"
                  >
                    <span className="action-icon">🗑️</span>
                    <span className="action-text">永久删除</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 底部提示 */}
      {spaces.length > 0 && (
        <div className="deleted-list-footer">
          <p>💡 <strong>提示：</strong> 永久删除后的学习空间无法恢复，请谨慎操作。</p>
        </div>
      )}
    </div>
  );
};