export const timeAgo = (date: string | Date | null | undefined): string => {
  if (!date) return 'никогда';
  
  const now = new Date();
  const past = new Date(date);
  
  // Проверяем корректность даты
  if (isNaN(past.getTime())) return 'никогда';
  
  const diffMs = now.getTime() - past.getTime();
  
  // Если дата в будущем или очень старая (более года)
  if (diffMs < 0 || diffMs > 31536000000) return 'давно';
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;
  
  return past.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};
