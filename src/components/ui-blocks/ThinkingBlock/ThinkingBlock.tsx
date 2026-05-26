import React, { useState, useEffect, useRef } from 'react';
import './ThinkingBlock.css';

interface ThinkingBlockProps {
  _thinkingContent: string;
  _thinkingActive: boolean;
  _thinkingDuration?: number;
  title?: string;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  _thinkingContent,
  _thinkingActive,
  _thinkingDuration,
  title = '思考过程',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const prevActiveRef = useRef(_thinkingActive);

  useEffect(() => {
    if (_thinkingActive && !prevActiveRef.current) {
      setIsExpanded(true); // eslint-disable-line react-hooks/set-state-in-effect
    }
    if (!_thinkingActive && prevActiveRef.current && _thinkingDuration !== undefined) {
      setIsExpanded(false);
    }
    prevActiveRef.current = _thinkingActive;
  }, [_thinkingActive, _thinkingDuration]);

  useEffect(() => {
    if (_thinkingActive && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [_thinkingContent, _thinkingActive]);

  if (!_thinkingContent) return null;

  const durationText = _thinkingDuration !== undefined && _thinkingDuration > 0
    ? `${_thinkingDuration.toFixed(1)}秒`
    : _thinkingActive
      ? '思考中...'
      : '';

  return (
    <div className={`thinking-block ${_thinkingActive ? 'thinking-block-active' : 'thinking-block-done'}`}>
      <button
        className="thinking-block-header"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <span className="thinking-block-icon">
          {_thinkingActive ? (
            <span className="thinking-spinner" />
          ) : (
            <span className="thinking-check">✓</span>
          )}
        </span>
        <span className="thinking-block-title">{title}</span>
        {durationText && (
          <span className="thinking-block-duration">{durationText}</span>
        )}
        <span className={`thinking-block-toggle ${isExpanded ? 'expanded' : ''}`}>▾</span>
      </button>

      {isExpanded && (
        <div className="thinking-block-content" ref={contentRef}>
          <pre className="thinking-block-text">{_thinkingContent}</pre>
          {_thinkingActive && <span className="thinking-cursor">▍</span>}
        </div>
      )}
    </div>
  );
};
