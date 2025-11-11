import React from 'react';

interface ReplyMessage {
  id: string;
  content: string;
  firstName: string;
  lastName: string;
}

interface MessageReplyProps {
  replyTo: ReplyMessage | null;
  onCancel: () => void;
}

export const MessageReply: React.FC<MessageReplyProps> = ({ replyTo, onCancel }) => {
  if (!replyTo) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 px-4 py-2 flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          Ответ для {replyTo.firstName} {replyTo.lastName}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {replyTo.content}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
