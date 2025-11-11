import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface UserProfileProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, isOpen, onClose }) => {
  const { accessToken, user: currentUser } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<string>('none');

  useEffect(() => {
    if (isOpen && userId) {
      loadUser();
    }
  }, [isOpen, userId]);

  const loadUser = async () => {
    try {
      const userRes = await fetch(`http://localhost:3001/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.settings && typeof userData.settings === 'string') {
          try {
            userData.settings = JSON.parse(userData.settings);
          } catch (e) {
            userData.settings = null;
          }
        }
        setUser(userData);
        
        const statusRes = await fetch(`http://localhost:3001/api/friends/status/${userData.username}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setFriendStatus(statusData.status);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      const chatsResponse = await fetch('http://localhost:3001/api/chats', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (chatsResponse.ok) {
        const chats = await chatsResponse.json();
        const existingChat = chats.find((chat: any) => 
          chat.type === 'DIRECT' && 
          chat.members?.some((m: any) => m.userId === userId)
        );
        
        if (existingChat) {
          onClose();
          window.dispatchEvent(new CustomEvent('openChat', { detail: { chatId: existingChat.id } }));
          return;
        }
      }
      
      const response = await fetch('http://localhost:3001/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          type: 'DIRECT',
          targetUserId: userId,
          name: `${user.firstName} ${user.lastName}`
        })
      });
      
      if (response.ok) {
        const newChat = await response.json();
        onClose();
        window.dispatchEvent(new CustomEvent('openChat', { detail: { chatId: newChat.id } }));
      }
    } catch (error) {
      console.error('Ошибка открытия чата:', error);
    }
  };

  const handleAddFriend = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ username: user.username })
      });
      if (response.ok) {
        setFriendStatus('pending_sent');
      }
    } catch (error) {
      console.error('Ошибка добавления в друзья:', error);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRemoveFriend = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/friends/${user.username}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        loadUser();
        window.dispatchEvent(new CustomEvent('friendsUpdated'));
      }
    } catch (error) {
      console.error('Ошибка удаления друга:', error);
    }
    setShowDeleteConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка...</p>
          </div>
        ) : user ? (
          <>
            {/* Header с градиентом */}
            <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8 rounded-t-3xl">
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:scale-110"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex flex-col items-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-2xl" />
                ) : (
                  <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-2xl">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Основная информация */}
            <div className="p-6 space-y-4">
              <div className="text-center -mt-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-mono text-sm mb-3">
                  @{user.username}
                </p>
                
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    user.status === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {user.status === 'ONLINE' ? '🟢 В сети' : '⚫ Не в сети'}
                  </span>
                </div>
                
                <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
                  {user.role === 'STUDENT' ? '🎓 Студент' : 
                   user.role === 'TEACHER' ? '👨‍🏫 Преподаватель' : 
                   user.role === 'ADMIN' ? '👑 Администратор' : user.role}
                </span>
              </div>

              {/* Описание */}
              {user.bio && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="text-xl flex-shrink-0">💬</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
                      "{user.bio}"
                    </p>
                  </div>
                </div>
              )}
              
              {/* Плейлист */}
              {user.settings?.playlist && user.settings?.musicEnabled && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🎵</span>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Слушает</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {user.settings.playlist === 'lofi' ? 'Lofi Hip Hop' :
                         user.settings.playlist === 'ambient' ? 'Ambient Sounds' :
                         user.settings.playlist === 'classical' ? 'Classical Piano' :
                         user.settings.playlist === 'jazz' ? 'Smooth Jazz' : user.settings.playlist}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Кнопки действий */}
              {userId !== currentUser?.id && (
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleMessage}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Написать сообщение
                  </button>
                  
                  {friendStatus === 'none' && (
                    <button
                      onClick={handleAddFriend}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Добавить в друзья
                    </button>
                  )}
                  
                  {friendStatus === 'pending_sent' && (
                    <button disabled className="w-full px-4 py-3 bg-gray-400 text-white rounded-xl font-semibold cursor-not-allowed opacity-70">
                      ⏳ Запрос отправлен
                    </button>
                  )}
                  
                  {friendStatus === 'friends' && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                      </svg>
                      Удалить из друзей
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full mt-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                Закрыть
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Пользователь не найден</p>
          </div>
        )}
      </div>
      
      {/* Delete Friend Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Удалить из друзей?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Вы уверены, что хотите удалить {user?.firstName} из друзей?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleRemoveFriend}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium transition-colors"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
