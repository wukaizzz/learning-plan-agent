import { useState } from 'react';
import type { Message } from '../../../types/chat';
import { formatTimestamp } from '../../../utils/messageFormatter';
// markdown支持
import ReactMarkdown from 'react-markdown';
// 高亮支持
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';

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
        <div className="message-content">
          <ReactMarkdown
            components={{
              code({ className, children }) {
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

                    {/* 代码顶部条：语言 + 复制按钮 */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', backgroundColor: '#2d2d2d', color: '#d1d5db', fontSize: 12 }}>
                      <div
                        onClick={() => setExpanded(!expanded)}
                        style={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {language}
                        {/* 下拉箭头 */}
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
                      {/* 代码块 */}
                      <SyntaxHighlighter
                        language={language}
                        style={vscDarkPlus as any}
                        PreTag="div"
                      >
                        {codeContent}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
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