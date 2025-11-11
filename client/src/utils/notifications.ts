export class NotificationManager {
  private static instance: NotificationManager;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Браузер не поддерживает уведомления');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  async showNotification(title: string, options?: NotificationOptions) {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    // Проверяем, что вкладка не активна
    if (document.hidden) {
      new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        ...options
      });
    }
  }

  showMessageNotification(senderName: string, message: string, chatId: string) {
    this.showNotification(`${senderName}`, {
      body: message,
      tag: chatId,
      requireInteraction: false,
      silent: false
    });
  }
}

export const notificationManager = NotificationManager.getInstance();
