interface QuickActionsProps {
  onReply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onForward: () => void;
  onReact: () => void;
  isOwn: boolean;
}

export const QuickActions = ({ onReply, onEdit, onDelete, onForward, onReact, isOwn }: QuickActionsProps) => {
  return (
    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 right-0 flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 transition-opacity">
      <button
        onClick={onReact}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="Реакция"
      >
        😊
      </button>
      <button
        onClick={onReply}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="Ответить"
      >
        ↩️
      </button>
      <button
        onClick={onForward}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="Переслать"
      >
        ↪️
      </button>
      {isOwn && onEdit && (
        <button
          onClick={onEdit}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Редактировать"
        >
          ✏️
        </button>
      )}
      {isOwn && onDelete && (
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
          title="Удалить"
        >
          🗑️
        </button>
      )}
    </div>
  );
};
