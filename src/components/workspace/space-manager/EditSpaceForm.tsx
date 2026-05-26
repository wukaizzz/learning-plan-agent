/**
 * 编辑学习空间表单组件
 * 简化版编辑表单，使用单页表单结构
 */

import React, { useState } from 'react';
import { useSpaceStore } from '../../../store/spaceStore';
import type { StudySpace } from '../../../types/space';
import './EditSpaceForm.css';

export interface EditSpaceFormProps {
  space: StudySpace;
  onComplete?: () => void;
  onCancel?: () => void;
}

export const EditSpaceForm: React.FC<EditSpaceFormProps> = ({
  space,
  onComplete,
  onCancel
}) => {
  const updateSpace = useSpaceStore((state) => state.updateSpace);

  // 表单数据
  const [formData, setFormData] = useState({
    name: space.name,
    description: space.description,
    color: space.color,
    primaryGoal: space.goal.primaryGoal,
    targetScore: space.goal.targetScore,
    status: space.status
  });

  // 格式化考试日期为日期字符串
  const [examDate, setExamDate] = useState(
    new Date(space.goal.examDate).toISOString().split('T')[0]
  );

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      alert('请填写所有必填项');
      return;
    }

    try {
      updateSpace(space.id, {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        status: formData.status,
        goal: {
          ...space.goal,
          primaryGoal: formData.primaryGoal,
          targetScore: formData.targetScore,
          examDate: new Date(examDate)
        }
      });

      onComplete?.();
    } catch (error) {
      console.error('更新学习空间失败:', error);
      alert('更新失败，请检查输入信息');
    }
  };

  return (
    <div className="edit-form-container">
      <form onSubmit={handleSubmit} className="edit-form">
        {/* 基础信息 */}
        <div className="edit-section">
          <h3>基础信息</h3>

          <div className="form-group">
            <label className="form-label">空间名称 *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：高等数学期末冲刺"
            />
          </div>

          <div className="form-group">
            <label className="form-label">描述 *</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="简要描述这个学习空间的目标和内容..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">主题颜色</label>
            <div className="color-picker">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${formData.color === color ? 'color-option-selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">状态</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as StudySpace['status'] })}
            >
              <option value="planning">📋 规划中</option>
              <option value="active">▶️ 进行中</option>
              <option value="paused">⏸️ 已暂停</option>
              <option value="completed">✅ 已完成</option>
            </select>
          </div>
        </div>

        {/* 学习目标 */}
        <div className="edit-section">
          <h3>学习目标</h3>

          <div className="form-group">
            <label className="form-label">主要目标 *</label>
            <input
              type="text"
              className="form-input"
              value={formData.primaryGoal}
              onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
              placeholder="例如：期末考试获得85分以上"
            />
          </div>

          <div className="form-group">
            <label className="form-label">考试日期 *</label>
            <input
              type="date"
              className="form-input"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label className="form-label">目标分数 *</label>
            <input
              type="number"
              className="form-input"
              min="0"
              max="100"
              value={formData.targetScore}
              onChange={(e) => setFormData({ ...formData, targetScore: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="edit-form-actions">
          <button
            type="button"
            className="edit-button edit-button-secondary"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            type="submit"
            className="edit-button edit-button-primary"
          >
            保存修改
          </button>
        </div>
      </form>
    </div>
  );
};