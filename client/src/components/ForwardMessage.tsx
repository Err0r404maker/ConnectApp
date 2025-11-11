import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Chat {
  id: string;
  name: string;
}

export const ForwardMessage = ({ messageId, onClose }: { messageId: string; onClose: () => void }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_URL}/api/chats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChats(data);
      } catch (error) {
        console.error('Ошибка загрузки чатов:', error);
      }
    };
    fetchChats();
  }, []);

  const handleForward = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/forward`, 
        { messageId, targetChatIds: selected },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      onClose();
    } catch (error) {
      console.error('Ошибка пересылки:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Переслать сообщение</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
          {chats.map(chat => (
            <label key={chat.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(chat.id)}
                onChange={(e) => {
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
        <div className="flex gap-2">
          <button onClick={handleForward} disabled={selected.length === 0} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
            Переслать
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};
