import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { User, AuthResponse } from '../types';
import { authService } from '../services/authService';

// Debounce функция для оптимизации
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface RegisterData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: 'STUDENT' | 'TEACHER';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(email, password);
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          throw new Error('No refresh token');
        }

        try {
          const response = await authService.refreshToken(refreshToken);
          set({ accessToken: response.accessToken });
        } catch (error) {
          get().logout();
          authService.clearCsrfToken(); // Очищаем CSRF токен
          throw error;
        }
      },

      updateUser: debounce((userData: Partial<User>) => {
        const { user } = get();
        if (user && userData && typeof userData === 'object') {
          // Валидация данных
          const validatedData: Partial<User> = {};
          
          if (userData.firstName && typeof userData.firstName === 'string' && userData.firstName.trim().length > 0) {
            validatedData.firstName = userData.firstName.trim();
          }
          if (userData.lastName && typeof userData.lastName === 'string' && userData.lastName.trim().length > 0) {
            validatedData.lastName = userData.lastName.trim();
          }
          if (userData.email && typeof userData.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
            validatedData.email = userData.email.toLowerCase().trim();
          }
          if (userData.username && typeof userData.username === 'string' && userData.username.trim().length > 0) {
            validatedData.username = userData.username.trim();
          }
          if (userData.role && ['STUDENT', 'TEACHER', 'ADMIN'].includes(userData.role)) {
            validatedData.role = userData.role;
          }
          
          if (Object.keys(validatedData).length > 0) {
            set({ user: { ...user, ...validatedData } });
          }
        }
      }, 100), // Debounce 100ms

      setUser: (user: User) => {
        set({ user });
      }
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Миграция с версии 0 на 1
            return persistedState;
          }
          return persistedState;
        }
      }
    )
  )
);

// Автоматическое обновление токена
let refreshTimer: NodeJS.Timeout;

useAuthStore.subscribe(
  (state) => state.accessToken,
  (accessToken) => {
    clearTimeout(refreshTimer);
    if (accessToken) {
      // Обновляем токен за 2 минуты до истечения (13 мин)
      refreshTimer = setTimeout(() => {
        useAuthStore.getState().refreshAccessToken().catch(() => {
          // Ошибка обновления уже обработана в refreshAccessToken
        });
      }, 13 * 60 * 1000);
    }
  }
);
