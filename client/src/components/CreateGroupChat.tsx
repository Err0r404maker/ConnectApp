import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { AlertModal } from './AlertModal';

interface CreateGroupChatProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (chatId: string) => void;
}

export const CreateGroupChat: React.FC<CreateGroupChatProps> = ({ isOpen, onClose, onCreated }) => {
  const { accessToken } = useAuthStore();
  const [friends, setFriends] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [chatName, setChatName] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info'}>({isOpen: false, title: '', message: '', type: 'info'});

  useEffect(() => {
    if (isOpen) loadFriends();
  }, [isOpen]);

  const loadFriends = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/friends', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки друзей:', error);
    }
  };

  const toggleFriend = (friendId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelected(newSelected);
  };

  const createChat = async () => {
    if (selected.size === 0) {
      setAlertModal({isOpen: true, title: 'Внимание', message: 'Выберите хотя бы одного друга', type: 'info'});
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: chatName.trim() || 'Новый чат',
          type: 'GROUP'
        })
      });

      if (response.ok) {
        const chat = await response.json();
        
        // Отправляем приглашения всем выбранным друзьям
        for (const friendId of selected) {
          const friend = friends.find(f => f.userId === friendId || f.friendId === friendId);
          if (friend) {
            await fetch('http://localhost:3001/api/chat-invites', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
              },
              body: JSON.stringify({
                chatId: chat.id,
                username: friend.username
              })
            });
          }
        }

        setAlertModal({isOpen: true, title: 'Успех', message: `Чат создан! Приглашения отправлены ${selected.size} друзьям`, type: 'success'});
        setTimeout(() => {
          onCreated(chat.id);
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Ошибка создания чата:', error);
      setAlertModal({isOpen: true, title: 'Ошибка', message: 'Ошибка создания чата', type: 'error'});
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-[500px] max-w-[90vw] max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Создать групповой чат</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Название группы
          </label>
          <input
            type="text"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            placeholder="Введите название группы"
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Выбрано: {selected.size} из {friends.length}
        </p>

        <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
          {friends.map((friend) => {
            const friendId = friend.userId || friend.friendId;
            const isSelected = selected.has(friendId);
            
            return (
              <div
                key={friendId}
                onClick={() => toggleFriend(friendId)}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {friend.firstName?.[0]}{friend.lastName?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {friend.firstName} {friend.lastName}
                  </p>
                  <p className="text-sm text-gray-500 font-mono">@{friend.username}</p>
                </div>
                {isSelected && (
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            onClick={createChat}
            disabled={loading || selected.size === 0}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Создание...' : `Создать (${selected.size})`}
          </button>
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
