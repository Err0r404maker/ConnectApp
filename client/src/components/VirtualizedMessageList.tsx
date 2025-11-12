import React, { memo, useMemo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { MessageStatus, MessageStatusType } from './MessageStatus';
import { MessageReactions } from './MessageReactions';
import { MessageContextMenu } from './MessageContextMenu';
import { useReactions } from '../hooks/useReactions';

interface Message {
  id: string;
  content: string;
  senderId: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  type?: 'TEXT' | 'IMAGE';
  fileUrl?: string;
  status?: MessageStatusType;
  reactions?: Array<{ emoji: string; count: number }>;
}

interface MessageItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    messages: Message[];
    currentUserId: string;
    onDeleteMessage: (messageId: string) => void;
  };
}

const MessageItem = memo<MessageItemProps>(({ index, style, data }) => {
  const { messages, currentUserId, onDeleteMessage } = data;
  const message = messages[index];
  const { reactions, toggleReaction } = useReactions(message.id);
  const [contextMenu, setContextMenu] = useState<{x: number; y: number} | null>(null);

  const [longPressTimer, setLongPressTimer] = React.useState<NodeJS.Timeout | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const timer = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenu({ x: touch.clientX, y: touch.clientY });
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={style} className="px-4">
      <div 
        className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'} group`}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
      >
        <div className={`relative max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
          message.senderId === currentUserId
            ? 'bg-blue-500 text-white'
            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
        }`}>
          {message.senderId !== currentUserId && (
            <p className="text-xs font-bold mb-2 text-blue-600 dark:text-blue-400">
              {message.firstName} {message.lastName}
            </p>
          )}
          
          {message.type === 'IMAGE' && (message.content || message.fileUrl) ? (
            <img 
              src={message.content?.startsWith('data:') ? message.content : `http://localhost:3001${message.fileUrl}`}
              alt="Изображение" 
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                const imageUrl = message.content?.startsWith('data:') ? message.content : `http://localhost:3001${message.fileUrl}`;
                window.open(imageUrl, '_blank');
              }}
            />
          ) : (
            <p className="text-sm leading-relaxed">{message.content}</p>
          )}
          
          <div className="flex justify-between items-center mt-2">
            <span className={`text-xs ${
              message.senderId === currentUserId ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {formatTime(message.createdAt)}
            </span>
            
            {message.senderId === currentUserId && (
              <div className="flex items-center space-x-2">
                <MessageStatus status="read" />
                <button
                  onClick={() => onDeleteMessage(message.id)}
                  className="opacity-0 group-hover:opacity-70 hover:opacity-100 p-1 rounded-full hover:bg-white/20 transition-all"
                  title="Удалить"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          <MessageReactions 
            reactions={reactions}
            onToggleReaction={toggleReaction}
          />
        </div>
      </div>
      
      {contextMenu && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOwn={message.senderId === currentUserId}
          onClose={() => setContextMenu(null)}
          onReact={toggleReaction}
          onReply={() => { console.log('Reply:', message.id); setContextMenu(null); }}
          onForward={() => { 
            const socket = (window as any).socket;
            if (socket) {
              const chatIds = prompt('Введите ID чатов через запятую:');
              if (chatIds) {
                socket.emit('message:forward', { messageId: message.id, targetChatIds: chatIds.split(',').map(s => s.trim()) });
              }
            }
            setContextMenu(null);
          }}
          onPin={() => {
            const socket = (window as any).socket;
            if (socket) {
              socket.emit('message:pin', { messageId: message.id });
            }
            setContextMenu(null);
          }}
          onEdit={() => { console.log('Edit:', message.id); setContextMenu(null); }}
          onDelete={() => { onDeleteMessage(message.id); setContextMenu(null); }}
        />
      )}
    </div>
  );
});

interface VirtualizedMessageListProps {
  messages: Message[];
  currentUserId: string;
  onDeleteMessage: (messageId: string) => void;
  height: number;
}

export const VirtualizedMessageList = memo<VirtualizedMessageListProps>(({
  messages,
  currentUserId,
  onDeleteMessage,
  height
}) => {
  const itemData = useMemo(() => ({
    messages,
    currentUserId,
    onDeleteMessage
  }), [messages, currentUserId, onDeleteMessage]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-8">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-3">Начните общение</h3>
        <p className="text-gray-500 dark:text-gray-400">Пока нет сообщений. Напишите первое!</p>
      </div>
    );
  }

  return (
    <List
      height={height}
      width="100%"
      itemCount={messages.length}
      itemSize={120}
      itemData={itemData}
      className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
    >
      {MessageItem}
    </List>
  );
});
