import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE';
  fileUrl?: string;
  fileName?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface Chat {
  id: string;
  name: string;
  type: 'GROUP' | 'DIRECT';
  avatar?: string;
  lastMessage?: Message;
  unreadCount: number;
}

interface TypingUser {
  userId: string;
  userName: string;
  chatId: string;
}

interface ChatStore {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChat: string | null;
  typingUsers: TypingUser[];
  searchQuery: string;
  
  // Actions
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  setActiveChat: (chatId: string) => void;
  
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  
  addTypingUser: (user: TypingUser) => void;
  removeTypingUser: (userId: string, chatId: string) => void;
  
  setSearchQuery: (query: string) => void;
  
  // Getters
  getFilteredMessages: (chatId: string) => Message[];
  getUnreadCount: () => number;
}

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
    chats: [],
    messages: {},
    activeChat: null,
    typingUsers: [],
    searchQuery: '',

    setChats: (chats) => set({ chats }),
    
    addChat: (chat) => set((state) => ({
      chats: [...state.chats, chat]
    })),
    
    updateChat: (chatId, updates) => set((state) => ({
      chats: state.chats.map(chat => 
        chat.id === chatId ? { ...chat, ...updates } : chat
      )
    })),
    
    setActiveChat: (chatId) => set({ activeChat: chatId }),
    
    addMessage: (chatId, message) => set((state) => {
      const chatMessages = state.messages[chatId] || [];
      const newMessages = {
        ...state.messages,
        [chatId]: [...chatMessages, message]
      };
      
      // Обновляем последнее сообщение в чате
      const updatedChats = state.chats.map(chat => 
        chat.id === chatId 
          ? { ...chat, lastMessage: message, unreadCount: chat.id === state.activeChat ? 0 : chat.unreadCount + 1 }
          : chat
      );
      
      return {
        messages: newMessages,
        chats: updatedChats
      };
    }),
    
    updateMessage: (chatId, messageId, updates) => set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map(msg =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        )
      }
    })),
    
    deleteMessage: (chatId, messageId) => set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).filter(msg => msg.id !== messageId)
      }
    })),
    
    setMessages: (chatId, messages) => set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: messages
      }
    })),
    
    addTypingUser: (user) => set((state) => {
      const exists = state.typingUsers.some(u => u.userId === user.userId && u.chatId === user.chatId);
      if (exists) return state;
      
      return {
        typingUsers: [...state.typingUsers, user]
      };
    }),
    
    removeTypingUser: (userId, chatId) => set((state) => ({
      typingUsers: state.typingUsers.filter(u => !(u.userId === userId && u.chatId === chatId))
    })),
    
    setSearchQuery: (query) => set({ searchQuery: query }),
    
    getFilteredMessages: (chatId) => {
      const state = get();
      const messages = state.messages[chatId] || [];
      
      if (!state.searchQuery) return messages;
      
      return messages.filter(message =>
        message.content.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        `${message.firstName} ${message.lastName}`.toLowerCase().includes(state.searchQuery.toLowerCase())
      );
    },
    
    getUnreadCount: () => {
      const state = get();
      return state.chats.reduce((total, chat) => total + chat.unreadCount, 0);
    }
  }))
);
