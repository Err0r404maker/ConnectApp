import { useSettingsStore } from '../store/settingsStore';

// Звуки уведомлений
class SoundManager {
  // Простые звуки через Web Audio API
  private playTone(frequency: number, duration: number, volume: number = 0.3) {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.error('Sound error:', error);
    }
  }

  // Звук нового сообщения
  playMessageReceived() {
    const settings = useSettingsStore.getState();
    if (!settings.notificationSounds.messageReceived) return;
    this.playTone(800, 0.1);
    setTimeout(() => this.playTone(1000, 0.1), 100);
  }

  // Звук отправки сообщения
  playMessageSent() {
    const settings = useSettingsStore.getState();
    if (!settings.notificationSounds.messageSent) return;
    this.playTone(600, 0.05);
    setTimeout(() => this.playTone(800, 0.05), 50);
  }

  // Звук уведомления
  playNotification() {
    const settings = useSettingsStore.getState();
    if (!settings.notificationSounds.notifications) return;
    this.playTone(1200, 0.15);
  }
  
  // Звук реакции
  playReaction() {
    const settings = useSettingsStore.getState();
    if (!settings.notificationSounds.reactions) return;
    this.playTone(900, 0.08);
  }

  // Звук ошибки
  playError() {
    this.playTone(300, 0.2, 0.2);
  }

  // Звук успеха
  playSuccess() {
    this.playTone(800, 0.1);
    setTimeout(() => this.playTone(1000, 0.1), 80);
    setTimeout(() => this.playTone(1200, 0.15), 160);
  }
}

export const soundManager = new SoundManager();
