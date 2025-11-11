import React, { useState } from 'react';
import { UserSearch } from './UserSearch';
import { useAuthStore } from '../store/authStore';
import { ConfirmModal } from './ConfirmModal';
import { AlertModal } from './AlertModal';

interface ChatSettingsProps {
  chatId: string;
  chat?: any;
  isOpen: boolean;
  onClose: () => void;
}

const ChatSettings: React.FC<ChatSettingsProps> = ({
  chatId,
  chat,
  isOpen,
  onClose
}) => {
  const [newName, setNewName] = useState('');
  const [chatName, setChatName] = useState('');
  const [newMemberId, setNewMemberId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatAvatar, setChatAvatar] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [alertModal, setAlertModal] = useState<{isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info'}>({isOpen: false, title: '', message: '', type: 'info'});
  const [userRole, setUserRole] = useState<string>('');

  React.useEffect(() => {
    if (isOpen && chatId) {
      loadUserRole();
    }
  }, [isOpen, chatId]);

  const loadUserRole = async () => {
    try {
      const { accessToken, user } = useAuthStore.getState();
      const response = await fetch(`http://localhost:3001/api/chats/${chatId}/members`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const members = await response.json();
        const currentMember = members.find((m: any) => m.userId === user?.id);
        setUserRole(currentMember?.role || '');
      }
    } catch (error) {
      console.error('Ошибка загрузки роли:', error);
    }
  };

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if ((newName.trim() && newName !== chatName) || chatAvatar) {
      setIsSubmitting(true);
      try {
        await onUpdateChat(newName.trim() || chatName, chatAvatar);
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    } else {
      onClose();
    }
  };

  const handleAddMember = async () => {
    if (newMemberId.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onAddMember(newMemberId.trim());
        setNewMemberId('');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'avatar-tg-red', 'avatar-tg-orange', 'avatar-tg-yellow', 'avatar-tg-green',
      'avatar-tg-cyan', 'avatar-tg-blue', 'avatar-tg-purple', 'avatar-tg-pink'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      // Конвертируем в base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const base64Avatar = await base64Promise;
      setChatAvatar(base64Avatar);
      console.log('Аватарка чата загружена');
    } catch (error) {
      console.error('Ошибка загрузки аватарки:', error);
    }
    setIsUploadingAvatar(false);
  };

  const handleDeleteChat = async () => {
    try {
      const { accessToken } = useAuthStore.getState();
      if (!accessToken) {
        setAlertModal({isOpen: true, title: 'Ошибка', message: 'Не авторизован', type: 'error'});
        return;
      }
      const response = await fetch(`http://localhost:3001/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        setAlertModal({isOpen: true, title: 'Успех', message: 'Чат успешно удален', type: 'success'});
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const error = await response.json();
        setAlertModal({isOpen: true, title: 'Ошибка', message: error.error || 'Ошибка удаления', type: 'error'});
      }
    } catch (error) {
      console.error('Ошибка удаления чата:', error);
      setAlertModal({isOpen: true, title: 'Ошибка', message: 'Ошибка удаления чата', type: 'error'});
    }
    setShowDeleteConfirm(false);
  };

  const handleLeaveChat = async () => {
    try {
      const { accessToken } = useAuthStore.getState();
      if (!accessToken) {
        setAlertModal({isOpen: true, title: 'Ошибка', message: 'Не авторизован', type: 'error'});
        return;
      }
      const response = await fetch(`http://localhost:3001/api/chats/${chatId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        setAlertModal({isOpen: true, title: 'Успех', message: 'Вы покинули чат', type: 'success'});
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const error = await response.json();
        setAlertModal({isOpen: true, title: 'Ошибка', message: error.error || 'Ошибка', type: 'error'});
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setAlertModal({isOpen: true, title: 'Ошибка', message: 'Ошибка выхода из чата', type: 'error'});
    }
    setShowLeaveConfirm(false);
  };

  const settingsSections = [
    {
      title: 'Основные настройки',
      icon: '⚙️',
      items: [
        {
          label: 'Аватар группы',
          description: 'Загрузите изображение для группы',
          component: (
            <div className="flex items-center space-x-4">
              <div className="relative">
                {chatAvatar ? (
                  <img src={chatAvatar} alt="Group Avatar" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className={`avatar-tg w-16 h-16 ${getAvatarColor(newName)}`}>
                    <span className="text-xl font-bold">#</span>
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors flex items-center justify-center"
                >
                  {isUploadingAvatar ? (
                    <div className="spinner w-3 h-3 border-white"></div>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
                className="hidden"
              />
              <div>
                <p className="text-sm font-medium text-neutral-700">Нажмите на аватар для изменения</p>
                <p className="text-xs text-neutral-500">Рекомендуемый размер: 512x512px</p>
              </div>
            </div>
          )
        },
        {
          label: 'Название чата',
          description: 'Измените название для всех участников',
          component: (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input-elegant"
              placeholder="Введите название чата"
              disabled={isSubmitting}
            />
          )
        }
      ]
    },
    {
      title: 'Участники',
      icon: '👥',
      items: [
        {
          label: 'Добавить участника по username',
          description: 'Введите @username пользователя для приглашения',
          component: (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value.replace('@', ''))}
                  className="input-elegant flex-1"
                  placeholder="username (без @)"
                  disabled={isSubmitting}
                />
                <button
                  onClick={async () => {
                    if (!newMemberId.trim()) return;
                    setIsSubmitting(true);
                    try {
                      const { accessToken } = useAuthStore.getState();
                      const response = await fetch(`http://localhost:3001/api/chats/${chatId}/members`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${accessToken}`
                        },
                        body: JSON.stringify({ username: newMemberId.trim() })
                      });
                      if (response.ok) {
                        const data = await response.json();
                        setAlertModal({isOpen: true, title: 'Успех', message: data.message || 'Участник добавлен', type: 'success'});
                        setNewMemberId('');
                      } else {
                        const error = await response.json();
                        setAlertModal({isOpen: true, title: 'Ошибка', message: error.error || 'Ошибка', type: 'error'});
                      }
                    } catch (error) {
                      console.error(error);
                      setAlertModal({isOpen: true, title: 'Ошибка', message: 'Ошибка добавления', type: 'error'});
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting || !newMemberId.trim()}
                  className="btn-primary px-6"
                >
                  {isSubmitting ? 'Добавление...' : 'Добавить'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                👉 Пример: @john_doe или john_doe
              </p>
            </div>
          )
        }
      ]
    },
    ...(chat?.groupname && chat.type === 'GROUP' ? [{
      title: 'Поиск группы',
      icon: '🔍',
      items: [{
        label: 'Имя группы для поиска',
        description: 'Пользователи могут найти и подать заявку на вступление',
        component: (
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-200">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">@</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary-700">@{chat.groupname}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(chat.groupname);
                    setAlertModal({isOpen: true, title: 'Скопировано', message: 'Имя группы скопировано в буфер обмена', type: 'success'});
                  }}
                  className="p-1.5 hover:bg-primary-100 rounded-lg transition-colors"
                  title="Скопировать"
                >
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-neutral-600 mt-1">Другие пользователи могут найти группу через поиск</p>
            </div>
          </div>
        )
      }]
    }] : []),
    {
      title: 'Управление',
      icon: '⚠️',
      items: [
        ...(chat?.type === 'GROUP' && userRole !== 'ADMIN' && userRole !== 'OWNER' ? [{
          label: 'Покинуть чат',
          description: 'Выйти из группового чата',
          component: (
            <button
              onClick={() => setShowLeaveConfirm(true)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Покинуть чат</span>
            </button>
          )
        }] : []),
        ...(chat?.type === 'DIRECT' || userRole === 'ADMIN' || userRole === 'OWNER' ? [{
          label: 'Удалить чат',
          description: chat?.type === 'GROUP' ? 'Полностью удалить группу (только админ/владелец)' : 'Удалить личный чат',
          component: (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Удалить чат</span>
            </button>
          )
        }] : [])
      ]
    }
  ];

  return (
    <>
    <div className="modal-backdrop">
      <div className="modal-content max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-white/20">
          <div>
            <h3 className="text-3xl font-bold gradient-text-primary mb-2">
              Настройки чата
            </h3>
            <p className="text-neutral-500 font-medium">Управление параметрами и участниками чата</p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-3 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings Sections */}
        <div className="p-8 space-y-8 max-h-96 overflow-y-auto scrollbar-elegant">
          {settingsSections.map((section, sectionIndex) => (
            <div 
              key={sectionIndex} 
              className="glass-secondary p-6 rounded-2xl border border-primary-100 hover:shadow-lg hover:scale-[1.01]"
              style={{ 
                animationDelay: `${sectionIndex * 0.2}s`,
                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-lg">{section.icon}</span>
                </div>
                <h4 className="text-xl font-bold text-neutral-900">{section.title}</h4>
              </div>
              
              <div className="space-y-6">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <div className="mb-3">
                      <label className="block text-sm font-bold text-neutral-700 mb-1">
                        {item.label}
                      </label>
                      <p className="text-sm text-neutral-500 font-medium">{item.description}</p>
                    </div>
                    {item.component}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex space-x-4 p-8 border-t border-white/20">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex-1 flex items-center justify-center space-x-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner w-4 h-4 border-white"></div>
                <span>Сохранение...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Сохранить изменения</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>

    <ConfirmModal
      isOpen={showDeleteConfirm}
      title="Удалить чат?"
      message="Это действие нельзя отменить. Все сообщения будут удалены безвозвратно."
      confirmText="Удалить"
      cancelText="Отмена"
      onConfirm={handleDeleteChat}
      onCancel={() => setShowDeleteConfirm(false)}
      type="danger"
    />

    <ConfirmModal
      isOpen={showLeaveConfirm}
      title="Покинуть чат?"
      message="Вы уверены, что хотите покинуть этот групповой чат? Вы сможете вернуться только по новому приглашению."
      confirmText="Покинуть"
      cancelText="Отмена"
      onConfirm={handleLeaveChat}
      onCancel={() => setShowLeaveConfirm(false)}
      type="warning"
    />

    <AlertModal
      isOpen={alertModal.isOpen}
      title={alertModal.title}
      message={alertModal.message}
      type={alertModal.type}
      onClose={() => setAlertModal({...alertModal, isOpen: false})}
    />
    </>
  );
};

export default ChatSettings;
