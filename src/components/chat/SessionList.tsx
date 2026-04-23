import React, { useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { Plus, MessageSquare, Trash2, Clock } from 'lucide-react';
import './SessionList.css';

export const SessionList: React.FC = () => {
  const {
    sessions,
    currentSessionId,
    switchSession,
    deleteSession,
    createNewSession,
    getAllSessions
  } = useChatStore();

  const [sessionList, setSessionList] = React.useState(getAllSessions());

  // Update session list when sessions change
  useEffect(() => {
    setSessionList(getAllSessions());
  }, [sessions, getAllSessions]);

  const handleCreateNew = () => {
    createNewSession();
  };

  const handleSwitchSession = (sessionId: string) => {
    switchSession(sessionId);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个对话吗？')) {
      deleteSession(sessionId);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="session-list">
      {/* Header */}
      <div className="session-list-header">
        <div className="session-list-title">
          <MessageSquare size={18} />
          <span>历史对话</span>
        </div>
        <button
          className="session-list-new"
          onClick={handleCreateNew}
          title="新建对话"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Session List */}
      <div className="session-list-items">
        {sessionList.length === 0 ? (
          <div className="session-list-empty">
            <MessageSquare size={48} />
            <p>暂无历史对话</p>
            <button onClick={handleCreateNew}>开始新对话</button>
          </div>
        ) : (
          sessionList.map((session) => (
            <div
              key={session.id}
              className={`session-item ${currentSessionId === session.id ? 'session-item-active' : ''}`}
              onClick={() => handleSwitchSession(session.id)}
            >
              <div className="session-item-content">
                <div className="session-item-title">
                  {session.title || '新对话'}
                </div>
                <div className="session-item-meta">
                  <Clock size={12} />
                  <span>{formatTime(session.updatedAt)}</span>
                </div>
              </div>
              <button
                className="session-item-delete"
                onClick={(e) => handleDeleteSession(e, session.id)}
                title="删除对话"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};