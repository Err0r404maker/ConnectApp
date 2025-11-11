class SoundNotification {
  private audio: HTMLAudioElement | null = null;
  private enabled: boolean = true;

  constructor() {
    this.audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvx3QpBSh+zPDajzsKFGCy6OyrWBQLSKHf8sFuJAUuhM/z2Ik3CBhku+zooVARC0yl4fG5ZRwFNo3V78d0KQUofszw2o87ChRgsujsq1gVC0ih3/LBbiQFL4TP89iJNwgYZLvs6KFQEQtMpeHxuWUcBTaN1e/HdCkFKH7M8NqPOwoUYLLo7KtYFQtIod/ywW4kBS+Ez/PYiTcIGGS77OihUBELTKXh8bllHAU2jdXvx3QpBSh+zPDajzsKFGCy6OyrWBULSKHf8sFuJAUvhM/z2Ik3CBhku+zooVARC0yl4fG5ZRwFNo3V78d0KQUofszw2o87ChRgsujsq1gVC0ih3/LBbiQFL4TP89iJNwgYZLvs6KFQEQtMpeHxuWUcBTaN1e/HdCkFKH7M8NqPOwoUYLLo7KtYFQtIod/ywW4kBS+Ez/PYiTcIGGS77OihUBELTKXh8bllHAU2jdXvx3QpBSh+zPDajzsKFGCy6OyrWBULSKHf8sFuJAUvhM/z2Ik3CBhku+zooVARC0yl4fG5ZRwFNo3V78d0KQUofszw2o87ChRgsujsq1gVC0ih3/LBbiQFL4TP89iJNwgYZLvs6KFQEQtMpeHxuWUcBTaN1e/HdCkFKH7M8NqPOwoUYLLo7KtYFQtIod/ywW4kBS+Ez/PYiTcIGGS77OihUBELTKXh8bllHAU2jdXvx3QpBSh+zPDajzsKFGCy6OyrWBULSKHf8sFuJAUvhM/z2Ik3CBhku+zooVARC0yl4fG5ZRwFNo3V78d0KQUofszw');
  }

  play() {
    if (this.enabled && this.audio) {
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {});
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

export const soundNotification = new SoundNotification();
