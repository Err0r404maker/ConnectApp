import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { UserSearch } from './UserSearch';
import { GroupSearch } from './GroupSearch';
import { JoinRequests } from './JoinRequests';
import { timeAgo } from '../utils/timeAgo';
import { ThemeToggle } from './ThemeToggle';
import { Avatar } from './Avatar';

interface SidebarProps {
  chats: any[];
  activeChat: string | null;
  onChatSelect: (chatId: string) => void;
  onCreateChat: () => void;
  onCreateGroupChat?: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
  isConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChat,
  onChatSelect,
  onCreateChat,
  onCreateGroupChat,
  onProfileClick,
  onLogout,
  isConnected
}) => {
  const { user, accessToken, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'chats' | 'friends' | 'invites'>('chats');
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [chatInvites, setChatInvites] = useState<any[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGroupSearch, setShowGroupSearch] = useState(false);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [joinRequestsCount, setJoinRequestsCount] = useState(0);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [, forceUpdate] = useState({});

  // Обновляем время каждую минуту для корректного отображения "был(а) X назад"
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 60000); // каждую минуту
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'friends') loadFriends();
    if (activeTab === 'invites') loadInvites();
    if (activeTab === 'chats') {
      loadUnreadCounts();
      loadJoinRequestsCount();
    }
  }, [activeTab, showOnlineOnly]);

  // Загружаем заявки в друзья при монтировании
  useEffect(() => {
    loadFriends();
  }, []);

  const loadJoinRequestsCount = async () => {
    if (!accessToken) return;
    try {
      const response = await fetch('http://localhost:3001/api/chat-invites/requests', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setJoinRequestsCount(data.length);
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    }
  };

  const loadUnreadCounts = async () => {
    if (!accessToken) return;
    try {
      const response = await fetch('http://localhost:3001/api/message-reads/unread-counts', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.status === 401) {
        logout();
        return;
      }
      if (response.ok) {
        setUnreadCounts(await response.json());
      }
    } catch (error) {
      console.error('Ошибка загрузки непрочитанных:', error);
    }
  };

  // Слушаем WebSocket уведомления
  useEffect(() => {
    const socket = (window as any).socket;
    if (socket) {
      socket.on('friend:request', (data: any) => {
        console.log('Получен запрос в друзья:', data);
        loadFriends();
      });

      socket.on('unread:update', () => {
        loadUnreadCounts();
      });

      socket.on('message:new', () => {
        loadUnreadCounts();
      });

      socket.on('user:online', (data: any) => {
        setFriends(prev => prev.map(f => 
          (f.userId === data.userId || f.friendId === data.userId)
            ? { ...f, userStatus: 'ONLINE' }
            : f
        ));
      });

      socket.on('user:offline', (data: any) => {
        setFriends(prev => prev.map(f => 
          (f.userId === data.userId || f.friendId === data.userId)
            ? { ...f, userStatus: 'OFFLINE', lastSeen: new Date().toISOString() }
            : f
        ));
      });

      return () => {
        socket.off('friend:request');
        socket.off('unread:update');
        socket.off('message:new');
        socket.off('user:online');
        socket.off('user:offline');
      };
    }
  }, []);

  // Слушаем обновление списка друзей
  useEffect(() => {
    const handleFriendsUpdate = () => {
      if (activeTab === 'friends') loadFriends();
    };
    window.addEventListener('friendsUpdated', handleFriendsUpdate);
    return () => window.removeEventListener('friendsUpdated', handleFriendsUpdate);
  }, [activeTab]);

  const loadFriends = async () => {
    if (!accessToken) return;
    try {
      const url = showOnlineOnly 
        ? 'http://localhost:3001/api/friends?onlineOnly=true'
        : 'http://localhost:3001/api/friends';
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.status === 401) {
        logout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
        setFriendRequests(data.requests || []);
        setSentRequests(data.sentRequests || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки друзей:', error);
    }
  };

  const loadInvites = async () => {
    if (!accessToken) return;
    try {
      const response = await fetch('http://localhost:3001/api/chat-invites/my', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.status === 401) {
        logout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setChatInvites(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки приглашений:', error);
    }
  };

  const handleInviteAction = async (inviteId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`http://localhost:3001/api/chat-invites/${inviteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ action })
      });
      if (response.ok) {
        loadInvites();
        if (action === 'accept') window.location.reload();
      }
    } catch (error) {
      console.error('Ошибка обработки приглашения:', error);
    }
  };

  const handleFriendAction = async (friendId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`http://localhost:3001/api/friends/${friendId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ action })
      });
      if (response.ok) loadFriends();
    } catch (error) {
      console.error('Ошибка обработки запроса:', error);
    }
  };

  return (
    <div className="sidebar scrollbar-elegant">
      {/* User Profile */}
      <div className="p-6 border-b border-white/30 glass-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar
              src={user?.avatar}
              firstName={user?.firstName}
              lastName={user?.lastName}
              username={user?.username}
              size="lg"
              onClick={onProfileClick}
              showOnline
              isOnline={isConnected}
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-neutral-500">
                {isConnected ? 'В сети' : 'Не в сети'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={onLogout} className="btn btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/30 glass-secondary">
        <button
          onClick={() => setActiveTab('chats')}
          className={`btn ${activeTab === 'chats' ? 'btn-primary' : 'btn-ghost'} flex-1`}
        >
          Чаты
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`btn ${activeTab === 'friends' ? 'btn-primary' : 'btn-ghost'} flex-1 relative`}
        >
          Друзья
          {friendRequests.length > 0 && (
            <span className="badge badge-error absolute -top-1 -right-1 w-2 h-2 p-0 animate-bounce-soft"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('invites')}
          className={`btn ${activeTab === 'invites' ? 'btn-primary' : 'btn-ghost'} flex-1 relative`}
        >
          Приглашения
          {chatInvites.length > 0 && (
            <span className="badge badge-error absolute -top-1 -right-1">
              {chatInvites.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-elegant">
        {activeTab === 'chats' && (
          <>
            <div className="p-4 border-b border-white/20 space-y-2">
              <button
                onClick={onCreateChat}
                className="btn btn-primary w-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Создать чат
              </button>
              {onCreateGroupChat && (
                <button
                  onClick={onCreateGroupChat}
                  className="btn btn-secondary w-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Чат с друзьями
                </button>
              )}
              <button
                onClick={() => setShowGroupSearch(true)}
                className="btn btn-secondary w-full"
                style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Найти группу
              </button>
              {joinRequestsCount > 0 && (
                <button
                  onClick={() => setShowJoinRequests(true)}
                  className="btn btn-secondary w-full relative"
                  style={{background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'}}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  Заявки ({joinRequestsCount})
                </button>
              )}
            </div>
            <div className="px-4 py-3">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Чаты ({chats.length})
              </h3>
            </div>
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={async () => {
                  onChatSelect(chat.id);
                  setUnreadCounts(prev => ({ ...prev, [chat.id]: 0 }));
                  try {
                    const response = await fetch('http://localhost:3001/api/message-reads/mark-read', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`
                      },
                      body: JSON.stringify({ chatId: chat.id })
                    });
                    const data = await response.json();
                    console.log('Отмечено как прочитанных:', data.markedCount);
                    setTimeout(() => loadUnreadCounts(), 500);
                  } catch (error) {
                    console.error('Ошибка отметки прочитанных:', error);
                  }
                }}
                className={`card p-3 mx-2 mb-2 cursor-pointer relative ${
                  activeChat === chat.id ? 'card-elevated' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <div
                      className="cursor-pointer"
                      onClick={(e) => {
                        if (chat.type === 'DIRECT' && chat.otherUserId) {
                          e.stopPropagation();
                          window.dispatchEvent(new CustomEvent('openUserProfile', { detail: { userId: chat.otherUserId } }));
                        }
                      }}
                    >
                      <Avatar
                        src={chat.avatar || (chat.members && chat.members[0]?.avatar)}
                        firstName={chat.name || chat.firstName}
                        lastName={chat.lastName || ""}
                        size="lg"
                        showOnline={chat.type === 'DIRECT'}
                        isOnline={chat.isOnline}
                      />
                    </div>
                    {unreadCounts[chat.id] > 0 && (
                      <span className="badge badge-error absolute -top-1 -right-1 animate-bounce-soft z-20">
                        {unreadCounts[chat.id] > 99 ? '99+' : unreadCounts[chat.id]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold truncate text-sm text-gray-900 dark:text-white">{chat.name}</p>
                      {unreadCounts[chat.id] > 0 && (
                        <div className="w-2 h-2 bg-red-500 rounded-full ml-2 flex-shrink-0 animate-pulse"></div>
                      )}
                    </div>
                    <p className={`text-xs truncate ${
                      unreadCounts[chat.id] > 0 
                        ? 'text-gray-900 dark:text-white font-semibold' 
                        : 'opacity-70 text-gray-600 dark:text-gray-400'
                    }`}>
                      {chat.lastMessage?.type === 'IMAGE' ? '🖼️ Изображение' : 
                       chat.lastMessage?.type === 'FILE' ? '📎 Файл' :
                       chat.lastMessage?.type === 'VOICE' ? '🎤 Голосовое' :
                       chat.lastMessage?.content || 'Нет сообщений'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'friends' && (
          <div className="p-4 space-y-4">
            <button
              onClick={() => setShowUserSearch(true)}
              className="btn-primary w-full flex items-center justify-center space-x-2"
              style={{background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="font-medium">Найти друзей</span>
            </button>
            {sentRequests.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📤 Отправленные запросы</h3>
                {sentRequests.map((req) => (
                  <div key={req.id} className="glass-secondary rounded-2xl p-3 mb-2 opacity-60">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={req.avatar}
                        firstName={req.firstName}
                        lastName={req.lastName}
                        username={req.username}
                        size="md"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{req.firstName} {req.lastName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{req.username}</p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">⏳ Ожидает ответа...</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {friendRequests.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📥 Входящие запросы</h3>
                {friendRequests.map((req) => (
                  <div key={req.id} className="glass-secondary rounded-2xl p-3 mb-2">
                    <div className="flex items-center space-x-3 mb-2">
                      <Avatar
                        src={req.avatar}
                        firstName={req.firstName}
                        lastName={req.lastName}
                        username={req.username}
                        size="md"
                      />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{req.firstName} {req.lastName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{req.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFriendAction(req.id, 'accept')}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-all"
                      >
                        ✓ Принять
                      </button>
                      <button
                        onClick={() => handleFriendAction(req.id, 'reject')}
                        className="flex-1 px-3 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-all"
                      >
                        ✗ Отклонить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Мои друзья ({friends.length})
                </h3>
                <button
                  onClick={() => setShowOnlineOnly(!showOnlineOnly)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    showOnlineOnly 
                      ? 'bg-green-500 text-white shadow-lg' 
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    showOnlineOnly ? 'bg-white' : 'bg-green-500'
                  }`}></span>
                  {showOnlineOnly ? 'Все' : 'Онлайн'}
                </button>
              </div>
              {friends.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Пока нет друзей</p>
              ) : (
                friends.map((friend) => {
                  const isOnline = friend.userStatus === 'ONLINE';
                  const friendUserId = friend.userId === user?.id ? friend.friendId : friend.userId;
                  return (
                  <div 
                    key={friend.id} 
                    className="glass-secondary rounded-2xl p-3 mb-2 flex items-center space-x-3 hover:scale-[1.02] transition-all cursor-pointer"
                    onClick={() => {
                      console.log('Клик на друга:', { friend, friendUserId, currentUserId: user?.id });
                      window.dispatchEvent(new CustomEvent('openUserProfile', { detail: { userId: friendUserId } }));
                    }}
                  >
                    <Avatar
                      src={friend.avatar}
                      firstName={friend.firstName}
                      lastName={friend.lastName}
                      username={friend.username}
                      size="md"
                      showOnline
                      isOnline={isOnline}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{friend.firstName} {friend.lastName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isOnline ? 'В сети' : `был(а) ${timeAgo(friend.lastSeen || new Date())}`}
                      </p>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'invites' && (
          <div className="p-4 space-y-2">
            {chatInvites.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Нет приглашений</p>
            ) : (
              chatInvites.map((invite) => (
                <div key={invite.id} className="bg-white dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <Avatar
                      src={invite.avatar}
                      firstName={invite.firstName}
                      lastName={invite.lastName}
                      username={invite.username}
                      size="md"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{invite.chatName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">от @{invite.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleInviteAction(invite.id, 'accept')}
                      className="flex-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      ✓ Принять
                    </button>
                    <button
                      onClick={() => handleInviteAction(invite.id, 'reject')}
                      className="flex-1 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      ✗ Отклонить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <UserSearch isOpen={showUserSearch} onClose={() => setShowUserSearch(false)} />
      <GroupSearch isOpen={showGroupSearch} onClose={() => setShowGroupSearch(false)} />
      <JoinRequests isOpen={showJoinRequests} onClose={() => { setShowJoinRequests(false); loadJoinRequestsCount(); }} />
    </div>
  );
};
