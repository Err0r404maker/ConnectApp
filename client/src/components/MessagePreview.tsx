interface MessagePreviewProps {
  content: string;
  type?: string;
  maxLength?: number;
}

export const MessagePreview = ({ content, type, maxLength = 50 }: MessagePreviewProps) => {
  if (type === 'IMAGE') return <span>🖼️ Изображение</span>;
  if (type === 'FILE') return <span>📎 Файл</span>;
  if (type === 'VOICE') return <span>🎤 Голосовое</span>;
  
  const preview = content.length > maxLength 
    ? content.substring(0, maxLength) + '...'
    : content;
    
  return <span>{preview}</span>;
};
