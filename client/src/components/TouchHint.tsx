import { useState, useEffect } from 'react';

export const TouchHint = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasSeenHint = localStorage.getItem('touchHintSeen');
    
    if (isTouchDevice && !hasSeenHint) {
      setTimeout(() => setShow(true), 2000);
    }
  }, []);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem('touchHintSeen', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
      <div className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <span className="text-2xl">👆</span>
        <div>
          <p className="font-semibold">Подсказка</p>
          <p className="text-sm">Удерживайте сообщение для меню</p>
        </div>
        <button onClick={handleClose} className="ml-2 text-white/80 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
};
