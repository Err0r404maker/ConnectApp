const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

// Сообщения
export const messagesApi = {
  getMessages: async (chatId: string, page = 1, limit = 20) => {
    const response = await fetch(`${API_URL}/messages/${chatId}?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  sendMessage: async (data: { chatId: string; content: string; type?: string; replyToId?: string }) => {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },

  editMessage: async (messageId: string, content: string) => {
    const response = await fetch(`${API_URL}/messages/${messageId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content })
    });
    return response.json();
  }
};

// Чаты
export const chatsApi: any = {
  getChats: async () => {
    const response = await fetch(`${API_URL}/chats`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getChat: async (chatId: string) => {
    const response = await fetch(`${API_URL}/chats/${chatId}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  createChat: async (data: { name: string; type?: string; description?: string }) => {
    const response = await fetch(`${API_URL}/chats`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },

  addMember: async (chatId: string, userId: string) => {
    const response = await fetch(`${API_URL}/chats/${chatId}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId })
    });
    return response.json();
  },

  updateSettings: async (chatId: string, settings: {
    allowMedia?: boolean;
    allowFiles?: boolean;
    allowVoice?: boolean;
    isPrivate?: boolean;
  }) => {
    const response = await fetch(`${API_URL}/chats/${chatId}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return response.json();
  },

  updateMemberRole: async (chatId: string, memberId: string, role: string) => {
    const response = await fetch(`${API_URL}/chats/${chatId}/members/${memberId}/role`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role })
    });
    return response.json();
  }
};

// Пользователи
export const usersApi = {
  getMe: async () => {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  searchUsers: async (query: string) => {
    const response = await fetch(`${API_URL}/users?search=${query}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  updateProfile: async (data: { firstName: string; lastName: string; avatar?: string }) => {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_URL}/users/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });
    return response.json();
  }
};

// Инвайты
export const invitesApi = {
  createInvite: async (chatId: string, expiresIn = 86400) => {
    const response = await fetch(`${API_URL}/invites`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ chatId, expiresIn })
    });
    return response.json();
  },

  joinByCode: async (code: string) => {
    const response = await fetch(`${API_URL}/invites/join/${code}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getChatInvites: async (chatId: string) => {
    const response = await fetch(`${API_URL}/invites/chat/${chatId}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  deleteInvite: async (inviteId: string) => {
    const response = await fetch(`${API_URL}/invites/${inviteId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

// Дополнительные методы для чатов
export const chatsApiExtended = {
  ...chatsApi,
  
  deleteChat: async (chatId: string) => {
    const response = await fetch(`${API_URL}/chats/${chatId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

// Утилиты для файлов
export const fileUtils = {
  convertToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
