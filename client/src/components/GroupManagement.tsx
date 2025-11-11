import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface Member {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  permissions?: {
    canDeleteMessages: boolean;
    canBanUsers: boolean;
    canInviteUsers: boolean;
    canPinMessages: boolean;
    canChangeInfo: boolean;
  };
  joinedAt: string;
}

interface GroupManagementProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string;
  userRole: string;
}

const GroupManagement: React.FC<GroupManagementProps> = ({
  isOpen,
  onClose,
  chatId,
  chatName,
  userRole
}) => {
  const { accessToken } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && chatId) {
      loadMembers();
    }
  }, [isOpen, chatId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/chats/${chatId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
    }
    setLoading(false);
  };

  const updateMemberRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/chats/${chatId}/members/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) {
        loadMembers();
      }
    } catch (error) {
      console.error('Ошибка изменения роли:', error);
    }
  };

  const updateMemberPermissions = async (userId: string, permissions: any) => {
    try {
      const response = await fetch(`http://localhost:3001/api/chats/${chatId}/members/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ permissions })
      });
      if (response.ok) {
        loadMembers();
      }
    } catch (error) {
      console.error('Ошибка изменения прав:', error);
    }
  };

  const removeMember = async (userId: string) => {
    if (confirm('Удалить участника из группы?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/chats/${chatId}/members/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          loadMembers();
          setSelectedMember(null);
        }
      } catch (error) {
        console.error('Ошибка удаления участника:', error);
      }
    }
  };

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'OWNER': return 'role-owner';
      case 'ADMIN': return 'role-admin';
      case 'MODERATOR': return 'role-moderator';
      default: return 'role-member';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'OWNER': return 'Владелец';
      case 'ADMIN': return 'Администратор';
      case 'MODERATOR': return 'Модератор';
      default: return 'Участник';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return '👑';
      case 'ADMIN': return '⚡';
      case 'MODERATOR': return '🛡️';
      default: return '👤';
    }
  };

  const canManageRole = (targetRole: string) => {
    if (userRole === 'OWNER') return true;
    if (userRole === 'ADMIN' && targetRole !== 'OWNER') return true;
    return false;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`;
  };

  const getAvatarColor = (initials: string) => {
    const colors = [
      'avatar-tg-red', 'avatar-tg-orange', 'avatar-tg-yellow', 'avatar-tg-green',
      'avatar-tg-cyan', 'avatar-tg-blue', 'avatar-tg-purple', 'avatar-tg-pink'
    ];
    const hash = initials.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-white/20">
          <div>
            <h2 className="text-3xl font-bold gradient-text-primary mb-2">
              Управление группой
            </h2>
            <div className="flex items-center space-x-3">
              <span className="text-lg font-semibold text-neutral-700">{chatName}</span>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-bold">
                {members.length} участников
              </span>
            </div>
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

        <div className="flex flex-1 overflow-hidden">
          {/* Members List */}
          <div className="w-1/2 border-r border-white/20 overflow-y-auto scrollbar-elegant">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-neutral-900">Участники</h3>
                {loading && <div className="spinner"></div>}
              </div>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="spinner mb-4"></div>
                  <p className="text-neutral-500 font-medium">Загрузка участников...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member, index) => (
                    <div
                      key={member.userId}
                      onClick={() => setSelectedMember(member)}
                      className={`group p-4 rounded-2xl cursor-pointer border-2 ${
                        selectedMember?.userId === member.userId
                          ? 'glass-primary border-primary-200 shadow-glow-primary transform scale-[1.02]'
                          : 'glass-secondary border-transparent hover:border-primary-100 hover:shadow-md hover:scale-[1.01]'
                      }`}
                      style={{ 
                        animationDelay: `${index * 0.1}s`,
                        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                      }}
                    >

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className={`avatar-tg w-12 h-12 ${getAvatarColor(getInitials(member.firstName, member.lastName))}`}>
                              <span className="text-sm font-bold">
                                {getInitials(member.firstName, member.lastName)}
                              </span>
                            </div>
                            <div className="absolute -top-1 -right-1 text-lg">
                              {getRoleIcon(member.role)}
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-sm text-neutral-500 font-medium">@{member.username}</p>
                          </div>
                        </div>
                        <span className={`role-badge ${getRoleClass(member.role)}`}>
                          {getRoleName(member.role)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Member Details */}
          <div className="w-1/2 overflow-y-auto scrollbar-elegant">
            {selectedMember ? (
              <div className="p-6">
                {/* Member Profile */}
                <div className="text-center mb-8">
                  <div className="relative inline-block">
                    <div className={`avatar-tg w-24 h-24 mx-auto mb-4 ${getAvatarColor(getInitials(selectedMember.firstName, selectedMember.lastName))}`}>
                      <span className="text-2xl font-bold">
                        {getInitials(selectedMember.firstName, selectedMember.lastName)}
                      </span>
                    </div>
                    <div className="absolute -top-2 -right-2 text-2xl">
                      {getRoleIcon(selectedMember.role)}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </h3>
                  <p className="text-neutral-500 mb-2 font-medium">@{selectedMember.username}</p>
                  <span className={`role-badge ${getRoleClass(selectedMember.role)} text-sm`}>
                    {getRoleName(selectedMember.role)}
                  </span>
                  <p className="text-sm text-neutral-400 mt-3 font-medium">
                    В группе с {new Date(selectedMember.joinedAt).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {canManageRole(selectedMember.role) && (
                  <>
                    {/* Role Management */}
                    <div className="mb-8">
                      <h4 className="text-lg font-bold text-neutral-900 mb-4">Роль в группе</h4>
                      <div className="space-y-3">
                        {['MEMBER', 'MODERATOR', 'ADMIN'].map((role) => (
                          <label key={role} className={`flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2 ${
                            selectedMember.role === role 
                              ? 'glass-primary border-primary-200' 
                              : 'glass-secondary border-transparent hover:border-primary-100'
                          }`}>
                            <input
                              type="radio"
                              name="role"
                              checked={selectedMember.role === role}
                              onChange={() => updateMemberRole(selectedMember.userId, role)}
                              className="w-4 h-4 text-primary-600 mr-4"
                            />
                            <div className="flex items-center space-x-3">
                              <span className="text-xl">{getRoleIcon(role)}</span>
                              <div>
                                <span className="font-bold text-neutral-900">{getRoleName(role)}</span>
                                <p className="text-sm text-neutral-500">
                                  {role === 'ADMIN' && 'Полные права управления группой'}
                                  {role === 'MODERATOR' && 'Модерация сообщений и участников'}
                                  {role === 'MEMBER' && 'Базовые права участника'}
                                </p>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Permissions */}
                    {selectedMember.role !== 'MEMBER' && (
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-neutral-900">Права доступа</h4>
                          <button
                            onClick={() => setShowPermissions(!showPermissions)}
                            className="btn-secondary px-4 py-2 text-sm"
                          >
                            {showPermissions ? 'Скрыть' : 'Настроить'}
                          </button>
                        </div>
                        
                        {showPermissions && (
                          <div className="glass-secondary p-6 rounded-2xl border border-primary-100">
                            <div className="space-y-4">
                              {[
                                { key: 'canDeleteMessages', label: 'Удалять сообщения', icon: '🗑️', desc: 'Удаление сообщений других участников' },
                                { key: 'canBanUsers', label: 'Исключать пользователей', icon: '🚫', desc: 'Удаление участников из группы' },
                                { key: 'canInviteUsers', label: 'Приглашать пользователей', icon: '➕', desc: 'Добавление новых участников' },
                                { key: 'canPinMessages', label: 'Закреплять сообщения', icon: '📌', desc: 'Закрепление важных сообщений' },
                                { key: 'canChangeInfo', label: 'Изменять информацию', icon: '⚙️', desc: 'Редактирование названия и описания' }
                              ].map((perm) => (
                                <label key={perm.key} className="flex items-start p-3 rounded-xl hover:bg-white/50 cursor-pointer transition-all">
                                  <input
                                    type="checkbox"
                                    checked={selectedMember.permissions?.[perm.key as keyof typeof selectedMember.permissions] || false}
                                    onChange={(e) => {
                                      const newPermissions = {
                                        ...selectedMember.permissions,
                                        [perm.key]: e.target.checked
                                      };
                                      updateMemberPermissions(selectedMember.userId, newPermissions);
                                    }}
                                    className="w-4 h-4 text-primary-600 mt-1 mr-4"
                                  />
                                  <div className="flex items-start space-x-3">
                                    <span className="text-xl">{perm.icon}</span>
                                    <div>
                                      <span className="font-bold text-neutral-900 block">{perm.label}</span>
                                      <span className="text-sm text-neutral-500">{perm.desc}</span>
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                      <button
                        onClick={() => removeMember(selectedMember.userId)}
                        className="w-full px-6 py-4 bg-gradient-to-r from-error-500 to-error-600 text-white rounded-2xl hover:shadow-lg transition-all duration-200 hover:scale-105 font-bold flex items-center justify-center space-x-2"
                      >
                        <span>🚫</span>
                        <span>Удалить из группы</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-32 h-32 glass-secondary rounded-3xl flex items-center justify-center mb-8">
                  <svg className="w-16 h-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-neutral-700 mb-3">Выберите участника</h3>
                <p className="text-neutral-500 font-medium">Нажмите на участника слева, чтобы управлять его правами и ролью в группе</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupManagement;
