import React from 'react';

interface ReadStatusProps {
  isRead: boolean;
  isOwn: boolean;
}

export const ReadStatus: React.FC<ReadStatusProps> = ({ isRead, isOwn }) => {
  if (!isOwn) return null;

  return (
    <span className="inline-flex ml-1">
      {isRead ? (
        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" transform="translate(3, 0)" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 20 20">
          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
        </svg>
      )}
    </span>
  );
};
