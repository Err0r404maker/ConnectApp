import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationSettings {
  messageSent: boolean;
  messageReceived: boolean;
  reactions: boolean;
  notifications: boolean;
}

interface SettingsState {
  wallpaper: string | null;
  wallpaperOpacity: number;
  theme: 'light' | 'dark' | 'auto';
  colorScheme: string;
  fontSize: number;
  animations: boolean;
  musicEnabled: boolean;
  playlist: string;
  volume: number;
  notificationSounds: NotificationSettings;
  setWallpaper: (url: string | null) => void;
  setWallpaperOpacity: (opacity: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setColorScheme: (scheme: string) => void;
  setFontSize: (size: number) => void;
  setAnimations: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setPlaylist: (playlist: string) => void;
  setVolume: (volume: number) => void;
  setNotificationSound: (type: keyof NotificationSettings, enabled: boolean) => void;
  applySettings: () => void;
}

const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
  if (typeof document === 'undefined') return;
  
  let isDark = false;
  if (theme === 'auto') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDark = theme === 'dark';
  }
  
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const applyColorScheme = (scheme: string) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-color-scheme', scheme);
  
  // Применяем цвета к элементам с классами bg-blue-500, text-blue-500 и т.д.
  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    purple: '#a855f7',
    green: '#10b981',
    pink: '#ec4899',
    orange: '#f97316'
  };
  
  const color = colorMap[scheme] || colorMap.blue;
  document.documentElement.style.setProperty('--color-primary', color);
};

const applyFontSize = (size: number) => {
  if (typeof document === 'undefined') return;
  document.documentElement.style.fontSize = `${size}px`;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      wallpaper: null,
      wallpaperOpacity: 0.3,
      theme: 'auto',
      colorScheme: 'blue',
      fontSize: 16,
      animations: true,
      musicEnabled: false,
      playlist: 'lofi',
      volume: 70,
      notificationSounds: {
        messageSent: true,
        messageReceived: true,
        reactions: true,
        notifications: true
      },
      setWallpaper: (url) => set({ wallpaper: url }),
      setWallpaperOpacity: (opacity) => set({ wallpaperOpacity: opacity }),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setColorScheme: (scheme) => {
        applyColorScheme(scheme);
        set({ colorScheme: scheme });
      },
      setFontSize: (size) => {
        applyFontSize(size);
        set({ fontSize: size });
      },
      setAnimations: (enabled) => set({ animations: enabled }),
      setMusicEnabled: (enabled) => set({ musicEnabled: enabled }),
      setPlaylist: (playlist) => set({ playlist }),
      setVolume: (volume) => set({ volume }),
      setNotificationSound: (type, enabled) => set((state) => ({
        notificationSounds: { ...state.notificationSounds, [type]: enabled }
      })),
      applySettings: () => {
        const state = get();
        applyTheme(state.theme);
        applyColorScheme(state.colorScheme);
        applyFontSize(state.fontSize);
      }
    }),
    {
      name: 'settings-storage'
    }
  )
);

// Применяем настройки при загрузке
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('settings-storage');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state.theme) applyTheme(state.theme);
      if (state.colorScheme) applyColorScheme(state.colorScheme);
      if (state.fontSize) applyFontSize(state.fontSize);
    } catch (e) {
      console.error('Error applying settings:', e);
    }
  }
}
