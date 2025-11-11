import { useState } from 'react';

interface MessageEditProps {
  messageId: string;
  initialContent: string;
  onSave: (messageId: string, content: string) => void;
  onCancel: () => void;
}

export const MessageEdit = ({ messageId, initialContent, onSave, onCancel }: MessageEditProps) => {
  const [content, setContent] = useState(initialContent);

  const handleSave = () => {
    if (content.trim()) {
      onSave(messageId, content.trim());
    }
  };

  return (
    <div className="flex gap-2 mt-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onCancel();
        }}
        className="flex-1 px-3 py-1 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        autoFocus
      />
      <button onClick={handleSave} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        ✓
      </button>
      <button onClick={onCancel} className="px-3 py-1 text-sm bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">
        ✕
      </button>
    </div>
  );
};
