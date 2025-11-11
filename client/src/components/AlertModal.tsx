import React from 'react';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
  type = 'info'
}) => {
  if (!isOpen) return null;

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  const colors = {
    success: 'from-green-500 to-green-600',
    error: 'from-red-500 to-red-600',
    info: 'from-blue-500 to-blue-600'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
      <div className="glass rounded-3xl w-full max-w-md soft-shadow-lg animate-slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{icons[type]}</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{message}</p>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2.5 bg-gradient-to-r ${colors[type]} text-white rounded-2xl font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
