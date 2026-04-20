import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../common/Button';
import './MessageInput.css';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...'
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    // Focus textarea on mount
    textareaRef.current?.focus();
    let lastKeyTime = 0;
    function handleKeyDown(e:any) {
      const input = textareaRef.current;
      if(document.activeElement === input) {
        return;
      }
      const now = Date.now();
      if(now - lastKeyTime < 300){
        input?.focus();
        input?.dispatchEvent(new KeyboardEvent('keydown', { key: e.key }));
      }
      lastKeyTime = now;
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, []);

  return (
    <div className="message-input-container">
      <div className="message-input-wrapper">
        <div className="message-input-textarea-container">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="message-input-textarea"
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="md"
          className="message-input-button"
        >
          Send
        </Button>
      </div>
      <div className="message-input-hint">
        Press Enter to send, Shift + Enter for new line
      </div>
    </div>
  );
};
