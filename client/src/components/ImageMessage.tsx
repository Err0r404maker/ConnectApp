import React, { useState } from 'react';

interface ImageMessageProps {
  src: string;
  alt?: string;
  isOwn: boolean;
  onClick?: () => void;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({
  src,
  alt = 'Изображение',
  isOwn,
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <span className="text-sm text-gray-500">❌ Ошибка загрузки</span>
      </div>
    );
  }

  return (
    <div className="inline-block">
      {!isLoaded && (
        <div className="w-40 h-28 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        className={`rounded-lg cursor-pointer ${isLoaded ? 'block' : 'hidden'}`}
        style={{ maxWidth: '300px', maxHeight: '250px', width: 'auto', height: 'auto' }}
        onClick={onClick}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
};
