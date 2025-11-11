import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface GroupSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroupSearch: React.FC<GroupSearchProps> = ({ isOpen, onClose }) => {
  const { accessToken } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestedGroups, setRequestedGroups] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!searchQuery.trim() || !accessToken) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:3001/api/chats/search?username=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        toast.error('Ошибка поиска');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Ошибка поиска');
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoinRequest = async (chatId: string, chatName: string) => {
    if (!accessToken) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/chat-invites/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ chatId })
      });
      
      if (response.ok) {
        setRequestedGroups(prev => new Set(prev).add(chatId));
        toast.success(`Заявка в "${chatName}" отправлена`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка отправки заявки');
      }
    } catch (error) {
      console.error('Join request error:', error);
      toast.error('Ошибка отправки заявки');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🔍 Поиск групп</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Введите username группы..."
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium"
            >
              {isSearching ? 'Поиск...' : 'Найти'}
            </button>
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Группы не найдены' : 'Введите username группы для поиска'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {group.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">@{group.username}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{group.memberCount} участников</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinRequest(group.id, group.name)}
                    disabled={requestedGroups.has(group.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {requestedGroups.has(group.id) ? 'Заявка отправлена' : 'Подать заявку'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
