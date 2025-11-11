import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ isOpen, onClose }) => {
  const { user, accessToken } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getAvatarColor = (initials: string) => {
    const colors = [
      'avatar-tg-red', 'avatar-tg-orange', 'avatar-tg-yellow', 'avatar-tg-green',
      'avatar-tg-cyan', 'avatar-tg-blue', 'avatar-tg-purple', 'avatar-tg-pink'
    ];
    const hash = initials.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const userInitials = `${firstName[0] || ''}${lastName[0] || ''}`;

  const handleAvatarUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('http://localhost:3001/api/users/avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvatar(data.avatarUrl);
      }
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
    }
    setIsUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  const handleSave = async () => {
    setError('');
    if (!username.trim() || username.length < 3) {
      setError('Username должен быть минимум 3 символа');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Введите корректный email');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }
    
    try {
      const updateData: any = { 
        firstName, 
        lastName, 
        username: username.trim(), 
        email: email.trim(),
        avatar 
      };
      
      if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }
      
      const response = await fetch('http://localhost:3001/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        onClose();
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      setError('Ошибка сохранения профиля');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-white/20 flex-shrink-0">
          <h3 className="text-2xl font-bold gradient-text-primary">Настройки профиля</h3>
          <button onClick={onClose} className="btn-ghost p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {/* Avatar Section */}
          <div className="text-center">
            <div className="relative inline-block">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <div className={`avatar-tg w-24 h-24 ${getAvatarColor(userInitials)}`}>
                  <span className="text-2xl font-bold">{userInitials}</span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors flex items-center justify-center"
              >
                {isUploading ? (
                  <div className="spinner w-4 h-4 border-white"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-elegant"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="input-elegant font-mono"
                placeholder="username"
                maxLength={20}
              />
              <p className="text-xs text-neutral-500 mt-1">Только латиница, цифры и _</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Имя</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-elegant"
                placeholder="Введите имя"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Фамилия</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-elegant"
                placeholder="Введите фамилию"
              />
            </div>
            
            {/* Password Change Section */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">Изменить пароль (необязательно)</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Текущий пароль</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-elegant"
                    placeholder="Введите текущий пароль"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Новый пароль</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-elegant"
                    placeholder="Минимум 6 символов"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Подтвердите пароль</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-elegant"
                    placeholder="Повторите новый пароль"
                  />
                </div>
              </div>
            </div>
            
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>

        <div className="flex space-x-3 p-6 border-t border-white/20 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">Отмена</button>
          <button onClick={handleSave} className="btn-primary flex-1">Сохранить</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
