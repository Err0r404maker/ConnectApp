import { io, Socket } from 'socket.io-client';
import { Message, TypingUser } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  connect(token: string): Socket | null {
    if (!token || typeof token !== 'string') {
      console.warn('Токен отсутствует или неверного типа');
      return null;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    // Улучшенная валидация JWT токена
    if (!this.isValidJWT(token)) {
      console.error('Недействительный формат токена');
      return null;
    }

    try {
      const serverUrl = (import.meta.env.VITE_WS_URL as string) || 'http://localhost:3001';

      this.socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        this.reconnectAttempts = 0;
        // Сохраняем socket в window для доступа из других компонентов
        (window as any).socket = this.socket;
      });

      this.socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
          this.socket?.disconnect();
        }
      });

      this.socket.on('connect_error', () => {
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.disconnect();
        }
      });

      return this.socket;
    } catch (error) {
      console.error('Ошибка создания WebSocket соединения');
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(data: { chatId: string; content: string; type?: string; replyToId?: string; fileUrl?: string; fileName?: string; fileSize?: number }) {
    console.log('🔍 sendMessage called with:', data);
    console.log('🔌 Socket connected:', this.socket?.connected);
    
    if (!this.socket?.connected) {
      console.error('❌ Socket not connected');
      return false;
    }
    
    // Валидация данных - content может быть пустым для файлов
    if (!data.chatId || typeof data.chatId !== 'string') {
      console.error('❌ Недействительный chatId');
      return false;
    }
    
    if (typeof data.content !== 'string') {
      console.error('❌ Недействительный content');
      return false;
    }
    
    // Санитизация контента
    const sanitizedData: any = {
      chatId: data.chatId.trim(),
      content: data.content.trim(),
      type: data.type || 'TEXT'
    };
    
    if (data.replyToId) {
      sanitizedData.replyToId = data.replyToId;
      console.log('📎 Sending message with replyToId:', data.replyToId);
    }
    
    if (data.fileUrl) {
      sanitizedData.fileUrl = data.fileUrl;
    }
    
    if (data.fileName) {
      sanitizedData.fileName = data.fileName;
    }
    
    if (data.fileSize) {
      sanitizedData.fileSize = data.fileSize;
    }
    
    console.log('📤 Emitting message:send:', sanitizedData);
    this.socket.emit('message:send', sanitizedData);
    return true;
  }

  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('message:new', callback);
  }

  onError(callback: (error: { message: string }) => void) {
    this.socket?.on('error', callback);
  }

  private isValidJWT(token: string): boolean {
    if (!token || typeof token !== 'string' || token.length < 20) {
      return false;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // Проверяем что каждая часть является валидным base64url
    const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
    return parts.every(part => part.length > 0 && base64UrlRegex.test(part));
  }

  get connected(): boolean {
    return this.socket?.connected || false;
  }
  
  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
