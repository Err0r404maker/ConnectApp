import React, { useState } from 'react';

interface ChatPermissions {
  allowMedia: boolean;
  allowFiles: boolean;
  allowVoice: boolean;
  isPrivate: boolean;
}

interface Member {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'MEMBER' | 'MODERATOR' | 'ADMIN';
}

interface AdvancedChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  permissions: ChatPermissions;
  members: Member[];
  onUpdatePermissions: (permissions: ChatPermissions) => Promise<void>;
  onUpdateMemberRole: (userId: string, role: string) => Promise<void>;
}

export const AdvancedChatSettings: React.FC<AdvancedChatSettingsProps> = ({
  isOpen,
  onClose,
  permissions,
  members,
  onUpdatePermissions,
  onUpdateMemberRole
}) => {
  const [localPermissions, setLocalPermissions] = useState(permissions);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onUpdatePermissions(localPermissions);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsSubmitting(true);
    try {
      await onUpdateMemberRole(userId, newRole);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Расширенные настройки</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Разрешения */}
          <div>
            <h4 className="font-semibold mb-4">Разрешения чата</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span>Разрешить изображения</span>
                <input
                  type="checkbox"
                  checked={localPermissions.allowMedia}
                  onChange={(e) => setLocalPermissions({ ...localPermissions, allowMedia: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span>Разрешить файлы</span>
                <input
                  type="checkbox"
                  checked={localPermissions.allowFiles}
                  onChange={(e) => setLocalPermissions({ ...localPermissions, allowFiles: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span>Разрешить голосовые</span>
                <input
                  type="checkbox"
                  checked={localPermissions.allowVoice}
                  onChange={(e) => setLocalPermissions({ ...localPermissions, allowVoice: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span>Приватный чат</span>
                <input
                  type="checkbox"
                  checked={localPermissions.isPrivate}
                  onChange={(e) => setLocalPermissions({ ...localPermissions, isPrivate: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>
            </div>
          </div>

          {/* Участники и роли */}
          <div>
            <h4 className="font-semibold mb-4">Участники ({members.length})</h4>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">{member.firstName} {member.lastName}</p>
                    <p className="text-sm text-gray-500">@{member.username}</p>
                  </div>
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                    disabled={isSubmitting}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="MEMBER">Участник</option>
                    <option value="MODERATOR">Модератор</option>
                    <option value="ADMIN">Админ</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};
