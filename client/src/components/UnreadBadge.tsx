interface UnreadBadgeProps {
  count: number;
  max?: number;
}

export const UnreadBadge = ({ count, max = 99 }: UnreadBadgeProps) => {
  if (count === 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
      <span className="text-white text-xs font-bold">{displayCount}</span>
    </div>
  );
};
