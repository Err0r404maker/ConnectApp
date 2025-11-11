import axios, { AxiosError } from 'axios';
import { AuthResponse } from '../types';

// Используем переменные окружения
const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api';

// Настройка axios
axios.defaults.withCredentials = false;
axios.defaults.timeout = 10000;

interface RegisterData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: 'STUDENT' | 'TEACHER';
}

class AuthService {
  private csrfToken: string | null = null;

  async getCsrfToken(): Promise<string> {
    // В dev режиме используем упрощенный токен, но не отключаем полностью
    if (import.meta.env.DEV as boolean) {
      if (!this.csrfToken) {
        try {
          const response = await axios.get(`${API_URL}/csrf-token`);
          this.csrfToken = response.data.csrfToken;
        } catch (error) {
          // В dev режиме используем fallback
          this.csrfToken = 'dev-fallback-token';
        }
      }
      return this.csrfToken;
    }
    
    if (this.csrfToken) return this.csrfToken;
    
    try {
      const response = await axios.get(`${API_URL}/csrf-token`);
      this.csrfToken = response.data.csrfToken;
      return this.csrfToken;
    } catch (error) {
      console.error('Ошибка получения CSRF токена');
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: email.trim().toLowerCase(),
        password
      }, { 
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }


  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('API_URL:', API_URL);
      console.log('DEV mode:', import.meta.env.DEV as boolean);
      
      const sanitizedData = {
        email: data.email.trim().toLowerCase(),
        username: data.username.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        password: data.password,
        role: data.role || 'STUDENT'
      };

      const headers: any = { 'Content-Type': 'application/json' };
      
      // Всегда добавляем CSRF токен
      const csrfToken = await this.getCsrfToken();
      headers['X-CSRF-Token'] = csrfToken;
      
      console.log('Sending request to:', `${API_URL}/auth/register`);
      console.log('Headers:', headers);
      
      const response = await axios.post(`${API_URL}/auth/register`, sanitizedData, {
        headers
      });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  private handleError(error: AxiosError) {
    // Минимальное логирование без чувствительных данных
    if (import.meta.env.DEV as boolean) {
      if (error.response) {
        console.error('Ошибка API:', error.response.status);
      } else if (error.request) {
        console.error('Ошибка сети');
      } else {
        console.error('Ошибка запроса');
      }
    }
    // В production не логируем ошибки
  }

  clearCsrfToken() {
    this.csrfToken = null;
  }
}

export const authService = new AuthService();
