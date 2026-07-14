import React from 'react';
import { BookOpen, Check, Clock, Pause, Play } from 'lucide-react';
import { WORKSPACE_STATUS_CONFIG } from './workspaceDashboardUtils';
import './CompressedStats.css';

export interface WorkspaceStats {
  total: number;
  active: number;
  completed: number;
  upcoming: number;
  paused: number;
}

interface CompressedStatsProps {
  stats: WorkspaceStats;
}

const statsItems = [
  {
    key: 'total',
    label: '全部空间',
    icon: BookOpen,
    color: '#6366f1',
    bg: '#eef2ff'
  },
  {
    key: 'active',
    label: '进行中',
    icon: Play,
    color: WORKSPACE_STATUS_CONFIG.active.color,
    bg: WORKSPACE_STATUS_CONFIG.active.softBg
  },
  {
    key: 'completed',
    label: '已完成',
    icon: Check,
    color: WORKSPACE_STATUS_CONFIG.completed.color,
    bg: WORKSPACE_STATUS_CONFIG.completed.softBg
  },
  {
    key: 'upcoming',
    label: '即将开始',
    icon: Clock,
    color: WORKSPACE_STATUS_CONFIG.planning.color,
    bg: WORKSPACE_STATUS_CONFIG.planning.softBg
  },
  {
    key: 'paused',
    label: '已暂停',
    icon: Pause,
    color: WORKSPACE_STATUS_CONFIG.paused.color,
    bg: WORKSPACE_STATUS_CONFIG.paused.softBg
  }
] as const;

export const CompressedStats: React.FC<CompressedStatsProps> = ({ stats }) => (
  <div className="compressed-stats">
    {statsItems.map((item) => {
      const Icon = item.icon;
      const value = stats[item.key];

      return (
        <div className="compressed-stat-card" key={item.key}>
          <div
            className="compressed-stat-icon"
            style={{ background: item.bg, color: item.color }}
          >
            <Icon size={20} />
          </div>
          <div className="compressed-stat-copy">
            <span>{item.label}</span>
            <strong>{value} 个</strong>
            <small>较昨日 +0</small>
          </div>
        </div>
      );
    })}
  </div>
);
