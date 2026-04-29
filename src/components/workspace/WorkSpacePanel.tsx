/**
 * 学习空间管理面板 - 完整的后台管理布局
 * 包含左侧导航栏、顶部标题栏、统计卡片和学习空间网格
 */

import React, { useState } from 'react';
import { useSpaceStore } from '@/store/spaceStore';
import { CreateSpaceWizard, DeletedSpacesList, EditSpaceForm, SpaceActionsMenu,SpaceCard } from '@/components/workspace/space-manager'
import { SideDrawer } from '@/components/common/SideDrawer';
import type { StudySpace, Subject, StudyGoal, TimeSchedule } from '@/types/space';
import {LogoIcon,HomeIcon,SpaceIcon,PlanIcon,
  TaskIcon,RecordIcon,ChartIcon,
  GoalIcon,SettingsIcon,PlusIcon,GridIcon,ListIcon,
  ChevronDownIcon,BookIcon,PlayIcon,CheckIcon,ClockIcon,PauseIcon,SearchIcon,
} from '@/components/workspace/icons';
import './WorkSpacePanel.css';

export const WorkSpacePanel: React.FC = () => {
  const { getAllSpaces, softDeleteSpace, updateSpace, getDeletedSpaces, permanentlyDeleteSpace, restoreSpace, createSpace } = useSpaceStore();
  const spaces = getAllSpaces();
  const deletedSpaces = getDeletedSpaces();

  // 状态管理
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'upcoming' | 'completed' | 'paused'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'deadline' | 'progress'>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  // 新功能状态
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showDeletedDrawer, setShowDeletedDrawer] = useState(false);
  const [editingSpace, setEditingSpace] = useState<StudySpace | null>(null);

  // 统计数据
  const stats = {
    total: spaces.length,
    active: spaces.filter(s => s.status === 'active').length,
    completed: spaces.filter(s => s.status === 'completed').length,
    upcoming: spaces.filter(s => s.status === 'planning').length,
    paused: spaces.filter(s => s.status === 'paused').length
  };

  // 导航菜单项
  const menuItems = [
    { id: 'home', label: '首页', icon: HomeIcon },
    { id: 'spaces', label: '学习空间', icon: SpaceIcon },
    { id: 'plans', label: '学习计划', icon: PlanIcon },
    { id: 'tasks', label: '每日任务', icon: TaskIcon },
    { id: 'records', label: '学习记录', icon: RecordIcon },
    { id: 'analytics', label: '数据分析', icon: ChartIcon },
    { id: 'goals', label: '目标管理', icon: GoalIcon },
    { id: 'settings', label: '设置中心', icon: SettingsIcon }
  ];

  // 筛选空间
  const getFilteredSpaces = () => {
    let filtered = [...spaces];

    // 按标签筛选
    if (selectedTab !== 'all') {
      switch (selectedTab) {
        case 'active':
          filtered = filtered.filter(s => s.status === 'active');
          break;
        case 'upcoming':
          filtered = filtered.filter(s => s.status === 'planning');
          break;
        case 'completed':
          filtered = filtered.filter(s => s.status === 'completed');
          break;
        case 'paused':
          filtered = filtered.filter(s => s.status === 'paused');
          break;
      }
    }

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(space =>
        space.name.toLowerCase().includes(query) ||
        space.description.toLowerCase().includes(query) ||
        space.goal.primaryGoal.toLowerCase().includes(query)
      );
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.goal.examDate).getTime() - new Date(b.goal.examDate).getTime();
        case 'progress':
          return b.stats.overallProgress - a.stats.overallProgress;
        default: // recent
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return filtered;
  };

  const filteredSpaces = getFilteredSpaces();

  const handleCreateSpace = () => {
    setShowCreateDrawer(true);
  };

  const handleEditSpace = (space: StudySpace) => {
    setEditingSpace(space);
  };

  const handleDeleteSpace = (space: StudySpace) => {
    if (confirm(`确定要删除"${space.name}"吗？删除后可以在30天内恢复。`)) {
      softDeleteSpace(space.id);
    }
  };

  const handlePauseSpace = (space: StudySpace) => {
    const newStatus = space.status === 'active' ? 'paused' : 'active';
    updateSpace(space.id, { status: newStatus });
  };

  const handleStatsSpace = (space: StudySpace) => {
    // TODO: 实现统计功能
    alert(`查看"${space.name}"的学习统计 - 功能开发中`);
  };

  const handleShareSpace = (space: StudySpace) => {
    // TODO: 实现分享功能
    alert(`分享"${space.name}" - 功能开发中`);
  };

  const handleExportSpace = (space: StudySpace) => {
    // TODO: 实现导出功能
    alert(`导出"${space.name}"的学习报告 - 功能开发中`);
  };

  const handleRestoreSpace = (spaceId: string) => {
    restoreSpace(spaceId);
  };

  const handlePermanentDelete = (spaceId: string) => {
    permanentlyDeleteSpace(spaceId);
  };

  // 快速创建测试学习空间
  const handleQuickCreateTestSpace = () => {
    const testSubjects: Subject[] = [
      {
        name: '高等数学',
        currentLevel: 60,
        targetLevel: 85,
        weight: 0.8,
        weakPoints: ['微分方程', '线性代数基础'],
        strongPoints: ['极限计算', '函数求导']
      },
      {
        name: '大学英语',
        currentLevel: 70,
        targetLevel: 90,
        weight: 0.6,
        weakPoints: ['听力理解', '口语表达'],
        strongPoints: ['阅读理解', '语法基础']
      }
    ];

    const testGoal: StudyGoal = {
      primaryGoal: '期末考试获得85分以上，掌握核心概念和解题技巧',
      secondaryGoals: ['完成所有课后习题', '整理错题本', '参加学习小组'],
      examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
      targetScore: 85
    };

    const testSchedule: TimeSchedule = {
      availableHoursPerDay: 4,
      availableDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      preferredTimeSlots: ['晚上', '下午'],
      restDays: ['周日'],
      startDate: new Date()
    };

    createSpace({
      name: '高等数学期末冲刺',
      description: '为期末考试做好全面准备，重点复习微积分、线性代数和概率统计。',
      color: '#3b82f6',
      goal: testGoal,
      subjects: testSubjects,
      schedule: testSchedule
    });
  };
  // TODO 添加测试按钮功能
  return (
    <div className="workspace-panel">
      {/* 左侧导航栏 */}
      <aside className="sidebar">
        {/* Logo区 */}
        <div className="sidebar-logo">
          <LogoIcon />
          <span className="logo-text">AI 学习规划</span>
        </div>

        {/* 主导航菜单 */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`nav-item ${item.id === 'spaces' ? 'nav-item-active' : ''}`}
            >
              <item.icon />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        {/* 底部用户信息 */}
        <div className="sidebar-user">
          <div className="user-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Emma" alt="avatar" />
          </div>
          <div className="user-info">
            <div className="user-name">Emma</div>
            <div className="user-role">学生版</div>
          </div>
          <button className="user-dropdown">
            <ChevronDownIcon />
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="main-content">
        {/* 顶部标题栏 */}
        <div className="content-header">
          <div className="header-left">
            <h1 className="page-title">我的学习空间</h1>
            <p className="page-subtitle">管理你的所有学习目标和计划</p>
            {deletedSpaces.length > 0 && (
              <button
                className="btn-restore-spaces"
                onClick={() => setShowDeletedDrawer(true)}
              >
                 已删除空间 ({deletedSpaces.length})
              </button>
            )}
          </div>
          <div className="header-right">
            {/* 测试填充按钮 - 位于创建按钮的左侧 */}
            <button
              className="btn-test-space"
              onClick={handleQuickCreateTestSpace}
              style={{ marginRight: '12px' }}
              title="快速创建测试学习空间"
            >
              ⚡ 测试填充
            </button> 

            <button className="btn-create-space" onClick={handleCreateSpace}>
              <PlusIcon />
              创建学习空间
            </button>
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'view-btn-active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <GridIcon />
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'view-btn-active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <ListIcon />
              </button>
            </div>
          </div>
        </div>

        {/* 统计卡片栏 */}
        <div className="stats-cards">
          <div className="stat-card stat-card-all">
            <div className="stat-icon stat-icon-blue">
              <BookIcon />
            </div>
            <div className="stat-info">
              <div className="stat-label">全部空间</div>
              <div className="stat-number">{stats.total} 个</div>
            </div>
          </div>

          <div className="stat-card stat-card-active">
            <div className="stat-icon stat-icon-green">
              <PlayIcon />
            </div>
            <div className="stat-info">
              <div className="stat-label">进行中</div>
              <div className="stat-number">{stats.active} 个</div>
            </div>
          </div>

          <div className="stat-card stat-card-completed">
            <div className="stat-icon stat-icon-purple">
              <CheckIcon />
            </div>
            <div className="stat-info">
              <div className="stat-label">已完成</div>
              <div className="stat-number">{stats.completed} 个</div>
            </div>
          </div>

          <div className="stat-card stat-card-upcoming">
            <div className="stat-icon stat-icon-orange">
              <ClockIcon />
            </div>
            <div className="stat-info">
              <div className="stat-label">即将开始</div>
              <div className="stat-number">{stats.upcoming} 个</div>
            </div>
          </div>

          <div className="stat-card stat-card-paused">
            <div className="stat-icon stat-icon-gray">
              <PauseIcon />
            </div>
            <div className="stat-info">
              <div className="stat-label">已暂停</div>
              <div className="stat-number">{stats.paused} 个</div>
            </div>
          </div>
        </div>

        {/* 筛选与搜索栏 */}
        <div className="filter-bar">
          <div className="tab-filter">
            <button
              className={`tab-btn ${selectedTab === 'all' ? 'tab-btn-active' : ''}`}
              onClick={() => setSelectedTab('all')}
            >
              全部
            </button>
            <button
              className={`tab-btn ${selectedTab === 'active' ? 'tab-btn-active' : ''}`}
              onClick={() => setSelectedTab('active')}
            >
              进行中
            </button>
            <button
              className={`tab-btn ${selectedTab === 'upcoming' ? 'tab-btn-active' : ''}`}
              onClick={() => setSelectedTab('upcoming')}
            >
              即将开始
            </button>
            <button
              className={`tab-btn ${selectedTab === 'completed' ? 'tab-btn-active' : ''}`}
              onClick={() => setSelectedTab('completed')}
            >
              已完成
            </button>
            <button
              className={`tab-btn ${selectedTab === 'paused' ? 'tab-btn-active' : ''}`}
              onClick={() => setSelectedTab('paused')}
            >
              已暂停
            </button>
          </div>

          <div className="filter-controls">
            <select
              className="sort-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="recent">最近更新</option>
              <option value="deadline">考试时间</option>
              <option value="progress">进度排序</option>
            </select>

            <div className="search-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="搜索学习空间"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 学习空间卡片网格 */}
        <div className={`spaces-grid ${viewMode === 'list' ? 'spaces-list' : ''}`}>
          {filteredSpaces.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>没有找到学习空间</h3>
              <p>创建你的第一个学习目标吧！</p>
              <button className="btn-create-first" onClick={handleCreateSpace}>
                <PlusIcon />
                创建学习空间
              </button>
            </div>
          ) : (
            filteredSpaces.map((space) => (
              <div key={space.id} className="space-card-wrapper">
                <SpaceCard
                  space={space}
                />
                <SpaceActionsMenu
                  space={space}
                  onEdit={() => handleEditSpace(space)}
                  onDelete={() => handleDeleteSpace(space)}
                  onPause={() => handlePauseSpace(space)}
                  onStats={() => handleStatsSpace(space)}
                  onShare={() => handleShareSpace(space)}
                  onExport={() => handleExportSpace(space)}
                />
              </div>
            ))
          )}
        </div>

        {/* 底部引导区 */}
        <div className="bottom-guide">
          <div className="guide-content">
            <div className="guide-icon">💡</div>
            <div className="guide-text">
              <h4>学习小贴士</h4>
              <p>建议同时进行的学习空间不超过 3 个，以确保学习质量和效果。</p>
            </div>
          </div>
          <div className="guide-actions">
            <button className="btn-guide">了解更多</button>
          </div>
        </div>
      </main>

      {/* 创建学习空间抽屉 */}
      <SideDrawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        title="创建学习空间"
      >
        <CreateSpaceWizard
          onComplete={() => setShowCreateDrawer(false)}
          onCancel={() => setShowCreateDrawer(false)}
        />
      </SideDrawer>

      {/* 编辑学习空间抽屉 */}
      <SideDrawer
        isOpen={!!editingSpace}
        onClose={() => setEditingSpace(null)}
        title="编辑学习空间"
      >
        {editingSpace && (
          <EditSpaceForm
            space={editingSpace}
            onComplete={() => setEditingSpace(null)}
            onCancel={() => setEditingSpace(null)}
          />
        )}
      </SideDrawer>

      {/* 已删除空间抽屉 */}
      <SideDrawer
        isOpen={showDeletedDrawer}
        onClose={() => setShowDeletedDrawer(false)}
        title="已删除的学习空间"
      >
        <DeletedSpacesList
          spaces={deletedSpaces}
          onRestore={handleRestoreSpace}
          onPermanentDelete={handlePermanentDelete}
        />
      </SideDrawer>
    </div>
  );
};
