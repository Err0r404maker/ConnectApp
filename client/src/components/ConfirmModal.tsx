import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    warning: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
    info: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onCancel}>
      <div className="glass rounded-3xl w-full max-w-md soft-shadow-lg animate-slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 glass hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-medium transition-all duration-200 hover:scale-105"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 bg-gradient-to-r ${colors[type]} text-white rounded-2xl font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
