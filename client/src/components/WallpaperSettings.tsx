import { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export const WallpaperSettings = () => {
  const { wallpaper, wallpaperOpacity, setWallpaper, setWallpaperOpacity } = useSettingsStore();
  const [showPicker, setShowPicker] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setWallpaper(reader.result as string);
        setShowPicker(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const presetWallpapers = [
    '/обои.jpg',
    'https://images.unsplash.com/photo-1557683316-973673baf926',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85'
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Обои чата</h3>
          <p className="text-sm text-gray-500">Установите фон для чатов</p>
        </div>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {wallpaper ? 'Изменить' : 'Выбрать'}
        </button>
      </div>

      {wallpaper && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Прозрачность: {Math.round(wallpaperOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={wallpaperOpacity * 100}
              onChange={(e) => setWallpaperOpacity(parseInt(e.target.value) / 100)}
              className="w-full"
            />
          </div>
          <button
            onClick={() => setWallpaper(null)}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Удалить обои
          </button>
        </div>
      )}

      {showPicker && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Загрузить свои</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Готовые обои</label>
            <div className="grid grid-cols-2 gap-2">
              {presetWallpapers.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setWallpaper(url);
                    setShowPicker(false);
                  }}
                  className="aspect-video rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  <img src={url} alt={`Обои ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
