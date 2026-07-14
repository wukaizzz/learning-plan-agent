import { ArrowLeft, CalendarRange, CheckSquare, ClipboardList, LayoutDashboard, Lock, MessageSquare, Settings } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import type { StudySpace } from '@/types/space';
import type { WorkspaceState } from '@/types/uiBlocks';
import { isPlanGenerationState } from './spacePlanStatus';
import './SpaceNavSidebar.css';

interface SpaceNavSidebarProps {
  space: StudySpace;
  hasPlan: boolean;
  workspaceState: WorkspaceState;
}

const STATUS_LABELS: Record<StudySpace['status'], string> = {
  planning: '准备中',
  active: '执行中',
  paused: '已暂停',
  completed: '已完成'
};

const navItems = [
  { label: '总览', path: 'overview', icon: LayoutDashboard, requiresPlan: false },
  { label: 'Agent 对话', path: 'chat', icon: MessageSquare, requiresPlan: false },
  { label: '今日任务', path: 'tasks', icon: CheckSquare, requiresPlan: true },
  { label: '学习计划', path: 'plan', icon: ClipboardList, requiresPlan: true },
  { label: '学习时间线', path: 'timeline', icon: CalendarRange, requiresPlan: true },
  { label: '空间信息', path: 'settings', icon: Settings, requiresPlan: false }
];

export const SpaceNavSidebar: React.FC<SpaceNavSidebarProps> = ({ space, hasPlan, workspaceState }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = `/workSpace/${space.id}`;
  const isGenerating = !hasPlan && isPlanGenerationState(workspaceState);
  const planStatusLabel = hasPlan ? '计划已生成' : isGenerating ? '计划生成中' : '待生成计划';
  const planStatusDescription = hasPlan
    ? '任务、计划和时间线页面已开放'
    : isGenerating
      ? 'Agent 正在生成计划，结果会自动出现'
      : '先在总览页生成计划以开放更多页面';

  const handleBlockedClick = () => {
    window.alert('请先生成学习计划后查看该页面');
  };

  return (
    <aside className="space-nav-sidebar">
      <div className="space-nav-header">
        <div className="space-nav-title">{space.name}</div>
        <div className="space-nav-meta">
          <span className={`space-nav-status space-nav-status-${space.status}`}>
            {STATUS_LABELS[space.status]}
          </span>
          {space.currentPhase && <span className="space-nav-phase">{space.currentPhase}</span>}
        </div>
      </div>

      <div className={`space-nav-plan-state ${hasPlan ? 'ready' : isGenerating ? 'running' : 'pending'}`}>
        <span>{planStatusLabel}</span>
        <p>{planStatusDescription}</p>
      </div>

      <nav className="space-nav-items" aria-label="学习空间导航">
        {navItems.map(item => {
          const Icon = item.icon;
          const enabled = !item.requiresPlan || hasPlan;
          const to = `${basePath}/${item.path}`;
          const active = location.pathname === to;

          if (!enabled) {
            return (
              <button
                key={item.path}
                className={`space-nav-item space-nav-item-disabled ${active ? 'space-nav-item-active' : ''}`}
                type="button"
                onClick={handleBlockedClick}
                title="请先生成学习计划后查看该页面"
              >
                <Icon size={18} />
                <span>{item.label}</span>
                <Lock size={14} className="space-nav-lock" />
              </button>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={to}
              className={({ isActive }) => `space-nav-item ${isActive ? 'space-nav-item-active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="space-nav-footer">
        <button className="space-nav-back" type="button" onClick={() => navigate('/workSpace')}>
          <ArrowLeft size={18} />
          <span>返回学习空间列表</span>
        </button>
      </div>
    </aside>
  );
};
