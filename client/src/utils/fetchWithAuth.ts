import { useAuthStore } from '../store/authStore';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { accessToken, refreshAccessToken, logout } = useAuthStore.getState();
  
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`
  };

  let response = await fetch(url, { ...options, headers });

  // Если 401, пробуем обновить токен
  if (response.status === 401) {
    try {
      await refreshAccessToken();
      const newToken = useAuthStore.getState().accessToken;
      
      // Повторяем запрос с новым токеном
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`
        }
      });
    } catch (error) {
      logout();
      throw new Error('Сессия истекла. Войдите заново.');
    }
  }

  return response;
}
