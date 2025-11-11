import { useState } from 'react';
import { MessageStatus } from './MessageStatus';
import { MessageReactions } from './MessageReactions';
import { useReactions } from '../hooks/useReactions';
import { Avatar } from './Avatar';
import { ImageMessage } from './ImageMessage';

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  onDelete: () => void;
  onReply?: () => void;
  onEdit?: () => void;
}

export const MessageBubble = ({ message, isOwn, onDelete, onReply, onEdit }: MessageBubbleProps) => {
  const [showActions, setShowActions] = useState(false);
  const { reactions, toggleReaction } = useReactions(message.id);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-2 px-4`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="relative">
        {/* Quick Actions */}
        {showActions && (
          <div className={`absolute -top-8 ${isOwn ? 'right-0' : 'left-0'} flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-10 animate-fadeIn`}>
            <button
              onClick={() => toggleReaction('👍')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-lg"
              title="👍"
            >
              👍
            </button>
            <button
              onClick={() => toggleReaction('❤️')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-lg"
              title="❤️"
            >
              ❤️
            </button>
            <button
              onClick={() => toggleReaction('😂')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-lg"
              title="😂"
            >
              😂
            </button>
            {onReply && (
              <button
                onClick={onReply}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Ответить"
              >
                ↩️
              </button>
            )}
            {isOwn && onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Редактировать"
              >
                ✏️
              </button>
            )}
            {isOwn && (
              <button
                onClick={onDelete}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                title="Удалить"
              >
                🗑️
              </button>
            )}
          </div>
        )}

        {/* Message Content */}
        {message.type === 'IMAGE' && message.fileUrl ? (
          <div>
            {!isOwn && (
              <p className="text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                {message.sender?.firstName || message.firstName} {message.sender?.lastName || message.lastName}
              </p>
            )}
            <ImageMessage
              src={`http://localhost:3001${message.fileUrl}`}
              alt="Изображение"
              isOwn={isOwn}
              onClick={() => window.open(`http://localhost:3001${message.fileUrl}`, '_blank')}
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(message.createdAt)}
              </span>
              {isOwn && <MessageStatus status="read" />}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            {!isOwn && (
              <Avatar
                src={message.sender?.avatar}
                firstName={message.sender?.firstName || message.firstName}
                lastName={message.sender?.lastName || message.lastName}
                username={message.sender?.username}
                size="sm"
              />
            )}
            <div className={`rounded-2xl px-4 py-3 ${
              isOwn
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
            }`}>
              {!isOwn && (
                <p className="text-xs font-bold mb-1 text-blue-600 dark:text-blue-400">
                  {message.sender?.firstName || message.firstName} {message.sender?.lastName || message.lastName}
                </p>
              )}
              <p className="text-sm leading-relaxed break-words">{message.content}</p>
              <div className="flex justify-between items-center mt-2 gap-2">
                <span className={`text-xs ${
                  isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {formatTime(message.createdAt)}
                  {message.isEdited && <span className="ml-1">(изменено)</span>}
                </span>
                {isOwn && <MessageStatus status="read" />}
              </div>
            </div>
          </div>
        )}

        {/* Reactions */}
        {reactions.length > 0 && (
          <MessageReactions 
            messageId={message.id}
            reactions={reactions}
            onToggleReaction={toggleReaction}
          />
        )}
      </div>
    </div>
  );
};
