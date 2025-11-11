import React, { useState } from 'react';

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (name: string, type: 'GROUP' | 'DIRECT', username?: string) => void;
}

const CreateChatModal: React.FC<CreateChatModalProps> = ({
  isOpen,
  onClose,
  onCreateChat
}) => {
  const [chatName, setChatName] = useState('');
  const [username, setUsername] = useState('');
  const [chatType, setChatType] = useState<'GROUP' | 'DIRECT'>('GROUP');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatName.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onCreateChat(chatName.trim(), chatType, username.trim() || undefined);
        setChatName('');
        setUsername('');
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const chatTypes = [
    {
      value: 'GROUP',
      label: 'Групповой чат',
      description: 'Для общения нескольких участников',
      icon: '👥',
      gradient: 'from-primary-400 to-primary-600',
      hoverColor: 'hover:bg-primary-50 has-[:checked]:bg-primary-50 has-[:checked]:border-primary-200'
    },
    {
      value: 'DIRECT',
      label: 'Личный чат',
      description: 'Приватная переписка с одним человеком',
      icon: '💬',
      gradient: 'from-success-400 to-success-600',
      hoverColor: 'hover:bg-success-50 has-[:checked]:bg-success-50 has-[:checked]:border-success-200'
    }
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-white/20">
          <div>
            <h3 className="text-3xl font-bold gradient-text-primary mb-2">
              Новый чат
            </h3>
            <p className="text-neutral-500 font-medium">Создайте групповой или личный чат для общения</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Chat Name */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-4">
              Название чата
            </label>
            <input
              type="text"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              className="input-elegant text-base font-medium"
              placeholder="Например: Общий чат, Проектная команда..."
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Username (only for GROUP) */}
          {chatType === 'GROUP' && (
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-4">
                Username группы (опционально)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="input-elegant text-base font-medium"
                placeholder="my_group_chat (без @)"
                disabled={isSubmitting}
                maxLength={32}
              />
              <p className="text-xs text-gray-500 mt-2">
                🔗 По этому username можно будет найти группу. Только буквы, цифры и _
              </p>
            </div>
          )}

          {/* Chat Type */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-4">
              Тип чата
            </label>
            <div className="space-y-4">
              {chatTypes.map((type, index) => (
                <label 
                  key={type.value}
                  className={`flex items-center p-5 rounded-2xl cursor-pointer border-2 border-transparent ${type.hoverColor} hover:scale-[1.02] hover:shadow-lg`}
                  style={{ 
                    animationDelay: `${index * 0.2}s`,
                    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  }}
                >
                  <input
                    type="radio"
                    name="chatType"
                    value={type.value}
                    checked={chatType === type.value}
                    onChange={(e) => setChatType(e.target.value as 'GROUP' | 'DIRECT')}
                    className="w-5 h-5 text-primary-600 mr-5"
                    disabled={isSubmitting}
                  />
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${type.gradient} rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300`}>
                      <span className="text-white text-xl">{type.icon}</span>
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900 text-lg block">{type.label}</span>
                      <p className="text-sm text-neutral-500 font-medium">{type.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!chatName.trim() || isSubmitting}
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner w-4 h-4 border-white"></div>
                  <span>Создание...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Создать чат</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChatModal;
