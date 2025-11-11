interface CachedMessage {
  data: any;
  timestamp: number;
}

class MessageCache {
  private cache = new Map<string, CachedMessage>();
  private readonly TTL = 5 * 60 * 1000; // 5 минут

  set(chatId: string, messages: any[]) {
    this.cache.set(chatId, {
      data: messages,
      timestamp: Date.now()
    });
  }

  get(chatId: string): any[] | null {
    const cached = this.cache.get(chatId);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(chatId);
      return null;
    }

    return cached.data;
  }

  invalidate(chatId: string) {
    this.cache.delete(chatId);
  }

  clear() {
    this.cache.clear();
  }
}

export const messageCache = new MessageCache();
