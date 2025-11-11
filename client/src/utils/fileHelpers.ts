export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const getFileIcon = (fileName: string, type?: string) => {
  if (type === 'VOICE') return '🎤';
  
  const ext = fileName?.split('.').pop()?.toLowerCase();
  
  const icons: Record<string, string> = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📊',
    pptx: '📊',
    zip: '🗜️',
    rar: '🗜️',
    mp3: '🎵',
    mp4: '🎬',
    avi: '🎬',
    txt: '📃',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️'
  };
  
  return icons[ext || ''] || '📎';
};
