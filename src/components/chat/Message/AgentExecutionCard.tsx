import type { AgentExecutionState } from '../../../types/chat';
import './AgentExecutionCard.css';

const statusIcons: Record<string, string> = {
  pending: '○',
  running: '',
  completed: '✓',
  waiting_input: '?',
  failed: '!'
};

export const AgentExecutionCard: React.FC<{ execution: AgentExecutionState }> = ({ execution }) => {
  const isFinished = execution.status !== 'running';
  const completedCount = execution.steps.filter(s => s.status === 'completed').length;

  return (
    <div className={`agent-execution-card ${execution.status}`}>
      <div className="agent-execution-header">
        <span className={`agent-execution-icon ${execution.status}`}>
          {!isFinished ? <span className="agent-execution-spinner" /> : <span className="agent-execution-checkmark">{'✓'}</span>}
        </span>
        <span className="agent-execution-title">{execution.title}</span>
        <span className="agent-execution-count">
          {completedCount}/{execution.steps.length}
        </span>
      </div>
      <div className="agent-execution-steps">
        {execution.steps.map((step) => (
          <div key={step.stepId} className={`agent-execution-step agent-step-${step.status}`}>
            <span className="agent-step-icon">
              {step.status === 'running' ? <span className="agent-step-spinner" /> : statusIcons[step.status]}
            </span>
            <div className="agent-step-content">
              <span className="agent-step-title">{step.title}</span>
              {step.summary && (
                <span className="agent-step-summary">{step.summary}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
