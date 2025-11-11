import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { UserProfile } from './UserProfile';

interface ChatMembersProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatMembers: React.FC<ChatMembersProps> = ({ chatId, isOpen, onClose }) => {
  const { accessToken } = useAuthStore();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && chatId) {
      loadMembers();
    }
  }, [isOpen, chatId]);

  const loadMembers = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-[500px] max-w-[90vw] max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Участники ({members.length})
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.userId}
                  onClick={() => setSelectedUserId(member.userId)}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                >
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.username} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">@{member.username}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedUserId && (
        <UserProfile
          userId={selectedUserId}
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </>
  );
};
