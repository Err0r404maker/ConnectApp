import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type ThemeMode = 'light' | 'dark' | 'auto';

export const ThemeToggle: React.FC = () => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode') as ThemeMode;
    return saved || 'auto';
  });

  const getAutoTheme = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? 'light' : 'dark';
  };

  const applyTheme = (theme: 'light' | 'dark') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    }
  };

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    const theme = mode === 'auto' ? getAutoTheme() : mode;
    applyTheme(theme);

    if (mode === 'auto') {
      const interval = setInterval(() => {
        applyTheme(getAutoTheme());
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  useEffect(() => {
    const handleThemeChange = (e: CustomEvent) => {
      setMode(e.detail.theme);
    };
    window.addEventListener('themeChanged' as any, handleThemeChange);
    return () => window.removeEventListener('themeChanged' as any, handleThemeChange);
  }, []);

  const cycleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light';
    setMode(newMode);
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newMode } }));
  };

  const currentTheme = mode === 'auto' ? getAutoTheme() : mode;

  return (
    <motion.button
      onClick={cycleTheme}
      className="btn-ghost p-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={mode === 'auto' ? 'Авто тема' : mode === 'dark' ? 'Темная тема' : 'Светлая тема'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: currentTheme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {currentTheme === 'dark' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
        {mode === 'auto' && (
          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}
      </motion.div>
    </motion.button>
  );
};
