import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../../common/Button';
import { useChatStore } from '../../../store/chatStore';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 从Store获取草稿状态管理方法
  const {
    currentSessionId,
    getSessionDraft,
    setSessionDraft,
    clearSessionDraft
  } = useChatStore();

  // 本地状态同步Store中的草稿
  const [currentDraft, setCurrentDraft] = useState('');

  // 防抖保存草稿到Store的引用
  const saveDraftTimerRef = useRef<number | null>(null);
  const resizeTimerRef = useRef<number | null>(null);

  // 防抖保存草稿到Store
  const debouncedSaveDraft = useCallback((draft: string) => {
    if (saveDraftTimerRef.current) {
      clearTimeout(saveDraftTimerRef.current);
    }

    saveDraftTimerRef.current = setTimeout(() => {
      if (currentSessionId) {
        setSessionDraft(currentSessionId, draft);
      }
    }, 500);
  }, [currentSessionId, setSessionDraft]);

  // 防抖调整textarea高度
  const debouncedResize = useCallback(() => {
    if (resizeTimerRef.current) {
      clearTimeout(resizeTimerRef.current);
    }

    resizeTimerRef.current = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          200
        )}px`;
      }
    }, 100);
  }, []);

  // 监听Session切换，恢复对应草稿
  useEffect(() => {
    if (currentSessionId) {
      const draft = getSessionDraft(currentSessionId);
      setCurrentDraft(draft);

      // 更新textarea的值和高度
      if (textareaRef.current) {
        textareaRef.current.value = draft;
        if (draft) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(
            textareaRef.current.scrollHeight,
            200
          )}px`;
        }
      }
    }
  }, [currentSessionId]); // 只依赖currentSessionId

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (saveDraftTimerRef.current) {
        clearTimeout(saveDraftTimerRef.current);
      }
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
    };
  }, []);

  const handleSend = () => {
    if (currentDraft.trim() && !disabled && currentSessionId) {
      // 发送前立即保存最后一次草稿（确保不丢失）
      if (saveDraftTimerRef.current) {
        clearTimeout(saveDraftTimerRef.current);
        setSessionDraft(currentSessionId, currentDraft);
      }

      onSendMessage(currentDraft.trim());

      // 发送后清空当前Session的草稿
      clearSessionDraft(currentSessionId);
      setCurrentDraft(''); // 更新本地状态

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
    const newValue = e.target.value;

    // 立即更新本地状态，保证UI响应性
    setCurrentDraft(newValue);

    // 防抖保存到Store
    debouncedSaveDraft(newValue);

    // 防抖调整高度
    debouncedResize();
  };

  useEffect(() => {
    // Focus textarea on mount
    textareaRef.current?.focus();
    // let lastKeyTime = 0;
    // function handleKeyDown(e:any) {
    //   const input = textareaRef.current;
    //   if(document.activeElement === input) {
    //     return;
    //   }
    //   const now = Date.now();
    //   if(now - lastKeyTime < 300){
    //     input?.focus();
    //     input?.dispatchEvent(new KeyboardEvent('keydown', { key: e.key }));
    //   }
    //   lastKeyTime = now;
    // }
    // window.addEventListener('keydown', handleKeyDown);
    // return () => window.removeEventListener('keydown', handleKeyDown)
  }, []);

  return (
    <div className="message-input-container">
      <div className="message-input-wrapper">
        <div className="message-input-textarea-container">
          <textarea
            ref={textareaRef}
            value={currentDraft}
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
          disabled={!currentDraft.trim() || disabled}
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