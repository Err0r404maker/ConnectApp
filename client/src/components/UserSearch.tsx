import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { AlertModal } from './AlertModal';

interface UserSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({ isOpen, onClose }) => {
  const { accessToken } = useAuthStore();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [alertModal, setAlertModal] = useState<{isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info'}>({isOpen: false, title: '', message: '', type: 'info'});

  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/users?search=${searchQuery}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Ошибка поиска:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (username: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ username })
      });

      if (response.ok) {
        setSentRequests(prev => new Set(prev).add(username));
        setAlertModal({isOpen: true, title: 'Успех', message: 'Запрос в друзья отправлен', type: 'success'});
      } else {
        const error = await response.json();
        setAlertModal({isOpen: true, title: 'Ошибка', message: error.error || 'Ошибка отправки запроса', type: 'error'});
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="glass rounded-3xl p-6 w-[500px] max-w-[90vw] max-h-[80vh] overflow-y-auto soft-shadow-lg animate-slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">🔍 Поиск пользователей</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-xl transition-all duration-200 hover:scale-110">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            placeholder="Введите username..."
            className="w-full px-4 py-3 glass rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Поиск...</p>
          </div>
        )}

        {!loading && users.length === 0 && query && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Пользователи не найдены</p>
          </div>
        )}

        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 glass-hover rounded-2xl transition-all duration-200">
              <div className="flex items-center space-x-3">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-12 h-12 rounded-full ring-2 ring-gray-200 dark:ring-gray-700" />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white tracking-tight">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                </div>
              </div>
              <button
                onClick={() => addFriend(user.username)}
                disabled={sentRequests.has(user.username)}
                className={`px-5 py-2.5 rounded-2xl font-medium transition-all duration-200 ${
                  sentRequests.has(user.username)
                    ? 'glass cursor-not-allowed text-gray-600 dark:text-gray-400'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30'
                }`}
              >
                {sentRequests.has(user.username) ? '✓ Отправлено' : 'Добавить'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({...alertModal, isOpen: false})}
      />
    </div>
  );
};
