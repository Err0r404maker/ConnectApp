import React, { useState } from 'react';

interface InviteManagerProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InviteManager: React.FC<InviteManagerProps> = ({ chatId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  const inviteUser = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3001/api/invites/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ chatId, username: username.trim() })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('✅ Пользователь приглашен!');
        setUsername('');
        setTimeout(() => onClose(), 1500);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Ошибка приглашения');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Пригласить пользователя</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username пользователя:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && inviteUser()}
              placeholder="Например: student"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <button
            onClick={inviteUser}
            disabled={loading || !username.trim()}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Приглашение...' : 'Пригласить'}
          </button>

          {message && (
            <p className="text-sm text-center">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
};
