import React from 'react';
import { getAvatarStyle, getInitials } from '../utils/avatarUtils';
import { useThemeStore } from '../store/themeStore';

interface AvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  username?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  showOnline?: boolean;
  isOnline?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  firstName,
  lastName,
  username,
  size = 'md',
  className = '',
  onClick,
  showOnline = false,
  isOnline = false,
}) => {
  const { isDark } = useThemeStore();
  const initials = getInitials(firstName, lastName, username);
  const name = firstName || lastName || username || 'User';
  const avatarStyle = getAvatarStyle(name, isDark);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold cursor-pointer transition-all duration-300 hover:scale-105 ${
          onClick ? 'hover:shadow-xl' : ''
        }`}
        style={src ? {} : avatarStyle}
        onClick={onClick}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              // Если изображение не загрузилось, показываем инициалы
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextSibling) {
                (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <span
          className={`${src ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
          style={{ display: src ? 'none' : 'flex' }}
        >
          {initials}
        </span>
      </div>
      
      {showOnline && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
          style={{
            boxShadow: isOnline ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none',
          }}
        />
      )}
    </div>
  );
};
