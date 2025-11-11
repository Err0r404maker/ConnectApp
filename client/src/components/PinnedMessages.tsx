import { useEffect, useState } from 'react';

interface PinnedMessage {
  id: string;
  content: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  type?: string;
  fileName?: string;
}

export const PinnedMessages = ({ chatId }: { chatId: string }) => {
  const [pinned, setPinned] = useState<PinnedMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchPinned = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        
        const response = await fetch(`http://localhost:3001/api/pins/chat/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.status === 401 || response.status === 404) {
          setPinned([]);
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          setPinned(data);
          if (data.length > 0 && currentIndex >= data.length) {
            setCurrentIndex(0);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки закрепленных:', error);
      }
    };

    if (chatId) fetchPinned();
    
    // Подписываемся на обновления закрепов через custom event
    const handlePinUpdate = () => fetchPinned();
    window.addEventListener('pins:updated', handlePinUpdate);
    return () => window.removeEventListener('pins:updated', handlePinUpdate);
  }, [chatId]);

  if (pinned.length === 0) return null;

  const current = pinned[currentIndex];
  const goToNext = () => setCurrentIndex((currentIndex + 1) % pinned.length);
  const goToPrev = () => setCurrentIndex(currentIndex === 0 ? pinned.length - 1 : currentIndex - 1);
  const scrollToMessage = () => {
    const element = document.getElementById(`message-${current.id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const getContent = () => {
    if (current.type === 'IMAGE') return '🖼️ Изображение';
    if (current.type === 'FILE') return `📎 ${current.fileName || 'Файл'}`;
    if (current.type === 'VOICE') return '🎤 Голосовое сообщение';
    return current.content;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200 dark:border-blue-800 p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📌</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-blue-900 dark:text-blue-100 text-xs">
            {current.firstName} {current.lastName}
          </p>
          <p className="text-blue-700 dark:text-blue-300 truncate text-sm">{getContent()}</p>
        </div>
        {pinned.length > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={goToPrev} className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors" title="Предыдущее">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium min-w-[40px] text-center">
              {currentIndex + 1}/{pinned.length}
            </span>
            <button onClick={goToNext} className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors" title="Следующее">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
        <button onClick={scrollToMessage} className="p-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-colors" title="Перейти к сообщению">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
