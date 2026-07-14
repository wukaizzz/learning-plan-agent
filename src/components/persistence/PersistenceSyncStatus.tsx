import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { usePlanStore } from '@/store/planStore';
import { useSpaceStore } from '@/store/spaceStore';
import { usePersistenceStatusStore } from '@/store/persistenceStatusStore';
import { flushAllPersistence } from '@/services/persistenceCoordinator';
import type { PersistenceSyncIssue } from '@/types/persistence';
import './PersistenceSyncStatus.css';

function issuePriority(issue: PersistenceSyncIssue) {
  if (issue.kind === 'permanent') return 4;
  if (issue.kind === 'dependency') return 3;
  if (issue.kind === 'transport') return 2;
  return 1;
}

export function PersistenceSyncStatus() {
  const spacePending = useSpaceStore(state => state.pendingMutations.length);
  const chatPending = useChatStore(state => state.pendingMutations.length);
  const planPending = usePlanStore(state => state.pendingMutations.length);
  const spaceIssues = useSpaceStore(state => state.syncErrorBySpace);
  const chatIssues = useChatStore(state => state.syncErrorBySession);
  const planIssues = usePlanStore(state => state.syncErrorBySpace);
  const clearSpaceIssue = useSpaceStore(state => state.clearSpaceSyncIssue);
  const clearChatIssue = useChatStore(state => state.clearChatSyncIssue);
  const clearPlanIssue = usePlanStore(state => state.clearPlanSyncIssue);
  const isOnline = usePersistenceStatusStore(state => state.isOnline);
  const isRetrying = usePersistenceStatusStore(state => state.isRetrying);
  const lastSyncedAt = usePersistenceStatusStore(state => state.lastSyncedAt);
  const [clock, setClock] = useState(0);
  const pendingCount = spacePending + chatPending + planPending;

  const issue = useMemo(() => (
    [
      ...Object.values(spaceIssues),
      ...Object.values(chatIssues),
      ...Object.values(planIssues),
    ]
      .filter((value): value is PersistenceSyncIssue => Boolean(value))
      .sort((left, right) => issuePriority(right) - issuePriority(left))[0] ?? null
  ), [chatIssues, planIssues, spaceIssues]);

  useEffect(() => {
    if (!lastSyncedAt) return;
    const timer = window.setTimeout(() => setClock(lastSyncedAt + 2500), 2500);
    return () => window.clearTimeout(timer);
  }, [lastSyncedAt]);

  useEffect(() => {
    if (issue?.kind !== 'conflict') return;
    const timer = window.setTimeout(() => {
      Object.entries(spaceIssues).forEach(([id, value]) => {
        if (value?.kind === 'conflict') clearSpaceIssue(id);
      });
      Object.entries(chatIssues).forEach(([id, value]) => {
        if (value?.kind === 'conflict') clearChatIssue(id);
      });
      Object.entries(planIssues).forEach(([id, value]) => {
        if (value?.kind === 'conflict') clearPlanIssue(id);
      });
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [
    chatIssues,
    clearChatIssue,
    clearPlanIssue,
    clearSpaceIssue,
    issue,
    planIssues,
    spaceIssues,
  ]);

  const showSynced = Boolean(
    lastSyncedAt &&
    clock < lastSyncedAt + 2500
  );

  if (!issue && pendingCount === 0 && !showSynced) return null;

  let tone = 'syncing';
  let text = `正在同步 ${pendingCount} 项`;
  let icon = <RefreshCw size={15} className="persistence-sync-spin" />;
  let canRetry = false;

  if (!isOnline && pendingCount > 0) {
    tone = 'offline';
    text = `已离线，${pendingCount} 项待同步`;
    icon = <CloudOff size={15} />;
  } else if (issue?.kind === 'permanent') {
    tone = 'error';
    text = '数据同步失败';
    icon = <AlertCircle size={15} />;
    canRetry = true;
  } else if (issue?.kind === 'dependency') {
    tone = 'waiting';
    text = '等待学习空间同步';
    icon = <RefreshCw size={15} />;
  } else if (issue?.kind === 'transport') {
    tone = 'warning';
    text = isRetrying ? '同步暂时失败，正在重试' : '同步暂时失败';
    icon = <AlertCircle size={15} />;
    canRetry = !isRetrying;
  } else if (issue?.kind === 'conflict') {
    tone = 'warning';
    text = '云端版本较新，已恢复云端数据';
    icon = <AlertCircle size={15} />;
  } else if (showSynced) {
    tone = 'success';
    text = '已同步';
    icon = <Check size={15} />;
  }

  return (
    <div
      className={`persistence-sync-status persistence-sync-status--${tone}`}
      role="status"
      title={issue?.message || text}
    >
      {icon}
      <span>{text}</span>
      {canRetry && (
        <button
          type="button"
          className="persistence-sync-retry"
          onClick={() => void flushAllPersistence()}
          aria-label="重试数据同步"
          title="重试数据同步"
        >
          <RefreshCw size={15} />
        </button>
      )}
    </div>
  );
}
