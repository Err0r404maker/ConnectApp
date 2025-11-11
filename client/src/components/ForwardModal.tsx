import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ForwardModalProps {
  messageId: string | null;
  onClose: () => void;
}

export const ForwardModal = ({ messageId, onClose }: ForwardModalProps) => {
  const [chats, setChats] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!messageId) return null;

  const loadChats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const { data } = await axios.get(`${API_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(data);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForward = async () => {
    if (selected.length === 0) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3001/api/forward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ messageId, targetChatIds: selected })
      });
      
      if (response.ok) {
        onClose();
      }
    } catch (error) {
      console.error('Ошибка пересылки:', error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold mb-4">Переслать сообщение</h3>
          
          {loading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {chats.map(chat => (
                <label key={chat.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(chat.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelected([...selected, chat.id]);
                      } else {
                        setSelected(selected.filter(id => id !== chat.id));
                      }
                    }}
                  />
                  <span>{chat.name}</span>
                </label>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleForward}
              disabled={selected.length === 0}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Переслать ({selected.length})
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg">
              Отмена
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
