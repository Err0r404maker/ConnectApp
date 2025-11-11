import React, { useState } from 'react';

interface MessageActionsProps {
  message: any;
  isOwn: boolean;
  onReply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact: (emoji: string) => void;
  onPin?: () => void;
  onForward?: () => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  isOwn,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin,
  onForward
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const quickReactions = ['👍', '❤️', '😂', '🔥', '👏'];

  return (
    <div className="flex items-center gap-1">
      {/* Быстрые реакции */}
      <div className="flex items-center gap-0.5">
        {quickReactions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className="w-7 h-7 flex items-center justify-center text-sm hover:scale-125 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
            title={`Реакция ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Ответить */}
      <button
        onClick={onReply}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
        title="Ответить"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>

      {/* Копировать */}
      {message.content && (
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          title={copied ? 'Скопировано!' : 'Копировать'}
        >
          {copied ? (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      )}

      {/* Переслать */}
      {onForward && (
        <button
          onClick={onForward}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          title="Переслать"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      )}

      {/* Закрепить */}
      {onPin && (
        <button
          onClick={onPin}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          title="Закрепить"
        >
          📌
        </button>
      )}

      {/* Информация */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
        title="Информация"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Редактировать (только свои) */}
      {isOwn && onEdit && message.type === 'TEXT' && (
        <button
          onClick={onEdit}
          className="p-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
          title="Редактировать"
        >
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      {/* Удалить (только свои) */}
      {isOwn && onDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
          title="Удалить"
        >
          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {/* Информационная панель */}
      {showInfo && (
        <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[200px] z-10">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">ID:</span>
              <span className="font-mono text-gray-700 dark:text-gray-300">{message.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Отправлено:</span>
              <span className="text-gray-700 dark:text-gray-300">
                {new Date(message.createdAt).toLocaleString('ru-RU')}
              </span>
            </div>
            {message.isEdited && (
              <div className="flex justify-between">
                <span className="text-gray-500">Изменено:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {new Date(message.editedAt || message.createdAt).toLocaleString('ru-RU')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Символов:</span>
              <span className="text-gray-700 dark:text-gray-300">{message.content?.length || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
