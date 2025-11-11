interface OnlineStatusProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const OnlineStatus = ({ isOnline, size = 'md' }: OnlineStatusProps) => {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={`${sizes[size]} rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'} ring-2 ring-white dark:ring-gray-800`} />
  );
};
