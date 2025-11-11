import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { ChatMembers } from './ChatMembers';

interface ChatHeaderWithMembersProps {
  chatId: string;
  chatName: string;
  onSearch: (query: string) => void;
  onSettingsClick: () => void;
}

export const ChatHeaderWithMembers: React.FC<ChatHeaderWithMembersProps> = ({
  chatId,
  chatName,
  onSearch,
  onSettingsClick
}) => {
  const { accessToken } = useAuthStore();
  const [members, setMembers] = useState<any[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (chatId) loadMembers();
  }, [chatId]);

  const loadMembers = async () => {
    if (!accessToken) return;
    try {
      const response = await fetch(`http://localhost:3001/api/chats/${chatId}/members`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <>
      <div className="chat-header">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{chatName}</h2>
            <button
              onClick={() => setShowMembers(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 transition-all hover:scale-105"
            >
              <div className="flex -space-x-2">
                {members.slice(0, 3).map((member, i) => (
                  <div
                    key={member.userId || member.id}
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden"
                    style={{ zIndex: 3 - i }}
                  >
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="avatar-tg w-full h-full avatar-tg-green text-[10px]">
                        {member.firstName?.[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-sm font-medium">{members.length}</span>
            </button>
          </div>
          <button
            onClick={onSettingsClick}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Поиск сообщений..."
            className="input-elegant pl-10"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <ChatMembers chatId={chatId} isOpen={showMembers} onClose={() => setShowMembers(false)} />
    </>
  );
};
