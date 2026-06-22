import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CalendarClock, Check, X } from 'lucide-react';
import * as planPersistenceApi from '@/services/planPersistenceApi';
import { useChatStore } from '@/store/chatStore';
import { usePlanStore } from '@/store/planStore';
import './PlanChangePreview.css';

interface ChangeItem {
  taskId: string;
  title: string;
  fromDate: string;
  toDate: string;
  estimatedMinutes: number;
}

interface UnscheduledItem {
  taskId: string;
  title: string;
  reason: string;
}

interface PlanChangePreviewProps {
  title?: string;
  changeSetId: string;
  sourcePlanId: string;
  sourcePlanVersion: number;
  expiresAt: number;
  reason: string;
  canApply: boolean;
  changes: ChangeItem[];
  impact: {
    selectedTaskCount: number;
    movedTaskCount: number;
    affectedDates: string[];
    affectedMinutes: number;
  };
  unscheduled: UnscheduledItem[];
}

function createIdempotencyKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `apply-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function PlanChangePreview({
  title = '计划调整预览',
  changeSetId,
  sourcePlanId,
  sourcePlanVersion,
  expiresAt,
  reason,
  canApply,
  changes = [],
  impact,
  unscheduled = []
}: PlanChangePreviewProps) {
  const [expired, setExpired] = useState(false);
  const [status, setStatus] = useState<'idle' | 'applying' | 'rejecting' | 'applied' | 'rejected'>('idle');
  const [error, setError] = useState('');
  const idempotencyKeyRef = useRef(createIdempotencyKey());
  const spaceId = useChatStore(state => state.currentSpaceId);
  useEffect(() => {
    const timer = window.setTimeout(
      () => setExpired(true),
      Math.max(0, expiresAt - Date.now())
    );
    return () => window.clearTimeout(timer);
  }, [expiresAt]);

  const expiryText = useMemo(
    () => new Date(expiresAt).toLocaleString('zh-CN'),
    [expiresAt]
  );

  if (status === 'applied' || status === 'rejected') return null;

  const handleApply = async () => {
    if (!spaceId || !canApply || expired || status !== 'idle') return;
    setStatus('applying');
    setError('');
    try {
      await planPersistenceApi.applyPlanChangeSet(changeSetId, {
        expectedPlanId: sourcePlanId,
        expectedPlanVersion: sourcePlanVersion,
        idempotencyKey: idempotencyKeyRef.current
      });
      await usePlanStore.getState().hydratePlanBySpace(spaceId);
      setStatus('applied');
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : '应用计划调整失败');
      setStatus('idle');
    }
  };

  const handleReject = async () => {
    if (status !== 'idle') return;
    setStatus('rejecting');
    setError('');
    try {
      await planPersistenceApi.rejectPlanChangeSet(changeSetId);
      setStatus('rejected');
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : '取消计划调整失败');
      setStatus('idle');
    }
  };

  return (
    <section className="plan-change-preview">
      <header className="plan-change-preview-header">
        <CalendarClock size={20} />
        <div>
          <h3>{title}</h3>
          <p>{reason}</p>
        </div>
      </header>

      <div className="plan-change-preview-stats">
        <span>移动 {impact.movedTaskCount}/{impact.selectedTaskCount} 个任务</span>
        <span>影响 {impact.affectedMinutes} 分钟</span>
        <span>有效至 {expiryText}</span>
      </div>

      <div className="plan-change-preview-list">
        {changes.map(change => (
          <div className="plan-change-preview-row" key={change.taskId}>
            <strong>{change.title}</strong>
            <span>{change.fromDate} → {change.toDate}</span>
          </div>
        ))}
      </div>

      {unscheduled.length > 0 && (
        <div className="plan-change-preview-warning">
          <AlertTriangle size={18} />
          <div>
            <strong>仍有 {unscheduled.length} 个任务无法安排</strong>
            {unscheduled.map(item => <p key={item.taskId}>{item.title}：{item.reason}</p>)}
          </div>
        </div>
      )}

      {error && <p className="plan-change-preview-error">{error}</p>}

      <footer className="plan-change-preview-actions">
        <button type="button" className="preview-reject" onClick={handleReject} disabled={status !== 'idle'}>
          <X size={17} />
          保持原计划
        </button>
        <button
          type="button"
          className="preview-apply"
          onClick={handleApply}
          disabled={!canApply || expired || status !== 'idle'}
          title={!canApply ? '存在未解决冲突，不能应用' : expired ? '该调整方案已过期' : '应用调整'}
        >
          <Check size={17} />
          {status === 'applying' ? '正在应用' : expired ? '方案已过期' : '确认应用'}
        </button>
      </footer>
    </section>
  );
}

export default PlanChangePreview;
