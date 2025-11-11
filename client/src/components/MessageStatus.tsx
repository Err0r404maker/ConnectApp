import React from 'react';

export type MessageStatusType = 'sending' | 'sent' | 'delivered' | 'read';

interface MessageStatusProps {
  status: MessageStatusType;
  className?: string;
  readCount?: number;
  totalMembers?: number;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ 
  status, 
  className = '', 
  readCount = 0, 
  totalMembers = 0 
}) => {
  const getIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        );
      case 'sent':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'delivered':
        return (
          <div className="flex items-center gap-0.5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <svg className="w-3.5 h-3.5 text-gray-400 -ml-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'read':
        const isReadByAll = totalMembers > 0 && readCount >= totalMembers;
        return (
          <div className="flex items-center gap-1" title={totalMembers > 1 ? `Прочитали: ${readCount}/${totalMembers}` : 'Прочитано'}>
            <div className="flex items-center">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <svg className="w-3.5 h-3.5 text-blue-500 -ml-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            {totalMembers > 1 && (
              <span className={`text-[10px] font-medium ${
                isReadByAll ? 'text-green-500' : 'text-blue-500'
              }`}>
                {readCount}
              </span>
            )}
          </div>
        );
    }
  };

  return <div className={`flex items-center ${className}`}>{getIcon()}</div>;
};
