import { io, Socket } from 'socket.io-client';

class CleanSocketService {
  private socket: Socket | null = null;

  connect(): Socket | null {
    if (this.socket?.connected) return this.socket;

    this.socket = io('http://localhost:3001');
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(data: { chatId: string; content: string }) {
    if (this.socket?.connected) {
      this.socket.emit('message:send', data);
      return true;
    }
    return false;
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('message:new', callback);
  }

  get connected(): boolean {
    return this.socket?.connected || false;
  }
}

export const cleanSocketService = new CleanSocketService();
