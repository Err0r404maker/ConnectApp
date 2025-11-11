import React, { useState } from 'react';
import { VoiceRecorder } from './VoiceRecorder';
import { FileUploader } from './FileUploader';

interface MessageInputProps {
  onSendMessage: (content: string, type?: string) => void;
  onFileSelect: (file: File, type: 'IMAGE' | 'FILE' | 'VOICE') => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onFileSelect, disabled }) => {
  const [message, setMessage] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [buttonTimer, setButtonTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (showVoice) {
    return (
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <VoiceRecorder
          onRecordComplete={(blob) => {
            const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
            onFileSelect(file, 'VOICE');
            setShowVoice(false);
          }}
          onCancel={() => setShowVoice(false)}
        />
      </div>
    );
  }

  const handleFocus = () => {
    if (buttonTimer) clearTimeout(buttonTimer);
    const timer = setTimeout(() => setShowButtons(true), 2000);
    setButtonTimer(timer);
  };

  const handleBlur = () => {
    if (buttonTimer) clearTimeout(buttonTimer);
  };

  return (
    <div className="p-4 border-t" style={{borderColor: 'rgba(124, 107, 173, 0.2)'}}>
      <div className="flex items-end space-x-2">
        <div className={`flex items-center space-x-1 transition-all duration-300 ${showButtons ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
          <button
            onClick={() => document.getElementById('image-input')?.click()}
            disabled={disabled}
            className="p-2 text-white/70 hover:text-white rounded-lg transition-all hover:scale-110"
            style={{background: 'rgba(91, 75, 138, 0.3)'}}
            title="Изображение"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={() => document.getElementById('file-input')?.click()}
            disabled={disabled}
            className="p-2 text-white/70 hover:text-white rounded-lg transition-all hover:scale-110"
            style={{background: 'rgba(91, 75, 138, 0.3)'}}
            title="Файл"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <button
            onClick={() => setShowVoice(true)}
            disabled={disabled}
            className="p-2 text-white/70 hover:text-white rounded-lg transition-all hover:scale-110"
            style={{background: 'rgba(91, 75, 138, 0.3)'}}
            title="Голосовое сообщение"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          <input
            id="image-input"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file, 'IMAGE');
              e.target.value = '';
            }}
            className="hidden"
          />

          <input
            id="file-input"
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file, 'FILE');
              e.target.value = '';
            }}
            className="hidden"
          />
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Напишите сообщение..."
          disabled={disabled}
          rows={1}
          className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 text-white resize-none transition-all"
          style={{background: 'rgba(93, 75, 138, 0.2)', borderColor: 'rgba(124, 107, 173, 0.3)', border: '1px solid'}}
        />

        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
          style={{background: 'linear-gradient(135deg, #5b4b8a, #7c6bad)'}}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};
