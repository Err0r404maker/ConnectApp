import React, { useRef, useState } from 'react';
import { VoiceRecorder } from './VoiceRecorder';

interface FileUploaderProps {
  onFileSelect: (file: File, type: 'IMAGE' | 'FILE' | 'VOICE') => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'IMAGE' | 'FILE') => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file, type);
      e.target.value = '';
    }
  };

  const handleVoiceComplete = (audioBlob: Blob) => {
    const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
    onFileSelect(file, 'VOICE');
    setShowVoiceRecorder(false);
  };

  if (showVoiceRecorder) {
    return (
      <VoiceRecorder
        onRecordComplete={handleVoiceComplete}
        onCancel={() => setShowVoiceRecorder(false)}
      />
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => imageInputRef.current?.click()}
        disabled={disabled}
        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded-lg transition-colors"
        title="Отправить изображение"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded-lg transition-colors"
        title="Отправить файл"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>

      <button
        onClick={() => setShowVoiceRecorder(true)}
        disabled={disabled}
        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded-lg transition-colors"
        title="Записать голосовое сообщение"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'IMAGE')}
        className="hidden"
      />

      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => handleFileChange(e, 'FILE')}
        className="hidden"
      />
    </div>
  );
};
