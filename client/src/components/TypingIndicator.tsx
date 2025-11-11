import React from 'react';

interface TypingIndicatorProps {
  users: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) return null;

  const getText = () => {
    if (users.length === 1) {
      return `${users[0]} печатает...`;
    }
    if (users.length === 2) {
      return `${users[0]} и ${users[1]} печатают...`;
    }
    return `${users[0]} и еще ${users.length - 1} печатают...`;
  };

  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{getText()}</span>
    </div>
  );
};
