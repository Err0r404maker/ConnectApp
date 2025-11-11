import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface ChatStatsProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatStats: React.FC<ChatStatsProps> = ({ chatId, isOpen, onClose }) => {
  const { accessToken } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && chatId) loadStats();
  }, [isOpen, chatId]);

  const loadStats = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/chats/${chatId}/stats`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        setStats(await response.json());
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">📊 Статистика чата</h2>
              {stats?.chatInfo && (
                <p className="text-white/80 mt-1">{stats.chatInfo.name} {stats.chatInfo.username && `(@${stats.chatInfo.username})`}</p>
              )}
            </div>
            <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner w-12 h-12"></div>
          </div>
        ) : stats ? (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl">
                <div className="text-3xl mb-2">💬</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMessages}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Сообщений</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMembers}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Участников</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl">
                <div className="text-3xl mb-2">❤️</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReactions}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Реакций</div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl">
                <div className="text-3xl mb-2">📌</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pinnedCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Закреплено</div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">📈 Типы сообщений</h3>
              <div className="space-y-3">
                {[
                  { label: 'Текстовые', count: stats.messageTypes.text, icon: '💬', color: 'blue' },
                  { label: 'Изображения', count: stats.messageTypes.image, icon: '🖼️', color: 'purple' },
                  { label: 'Файлы', count: stats.messageTypes.file, icon: '📎', color: 'green' },
                  { label: 'Голосовые', count: stats.messageTypes.voice, icon: '🎤', color: 'pink' }
                ].map((type) => (
                  <div key={type.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{type.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{type.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-${type.color}-500 rounded-full transition-all duration-500`}
                          style={{ width: `${(type.count / stats.totalMessages) * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white w-12 text-right">{type.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {stats.topUsers.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">🏆 Топ участников</h3>
                <div className="space-y-3">
                  {stats.topUsers.map((user: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-gray-400 w-8">{idx + 1}</div>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name[0]}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.count} сообщений</p>
                      </div>
                      {idx === 0 && <span className="text-2xl">👑</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-4 rounded-xl">
                <div className="text-2xl mb-2">📅</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Создан</div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {new Date(stats.chatInfo.createdAt).toLocaleDateString('ru')}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 p-4 rounded-xl">
                <div className="text-2xl mb-2">⏰</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Последняя активность</div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {new Date(stats.lastActivity).toLocaleDateString('ru')}
                </div>
              </div>
              
              {stats.messagesLast24h > 0 && (
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-xl">
                  <div className="text-2xl mb-2">🔥</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">За 24 часа</div>
                  <div className="font-bold text-gray-900 dark:text-white">{stats.messagesLast24h} сообщений</div>
                </div>
              )}
              
              {stats.topEmoji && (
                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-xl">
                  <div className="text-2xl mb-2">{stats.topEmoji.emoji}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Популярная реакция</div>
                  <div className="font-bold text-gray-900 dark:text-white">{stats.topEmoji.count} раз</div>
                </div>
              )}
              
              {stats.avgMessageLength > 0 && (
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-4 rounded-xl">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Средняя длина</div>
                  <div className="font-bold text-gray-900 dark:text-white">{stats.avgMessageLength} симв.</div>
                </div>
              )}
              
              {stats.mostActiveDay && (
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 p-4 rounded-xl">
                  <div className="text-2xl mb-2">📆</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Активный день</div>
                  <div className="font-bold text-gray-900 dark:text-white">{stats.mostActiveDay}</div>
                </div>
              )}
              
              {stats.mostActiveHour && (
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-4 rounded-xl">
                  <div className="text-2xl mb-2">⏱️</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Активный час</div>
                  <div className="font-bold text-gray-900 dark:text-white">{stats.mostActiveHour}</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">Нет данных</div>
        )}
      </div>
    </div>
  );
};
