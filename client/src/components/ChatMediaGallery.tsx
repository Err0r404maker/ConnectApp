import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface Props {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
  messages?: any[];
}

export const ChatMediaGallery = ({ chatId, isOpen, onClose, messages = [] }: Props) => {
  const [tab, setTab] = useState<'images' | 'files'>('images');
  const [viewer, setViewer] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{url: string, name: string, type: string, messageId: string} | null>(null);

  const scrollToMessage = (messageId: string) => {
    onClose();
    requestAnimationFrame(() => {
      setTimeout(() => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-blue-500', 'rounded-lg');
          setTimeout(() => element.classList.remove('ring-4', 'ring-blue-500', 'rounded-lg'), 2000);
        }
      }, 300);
    });
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Фильтрация по типу (chatId уже отфильтрован в messages)
  const images = messages.filter(m => m.type === 'IMAGE');
  const files = messages.filter(m => m.type === 'FILE');

  const items = tab === 'images' ? images : files;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📁 Медиатека</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {images.length} изображений • {files.length} файлов
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-6 pt-4">
            <button
              onClick={() => setTab('images')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition ${
                tab === 'images'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              🖼️ Изображения ({images.length})
            </button>
            <button
              onClick={() => setTab('files')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition ${
                tab === 'files'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              📎 Файлы ({files.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <svg className="w-24 h-24 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-lg font-medium">
                  {tab === 'images' ? 'Нет изображений' : 'Нет файлов'}
                </p>
                <p className="text-sm mt-1">Отправьте {tab === 'images' ? 'фото' : 'файл'} в чат</p>
              </div>
            ) : tab === 'images' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img) => {
                  const src = img.imageData || img.fileUrl || img.content || '';
                  const fullSrc = src.startsWith('/') ? `http://localhost:3001${src}` : src;
                  return (
                    <div key={img.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-2 border-gray-200 dark:border-gray-700">
                      <img
                        src={fullSrc}
                        alt={img.fileName || 'Image'}
                        className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-500"
                        onClick={() => setViewer(fullSrc)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold">
                              {img.sender?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <p className="text-xs font-semibold truncate">{img.sender?.username || 'User'}</p>
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs opacity-90 font-medium">
                              {new Date(img.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                            </p>
                            {img.isRead && (
                              <div className="flex items-center gap-1 text-xs bg-blue-500/30 px-2 py-0.5 rounded-full">
                                <svg className="w-3 h-3 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                </svg>
                                <span className="text-blue-200">Viewed</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              scrollToMessage(img.id);
                            }}
                            className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl text-xs font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            📍 Перейти к сообщению
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => {
                  const isVoice = file.type === 'VOICE';
                  const fileData = file.fileUrl || file.content || '';
                  const fullUrl = fileData.startsWith('/') ? `http://localhost:3001${fileData}` : fileData;
                  
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                    >
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isVoice ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {isVoice ? (
                          <svg className="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        ) : (
                          <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {file.fileName || (isVoice ? '🎤 Голосовое сообщение' : 'Файл')}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {file.sender?.username || 'User'}
                          </p>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(file.createdAt).toLocaleDateString('ru')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {file.isRead ? (
                          <span className="text-xs text-blue-500 font-medium">✓ Прочитано</span>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Отправлено</span>
                        )}
                        <button
                          onClick={() => scrollToMessage(file.id)}
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Перейти к сообщению"
                        >
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (isVoice) {
                              new Audio(fullUrl).play();
                            } else {
                              const fileType = fullUrl.split(';')[0].split(':')[1] || '';
                              setPreviewFile({ url: fullUrl, name: file.fileName || 'file', type: fileType, messageId: file.id });
                            }
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title={isVoice ? 'Воспроизвести' : 'Предпросмотр'}
                        >
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer */}
      {viewer && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4" onClick={() => setViewer(null)}>
          <button onClick={() => setViewer(null)} className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src={viewer} alt="Full" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          <p className="absolute bottom-4 text-white text-sm bg-black/50 px-4 py-2 rounded-lg">Нажмите ESC для закрытия</p>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
          <div className="relative w-full h-full flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{previewFile.name}</h3>
                  <p className="text-gray-400 text-sm">{previewFile.type || 'Неизвестный тип'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    scrollToMessage(previewFile.messageId);
                    setPreviewFile(null);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium"
                >
                  Перейти к сообщению
                </button>
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition font-medium"
                >
                  Скачать
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition font-medium"
                >
                  Закрыть
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
              {previewFile.type.startsWith('image/') ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
              ) : previewFile.type.startsWith('video/') ? (
                <video src={previewFile.url} controls className="max-w-full max-h-full rounded-lg shadow-2xl" />
              ) : previewFile.type.startsWith('audio/') ? (
                <div className="w-full max-w-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                  <div className="flex items-center justify-center mb-8">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                      <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-white text-xl font-bold text-center mb-6">{previewFile.name}</h3>
                  <audio src={previewFile.url} controls className="w-full" />
                </div>
              ) : previewFile.type === 'application/pdf' || previewFile.name.endsWith('.pdf') ? (
                <div className="text-center">
                  <div className="w-24 h-24 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                    </svg>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">PDF Документ</h3>
                  <p className="text-gray-400 mb-6">{previewFile.name}</p>
                  <button
                    onClick={() => {
                      const byteString = atob(previewFile.url.split(',')[1]);
                      const ab = new ArrayBuffer(byteString.length);
                      const ia = new Uint8Array(ab);
                      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                      const blob = new Blob([ab], { type: 'application/pdf' });
                      window.open(URL.createObjectURL(blob), '_blank');
                    }}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium"
                  >
                    Открыть в новой вкладке
                  </button>
                </div>
              ) : previewFile.type.startsWith('text/') ? (
                <div className="w-full max-w-4xl max-h-[80vh] bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
                  <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                    <p className="text-gray-400 text-sm font-mono">{previewFile.name}</p>
                  </div>
                  <iframe src={previewFile.url} className="w-full h-full min-h-[500px]" />
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">Предпросмотр недоступен</h3>
                  <p className="text-gray-400">Данный тип файла не поддерживает предпросмотр</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
