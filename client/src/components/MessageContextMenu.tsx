import { useState } from 'react';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

interface MessageContextMenuProps {
  x: number;
  y: number;
  isOwn: boolean;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onForward: () => void;
  onPin: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const MessageContextMenu = ({
  x, y, isOwn, onClose, onReact, onReply, onForward, onPin, onEdit, onDelete
}: MessageContextMenuProps) => {
  const [showEmojis, setShowEmojis] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div 
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[200px]"
        style={{ left: x, top: y }}
      >
        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <span>😊</span> Реакция
        </button>
        {showEmojis && (
          <div className="px-2 py-2 grid grid-cols-4 gap-1 border-t border-gray-200 dark:border-gray-700">
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => { onReact(emoji); onClose(); }}
                className="text-2xl hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => { onReply(); onClose(); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
          <span>↩️</span> Ответить
        </button>
        <button onClick={() => { onForward(); onClose(); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
          <span>↪️</span> Переслать
        </button>
        <button onClick={() => { onPin(); onClose(); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
          <span>📌</span> Закрепить
        </button>
        {isOwn && onEdit && (
          <button onClick={() => { onEdit(); onClose(); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <span>✏️</span> Редактировать
          </button>
        )}
        {isOwn && onDelete && (
          <button onClick={() => { onDelete(); onClose(); }} className="w-full px-4 py-2 text-left hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 flex items-center gap-2">
            <span>🗑️</span> Удалить
          </button>
        )}
      </div>
    </>
  );
};
