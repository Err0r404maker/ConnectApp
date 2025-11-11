import React, { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export const ThemeTransition: React.FC = () => {
  const { isDark } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    
    // Добавляем класс для плавного перехода
    root.style.setProperty('--theme-transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
    
    // Применяем тему
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Добавляем анимацию перехода цветовой схемы
    const handleThemeTransition = () => {
      root.style.setProperty('color-scheme', isDark ? 'dark' : 'light');
    };
    
    // Небольшая задержка для плавности
    const timer = setTimeout(handleThemeTransition, 50);
    
    return () => clearTimeout(timer);
  }, [isDark]);

  return null;
};
