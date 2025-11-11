import React, { useState } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useThemeStore } from '../store/themeStore';

interface EmojiPickerComponentProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPickerComponent: React.FC<EmojiPickerComponentProps> = ({ onEmojiSelect, onClose }) => {
  const { isDark } = useThemeStore();

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-16 right-0 z-50 shadow-2xl rounded-2xl overflow-hidden">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={isDark ? Theme.DARK : Theme.LIGHT}
          width={350}
          height={450}
          searchPlaceHolder="Поиск эмодзи..."
          previewConfig={{ showPreview: false }}
        />
      </div>
    </>
  );
};

// Быстрые реакции
interface QuickReactionsProps {
  onReact: (emoji: string) => void;
}

export const QuickReactions: React.FC<QuickReactionsProps> = ({ onReact }) => {
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

  return (
    <div className="flex items-center gap-1 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {reactions.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="w-10 h-10 flex items-center justify-center text-2xl hover:scale-125 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
          title={`Реакция ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
