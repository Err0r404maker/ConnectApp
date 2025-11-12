interface MessageReactionsProps {
  reactions?: any;
  onToggleReaction: (emoji: string) => void;
}

export const MessageReactions = ({ reactions, onToggleReaction }: MessageReactionsProps) => {
  // Проверяем что reactions существует и не пустой
  if (!reactions) return null;
  
  // Преобразуем reactions в массив пар [emoji, count]
  const reactionEntries = Object.entries(reactions || {});
  
  if (reactionEntries.length === 0) return null;

  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {reactionEntries.map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => onToggleReaction(emoji)}
          className="px-2 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-xs flex items-center gap-1 transition-colors"
        >
          <span>{emoji}</span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">{String(count)}</span>
        </button>
      ))}
    </div>
  );
};
