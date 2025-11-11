import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  isDark: boolean;
  themeMode: 'light' | 'dark' | 'auto';
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
  initTheme: () => void;
}

const applyTheme = (isDark: boolean) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

const checkAutoTheme = () => {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 7; // Темная тема с 20:00 до 7:00
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      isDark: false,
      themeMode: 'auto',
      toggleTheme: () => {
        set((state) => {
          const newIsDark = !state.isDark;
          applyTheme(newIsDark);
          return { isDark: newIsDark, themeMode: newIsDark ? 'dark' : 'light' };
        });
      },
      setThemeMode: (mode: 'light' | 'dark' | 'auto') => {
        set(() => {
          let isDark = false;
          if (mode === 'dark') {
            isDark = true;
          } else if (mode === 'auto') {
            isDark = checkAutoTheme();
          }
          applyTheme(isDark);
          return { isDark, themeMode: mode };
        });
      },
      initTheme: () => {
        const { themeMode } = get();
        let isDark = false;
        if (themeMode === 'dark') {
          isDark = true;
        } else if (themeMode === 'auto') {
          isDark = checkAutoTheme();
        }
        applyTheme(isDark);
        set({ isDark });
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

// Инициализация темы при загрузке
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('theme-storage');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      const mode = state.themeMode || 'auto';
      let isDark = state.isDark || false;
      if (mode === 'auto') {
        isDark = checkAutoTheme();
      } else if (mode === 'dark') {
        isDark = true;
      }
      applyTheme(isDark);
    } catch (e) {
      applyTheme(checkAutoTheme());
    }
  } else {
    applyTheme(checkAutoTheme());
  }
  
  // Проверяем каждую минуту для авто-режима
  setInterval(() => {
    const stored = localStorage.getItem('theme-storage');
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state.themeMode === 'auto') {
          const isDark = checkAutoTheme();
          if (isDark !== state.isDark) {
            applyTheme(isDark);
            useThemeStore.setState({ isDark });
          }
        }
      } catch (e) {}
    }
  }, 60000); // Каждую минуту
}
