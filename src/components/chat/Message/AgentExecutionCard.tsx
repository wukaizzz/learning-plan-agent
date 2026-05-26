import type { AgentExecutionState, AgentExecutionStep } from '../../../types/chat';
import './AgentExecutionCard.css';

const stepStatusIcons: Record<string, string> = {
  pending: '○',
  completed: '✓',
  waiting_input: '?',
  failed: '!'
};

export const AgentExecutionCard: React.FC<{ execution: AgentExecutionState }> = ({ execution }) => {
  const isFinished = execution.status !== 'running';
  const completedCount = execution.steps.filter(s => s.status === 'completed').length;
  const runningStep = execution.steps.find(s => s.status === 'running');

  const lastCompletedIndex = execution.steps.reduce(
    (last, s, i) => (s.status === 'completed' ? i : last), -1
  );
  const lastCompletedStep = lastCompletedIndex >= 0 ? execution.steps[lastCompletedIndex] : null;
  const displaySummary = isFinished
    ? (execution.summary || lastCompletedStep?.summary || undefined)
    : undefined;

  return (
    <div className={`agent-execution-card ${execution.status}`}>
      <div className="agent-execution-header">
        <span className={`agent-execution-icon ${execution.status}`}>
          {!isFinished
            ? <span className="agent-execution-spinner" />
            : <span className="agent-execution-checkmark">{execution.status === 'completed' ? '✓' : '!'}</span>
          }
        </span>
        <span className="agent-execution-title">{execution.title}</span>
        <span className="agent-execution-count">
          {completedCount}/{execution.steps.length}
        </span>
      </div>

      {!isFinished && runningStep && (
        <div className="agent-execution-current-activity">
          <div className="agent-current-activity-row">
            <span className="agent-current-pulse" />
            <span className="agent-current-title">{runningStep.title}</span>
          </div>
          {runningStep.summary && (
            <div className="agent-current-summary">{runningStep.summary}</div>
          )}
        </div>
      )}

      {isFinished && displaySummary && (
        <div className="agent-execution-latest-update">
          <span className="agent-latest-update-label">{'完成摘要'}</span>
          <span className="agent-latest-update-text">{displaySummary}</span>
        </div>
      )}

      <div className="agent-execution-steps">
        {execution.steps.map((step) => (
          <AgentStepRow key={step.stepId} step={step} isActive={step === runningStep} />
        ))}
      </div>
    </div>
  );
};

const AgentStepRow: React.FC<{ step: AgentExecutionStep; isActive: boolean }> = ({ step, isActive }) => {
  return (
    <div className={`agent-execution-step agent-step-${step.status} ${isActive ? 'agent-step-active' : ''}`}>
      <span className="agent-step-icon">
        {step.status === 'running'
          ? <span className="agent-step-spinner" />
          : stepStatusIcons[step.status]
        }
      </span>
      <div className="agent-step-content">
        <span className="agent-step-title">{step.title}</span>
        {step.summary && step.status === 'completed' && (
          <span className="agent-step-summary">{step.summary}</span>
        )}
      </div>
    </div>
  );
};
