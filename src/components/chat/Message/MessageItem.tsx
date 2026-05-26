import { useState } from 'react';
import type { Message } from '../../../types/chat';
import { formatTimestamp } from '../../../utils/messageFormatter';
import { renderBlocks } from '../../../core/schema/componentRegistry.tsx';
import { WorkflowEvents } from './WorkflowEvents'; // 🆕 导入
import { AgentExecutionCard } from './AgentExecutionCard';
// markdown支持
import ReactMarkdown from 'react-markdown';
// 高亮支持
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Extracted code block component to satisfy rules-of-hooks
const CodeBlock: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1] || 'code';
  const codeContent = String(children).replace(/\n$/, '');

  if (!match) {
    return <code style={{ background: '#eee', padding: '2px 4px', borderRadius: 4 }}>{children}</code>;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ margin: '16px 0', padding: '', borderRadius: 8, overflow: 'hidden', backgroundColor: '#1e1e1e' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', backgroundColor: '#2d2d2d', color: '#d1d5db', fontSize: 12 }}>
        <div
          onClick={() => setExpanded(!expanded)}
          style={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
        >
          {language}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '4px solid #d1d5db',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
        <button
          onClick={handleCopy}
          style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer' }}
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <div
        style={{
          height: expanded ? 'auto' : 0,
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}
      >
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus as unknown as React.ComponentProps<typeof SyntaxHighlighter>['style']}
          PreTag="div"
        >
          {codeContent}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

interface MessageItemProps {
  message: Message;
  onCollectionFormSubmit?: (data: Record<string, unknown>) => Promise<void>;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onCollectionFormSubmit }) => {
  const isUser = message.role === 'user';
  const embeddedBlocks = message.ui_blocks || [];
  const hasSubmittedSummary = message.form_submission_state === 'submitted' && message.submitted_form_summary;
  const processSteps = message.workflow_process_steps || []; // TODO processSteps

  return (
    <div className={`message-item ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}>
        <div className="message-header">
          <span className="message-sender">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="message-timestamp">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        {/* 🆕 工作流事件 - 仅在 assistant 消息且存在事件时显示 */}
        {!isUser && message.workflow_events && message.workflow_events.length > 0 && (
          <WorkflowEvents
            events={message.workflow_events}
            isStreaming={false}
            hasAgentExecution={!!message.agent_execution}
          />
        )}

        {/* Agent Execution Card */}
        {!isUser && message.agent_execution && (
          <AgentExecutionCard execution={message.agent_execution} />
        )}

        <div className="message-content">
          <ReactMarkdown
            components={{
              code: CodeBlock,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {!isUser && hasSubmittedSummary && (
          <div className="message-submitted-form-summary">
            <div className="message-submitted-form-title">已提交信息</div>
            <div className="message-submitted-form-items">
              {message.submitted_form_summary?.map(item => (
                <div className="message-submitted-form-item" key={item.label}>
                  <span className="message-submitted-form-label">{item.label}</span>
                  <span className="message-submitted-form-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isUser && processSteps.length > 0 && (
          <div className="message-workflow-process">
            {processSteps.map(step => (
              <div className={`message-workflow-process-step ${step.status}`} key={step.id}>
                <span className="message-workflow-process-marker">
                  {step.status === 'completed' && '✓'}
                  {step.status === 'failed' && '!'}
                  {step.status === 'running' && <span className="message-workflow-process-spinner" />}
                </span>
                <span className="message-workflow-process-label">{step.label}</span>
              </div>
            ))}
          </div>
        )}

        {!isUser && !hasSubmittedSummary && embeddedBlocks.length > 0 && onCollectionFormSubmit && (
          <div className="message-embedded-blocks">
            {renderBlocks(embeddedBlocks, {
              onSubmit: onCollectionFormSubmit,
              isLoading: message.form_submission_state === 'submitting',
              stepIndex: 0,
              totalSteps: embeddedBlocks.length,
              showProgress: embeddedBlocks.length > 1
            })}
          </div>
        )}

        {message.tool_calls && message.tool_calls.length > 0 && (
          <div className="message-tool-calls">
            {message.tool_calls.map((toolCall) => (
              <ToolCallItem key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


interface ToolCallItemProps {
  toolCall: {
    id: string;
    tool_name: string;
    parameters: Record<string, unknown>;
    result?: unknown;
    status: 'pending' | 'completed' | 'failed';
    error?: string;
  };
}

const ToolCallItem: React.FC<ToolCallItemProps> = ({ toolCall }) => {
  return (
    <div className={`tool-call tool-call-${toolCall.status}`}>
      <div className="tool-call-header">
        <span className="tool-call-name">🔧 {toolCall.tool_name}</span>
        <span className="tool-call-status">{toolCall.status}</span>
      </div>
      <div className="tool-call-params">
        Params: {JSON.stringify(toolCall.parameters)}
      </div>
      {toolCall.status === 'failed' && toolCall.error && (
        <div className="tool-call-error">Error: {toolCall.error}</div>
      )}
    </div>
  );
};
