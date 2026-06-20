export type PersistenceSyncIssueKind =
  | 'transport'
  | 'dependency'
  | 'conflict'
  | 'permanent';

export interface PersistenceSyncIssue {
  message: string;
  code: string;
  status?: number;
  retryable: boolean;
  kind: PersistenceSyncIssueKind;
  occurredAt: number;
}
