export const setupKeyboardShortcuts = (handlers: {
  onSearch?: () => void;
  onNewChat?: () => void;
  onSettings?: () => void;
  onEscape?: () => void;
}) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl/Cmd + K - Поиск
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      handlers.onSearch?.();
    }
    
    // Ctrl/Cmd + N - Новый чат
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      handlers.onNewChat?.();
    }
    
    // Ctrl/Cmd + , - Настройки
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      handlers.onSettings?.();
    }
    
    // Escape - Закрыть модалки
    if (e.key === 'Escape') {
      handlers.onEscape?.();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
};
