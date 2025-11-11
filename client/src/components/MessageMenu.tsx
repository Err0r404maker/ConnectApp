interface MessageMenuProps {
  messageId: string;
  isOwn: boolean;
  isPinned: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onForward: () => void;
  onPin: () => void;
  onReply: () => void;
  onClose: () => void;
  position: { x: number; y: number };
}

export const MessageMenu = ({ messageId, isOwn, isPinned, onEdit, onDelete, onForward, onPin, onReply, onClose, position }: MessageMenuProps) => {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div 
        className="fixed z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]"
        style={{ left: position.x, top: position.y }}
      >
        <button onClick={onReply} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
          <span>↩️</span> Ответить
        </button>
        <button onClick={onForward} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
          <span>↪️</span> Переслать
        </button>
        {isOwn && (
          <>
            <button onClick={onEdit} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
              <span>✏️</span> Редактировать
            </button>
            <button onClick={onDelete} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 flex items-center gap-2">
              <span>🗑️</span> Удалить
            </button>
          </>
        )}
        <button onClick={onPin} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
          <span>{isPinned ? '📌' : '📍'}</span> {isPinned ? 'Открепить' : 'Закрепить'}
        </button>
      </div>
    </>
  );
};
