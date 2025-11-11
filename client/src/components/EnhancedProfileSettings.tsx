import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EnhancedProfileSettings = ({ isOpen, onClose }: Props) => {
  const { user, accessToken } = useAuthStore();
  const settings = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'interface' | 'audio'>('profile');
  
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(settings.theme);
  const [colorScheme, setColorScheme] = useState(settings.colorScheme);
  const [fontSize, setFontSize] = useState(settings.fontSize);
  const [animations, setAnimations] = useState(settings.animations);
  
  const [musicEnabled, setMusicEnabled] = useState(settings.musicEnabled);
  const [playlist, setPlaylist] = useState(settings.playlist);
  const [volume, setVolume] = useState(settings.volume);
  const [notificationSounds, setNotificationSounds] = useState(settings.notificationSounds);
  const [savedAudio, setSavedAudio] = useState<any[]>([]);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || '');
      
      // Загружаем сохраненные настройки
      // Загружаем из store
      setTheme(settings.theme);
      setColorScheme(settings.colorScheme);
      setFontSize(settings.fontSize);
      setAnimations(settings.animations);
      setMusicEnabled(settings.musicEnabled);
      setPlaylist(settings.playlist);
      setVolume(settings.volume);
      setNotificationSounds(settings.notificationSounds);
      
      // Загружаем сохраненные аудио
      loadSavedAudio();
      
      // Если есть сохраненные на сервере, перезаписываем
      if (user.settings) {
        const s = typeof user.settings === 'string' ? JSON.parse(user.settings) : user.settings;
        if (s.theme) setTheme(s.theme);
        if (s.colorScheme) setColorScheme(s.colorScheme);
        if (s.fontSize) setFontSize(s.fontSize);
        if (s.animations !== undefined) setAnimations(s.animations);
        if (s.musicEnabled !== undefined) setMusicEnabled(s.musicEnabled);
        if (s.playlist) setPlaylist(s.playlist);
        if (s.volume !== undefined) setVolume(s.volume);
        if (s.notificationSounds) setNotificationSounds(s.notificationSounds);
      }
    }
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, user]);
  
  const loadSavedAudio = async () => {
    if (!accessToken) return;
    try {
      const response = await fetch('http://localhost:3001/api/saved-audio', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSavedAudio(data);
      }
    } catch (error) {
      console.error('Error loading saved audio:', error);
    }
  };
  
  const handleDeleteAudio = async (messageId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/saved-audio/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        loadSavedAudio();
      }
    } catch (error) {
      console.error('Error deleting audio:', error);
    }
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      if (newPassword && newPassword !== confirmPassword) {
        setMessage('Пароли не совпадают');
        setSaving(false);
        return;
      }
      
      let response = await fetch('http://localhost:3001/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          email,
          avatar,
          bio,
          currentPassword: newPassword ? currentPassword : undefined,
          newPassword: newPassword || undefined,
          settings: {
            theme,
            colorScheme,
            fontSize,
            animations,
            musicEnabled,
            playlist,
            volume,
            notificationSounds
          }
        })
      });
      
      if (response.status === 401) {
        await useAuthStore.getState().refreshAccessToken();
        const newToken = useAuthStore.getState().accessToken;
        response = await fetch('http://localhost:3001/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`
          },
          body: JSON.stringify({
            firstName,
            lastName,
            username,
            email,
            avatar,
            bio,
            currentPassword: newPassword ? currentPassword : undefined,
            newPassword: newPassword || undefined,
            settings: {
              theme,
              colorScheme,
              fontSize,
              animations,
              musicEnabled,
              playlist,
              volume,
              notificationSounds
            }
          })
        });
      }
      
      if (!response.ok) {
        const error = await response.json();
        setMessage(error.error || 'Ошибка сохранения');
        setSaving(false);
        return;
      }
      
      const updatedUser = await response.json();
      useAuthStore.setState({ user: updatedUser });
      
      // Применяем настройки в store
      settings.setTheme(theme);
      settings.setColorScheme(colorScheme);
      settings.setFontSize(fontSize);
      settings.setAnimations(animations);
      settings.setMusicEnabled(musicEnabled);
      settings.setPlaylist(playlist);
      settings.setVolume(volume);
      Object.entries(notificationSounds).forEach(([key, value]) => {
        settings.setNotificationSound(key as any, value);
      });
      
      // Не меняем тему автоматически - только при явном сохранении
      
      setMessage('✅ Сохранено успешно!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setMessage('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile', label: 'Личные настройки', icon: '👤' },
    { id: 'interface', label: 'Интерфейс', icon: '🎨' },
    { id: 'audio', label: 'Аудио', icon: '🎵' }
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300" onClick={onClose} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl transform transition-all duration-300 scale-100" onClick={e => e.stopPropagation()}>
          
          <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-8 rounded-t-3xl">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 text-white hover:scale-110">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    {firstName[0]}{lastName[0]}
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200">
                  📷
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              
              <div className="text-white">
                <h2 className="text-3xl font-bold">{firstName} {lastName}</h2>
                <p className="text-white/80 text-lg">@{username}</p>
              </div>
            </div>
          </div>

          <div className="flex px-8 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all duration-200 rounded-t-2xl ${
                  activeTab === tab.id 
                    ? 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-blue-600 dark:text-blue-400 shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/40 dark:hover:bg-gray-800/40'
                }`}
              >
                <span className="text-2xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <span>📧</span> Основная информация
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Имя</label>
                      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all duration-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Фамилия</label>
                      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all duration-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Username</label>
                      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all duration-200 font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Email</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all duration-200" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <span>💬</span> О себе
                  </h3>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Расскажите о себе..." className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all duration-200 resize-none" rows={4} />
                </div>

                <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <span>🔒</span> Изменить пароль
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Текущий пароль</label>
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Введите текущий пароль" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all duration-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Новый пароль</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Минимум 6 символов" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all duration-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Подтвердите пароль</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Повторите новый пароль" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all duration-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'interface' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <span>🌓</span> Тема оформления
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'light', label: 'Светлая', icon: '☀️', desc: 'Всегда светлая' },
                      { id: 'dark', label: 'Темная', icon: '🌙', desc: 'Всегда темная' },
                      { id: 'auto', label: 'Авто', icon: '🌗', desc: '6:00-18:00 светлая' }
                    ].map((t) => (
                      <button key={t.id} onClick={() => setTheme(t.id as any)} className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${theme === t.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                        <div className="text-3xl mb-2">{t.icon}</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{t.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <span>🎨</span> Цветовая палитра
                  </h3>
                  <div className="flex gap-3">
                    {[
                      { id: 'blue', color: 'bg-blue-500' },
                      { id: 'purple', color: 'bg-purple-500' },
                      { id: 'green', color: 'bg-green-500' },
                      { id: 'pink', color: 'bg-pink-500' },
                      { id: 'orange', color: 'bg-orange-500' }
                    ].map((scheme) => (
                      <button key={scheme.id} onClick={() => setColorScheme(scheme.id)} className={`w-12 h-12 rounded-full ${scheme.color} transition-all duration-200 hover:scale-125 shadow-lg ${colorScheme === scheme.id ? 'ring-4 ring-offset-2 ring-gray-400' : ''}`} />
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <span>📏</span> Размер шрифта
                  </h3>
                  <div className="flex items-center gap-4">
                    <input type="range" min="12" max="20" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="flex-1" />
                    <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">{fontSize}px</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <span>✨</span> Дополнительно
                  </h3>
                  <label className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                    <span className="font-semibold text-gray-900 dark:text-white">Анимации</span>
                    <input type="checkbox" checked={animations} onChange={(e) => setAnimations(e.target.checked)} className="w-6 h-6 rounded" />
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <span>🎵</span> Сохраненные аудио ({savedAudio.length})
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">MP3 файлы, которые вы сохранили из чатов</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {savedAudio.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        <p>Пока нет сохраненных аудио</p>
                        <p className="text-xs mt-2">Сохраняйте MP3 файлы из чатов, нажав кнопку "Сохранить"</p>
                      </div>
                    ) : (
                      savedAudio.map((audio) => (
                        <div key={audio.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{audio.fileName || 'Аудио файл'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Сохранено {new Date(audio.savedAt).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={audio.fileUrl}
                              download={audio.fileName}
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              title="Скачать"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                            <button
                              onClick={() => handleDeleteAudio(audio.messageId)}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              title="Удалить"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            {message && (
              <div className={`mb-4 p-3 rounded-xl text-center font-semibold ${message.includes('✅') ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                {message}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} disabled={saving} className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                Отмена
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
