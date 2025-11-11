import React from 'react';

interface Reaction {
  emoji: string;
  count: number;
  users?: string;
}

interface MessageReactionsDisplayProps {
  reactions: Reaction[];
  onReactionClick: (emoji: string) => void;
}

export const MessageReactionsDisplay: React.FC<MessageReactionsDisplayProps> = ({ reactions, onReactionClick }) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onReactionClick(reaction.emoji)}
          className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm transition-all hover:scale-110"
          title={reaction.users || ''}
        >
          <span>{reaction.emoji}</span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
};
