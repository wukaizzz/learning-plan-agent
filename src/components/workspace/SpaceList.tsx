/**
 * 学习空间列表组件
 * 这是一个实际的React组件示例，展示如何使用spaceStore
 */

import React from 'react';
import { useSpaceStore } from '../../store/spaceStore';
import './SpaceList.css';

export const SpaceList: React.FC = () => {
  const {
    spaces,
    currentSpaceId,
    switchSpace,
    deleteSpace,
    getAllSpaces,
    createSpace
  } = useSpaceStore();

  const [showCreateForm, setShowCreateForm] = React.useState(false);

  // 获取按活跃度排序的空间列表
  const sortedSpaces = getAllSpaces();

  // 创建新空间的简单实现
  const handleCreateQuickSpace = () => {
    const newSpaceId = createSpace({
      name: `学习空间 ${spaces.length + 1}`,
      description: '点击编辑设置详细描述',
      goal: {
        primaryGoal: '设置你的学习目标',
        secondaryGoals: [],
        examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
        targetScore: 85
      },
      subjects: [{
        name: '主要学科',
        currentLevel: 60,
        targetLevel: 85,
        weight: 1.0,
        weakPoints: [],
        strongPoints: []
      }],
      schedule: {
        availableHoursPerDay: 2,
        availableDays: ['周一', '周二', '周三', '周四', '周五'],
        preferredTimeSlots: ['晚上'],
        restDays: ['周六', '周日'],
        startDate: new Date()
      }
    });

    // 自动切换到新创建的空间
    switchSpace(newSpaceId);
  };

  // 处理空间切换
  const handleSpaceClick = (spaceId: string) => {
    switchSpace(spaceId);
  };

  // 处理删除空间
  const handleDeleteSpace = (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation(); // 防止触发空间切换

    if (spaces.length === 1) {
      alert('至少保留一个学习空间');
      return;
    }

    if (confirm('确定要删除这个学习空间吗？相关的聊天记录和任务也会被删除。')) {
      deleteSpace(spaceId);
    }
  };

  // 计算距离考试的天数
  const getDaysUntilExam = (examDate: Date) => {
    const now = new Date();
    const examTime = new Date(examDate).getTime();
    const diff = examTime - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // 获取状态对应的样式类
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'planning': return 'status-planning';
      case 'paused': return 'status-paused';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  return (
    <div className="space-list">
      {/* 头部 */}
      <div className="space-list-header">
        <h3>学习空间</h3>
        <button
          className="btn-create-space"
          onClick={handleCreateQuickSpace}
          title="创建新的学习空间"
        >
          <span>+</span>
        </button>
      </div>

      {/* 空间列表 */}
      <div className="space-items">
        {sortedSpaces.length === 0 ? (
          <div className="empty-state">
            <p>还没有学习空间</p>
            <button onClick={handleCreateQuickSpace}>创建第一个空间</button>
          </div>
        ) : (
          sortedSpaces.map(space => (
            <div
              key={space.id}
              className={`space-item ${space.id === currentSpaceId ? 'space-item-active' : ''}`}
              onClick={() => handleSpaceClick(space.id)}
              style={{ borderLeftColor: space.color }}
            >
              {/* 空间头部 */}
              <div className="space-item-header">
                <h4 className="space-name">{space.name}</h4>
                <span className={`space-status ${getStatusClass(space.status)}`}>
                  {space.status === 'active' ? '学习中' :
                   space.status === 'planning' ? '规划中' :
                   space.status === 'paused' ? '已暂停' : '已完成'}
                </span>
              </div>

              {/* 空间描述 */}
              <p className="space-description">{space.description}</p>

              {/* 学习目标 */}
              <div className="space-goal">
                <span className="goal-label">目标:</span>
                <span className="goal-text">{space.goal.primaryGoal}</span>
              </div>

              {/* 考试倒计时 */}
              <div className="space-countdown">
                <span className="countdown-label">
                  距离考试还有 <strong>{getDaysUntilExam(space.goal.examDate)}</strong> 天
                </span>
              </div>

              {/* 进度信息 */}
              <div className="space-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${space.stats.overallProgress}%` }}
                  />
                </div>
                <span className="progress-text">{space.stats.overallProgress}%</span>
              </div>

              {/* 学习统计 */}
              <div className="space-stats">
                <div className="stat-item">
                  <span className="stat-label">学习时长</span>
                  <span className="stat-value">{space.stats.totalStudyHours}h</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">连续学习</span>
                  <span className="stat-value">{space.stats.consecutiveDays}天</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">完成进度</span>
                  <span className="stat-value">
                    {space.stats.tasksCompleted}/{space.stats.tasksTotal}
                  </span>
                </div>
              </div>

              {/* 删除按钮 */}
              <button
                className="btn-delete-space"
                onClick={(e) => handleDeleteSpace(e, space.id)}
                title="删除学习空间"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      {/* 底部信息 */}
      <div className="space-list-footer">
        <span className="space-count">{spaces.length} 个学习空间</span>
      </div>
    </div>
  );
};

export default SpaceList;