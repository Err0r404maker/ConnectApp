import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Avatar } from './Avatar';

interface JoinRequestsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinRequests: React.FC<JoinRequestsProps> = ({ isOpen, onClose }) => {
  const { accessToken } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen]);

  const loadRequests = async () => {
    if (!accessToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/chat-invites/requests', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest = async (inviteId: string, action: 'accept' | 'reject', userName: string) => {
    if (!accessToken) return;
    
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
        toast.success(action === 'accept' ? `${userName} добавлен в группу` : 'Заявка отклонена');
        loadRequests();
      }
    } catch (error) {
      console.error('Error handling request:', error);
      toast.error('Ошибка обработки заявки');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📬 Заявки на вступление</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">Нет новых заявок</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={request.avatar}
                      firstName={request.firstName}
                      lastName={request.lastName}
                      username={request.username}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {request.firstName} {request.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">@{request.username}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Хочет вступить в "{request.chatName}"
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequest(request.id, 'accept', `${request.firstName} ${request.lastName}`)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                      ✓ Принять
                    </button>
                    <button
                      onClick={() => handleRequest(request.id, 'reject', `${request.firstName} ${request.lastName}`)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      ✗ Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
