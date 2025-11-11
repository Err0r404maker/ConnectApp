import { useState, useCallback } from 'react';
import { debounce } from '../utils/debounce';

interface MessageSearchProps {
  onSearch: (query: string) => void;
  onClose: () => void;
}

export const MessageSearch = ({ onSearch, onClose }: MessageSearchProps) => {
  const [query, setQuery] = useState('');

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearch(value);
    }, 300),
    [onSearch]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 z-10 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Поиск по сообщениям..."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};
