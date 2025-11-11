// Утилиты для красивых аватарок

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Фиолетовый
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Розовый
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Голубой
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Зеленый
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Оранжевый
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // Синий
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Пастельный
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // Персиковый
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Коралловый
  'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)', // Красно-голубой
];

const DARK_AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #8B7AB8 0%, #A89FCC 100%)', // Фиолетовый темный
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Синий темный
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Розовый темный
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Голубой темный
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Зеленый темный
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Оранжевый темный
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // Синий темный
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Пастельный темный
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // Персиковый темный
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Коралловый темный
];

/**
 * Генерирует градиент для аватарки на основе имени пользователя
 */
export const getAvatarGradient = (name: string, isDark: boolean = false): string => {
  if (!name) return isDark ? DARK_AVATAR_GRADIENTS[0] : AVATAR_GRADIENTS[0];
  
  // Используем сумму кодов символов для выбора градиента
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = isDark ? DARK_AVATAR_GRADIENTS : AVATAR_GRADIENTS;
  const index = hash % gradients.length;
  
  return gradients[index];
};

/**
 * Получает инициалы из имени
 */
export const getInitials = (firstName?: string, lastName?: string, username?: string): string => {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return '??';
};

/**
 * Генерирует стиль для аватарки
 */
export const getAvatarStyle = (name: string, isDark: boolean = false): React.CSSProperties => {
  return {
    background: getAvatarGradient(name, isDark),
    color: 'white',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    boxShadow: isDark 
      ? '0 2px 8px rgba(139, 122, 184, 0.4)' 
      : '0 2px 8px rgba(0, 122, 255, 0.3)',
  };
};

/**
 * Проверяет, является ли строка числом
 */
export const isNumericName = (name: string): boolean => {
  return /^\d+$/.test(name);
};

/**
 * Генерирует красивое имя из числового ID
 */
export const beautifyNumericName = (name: string): string => {
  if (!isNumericName(name)) return name;
  
  const emojis = ['🌟', '✨', '💫', '⭐', '🎯', '🎨', '🎭', '🎪', '🎬', '🎮'];
  const hash = parseInt(name) % emojis.length;
  
  return `${emojis[hash]} User ${name}`;
};
