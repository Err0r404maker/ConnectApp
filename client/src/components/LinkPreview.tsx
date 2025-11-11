import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Preview {
  title: string;
  description: string;
  image: string | null;
  url: string;
}

export const LinkPreview = ({ url }: { url: string }) => {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.post(`${API_URL}/api/link-preview`, 
          { url },
          { headers: { Authorization: `Bearer ${token}` }}
        );
        setPreview(data);
      } catch (error) {
        console.error('Ошибка предпросмотра:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (loading) return <div className="text-xs text-gray-500">Загрузка...</div>;
  if (!preview) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2 border dark:border-gray-700 rounded-lg overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      {preview.image && (
        <img src={preview.image} alt={preview.title} className="w-full h-32 object-cover" />
      )}
      <div className="p-3">
        <div className="font-semibold text-sm">{preview.title}</div>
        {preview.description && (
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">{preview.description}</div>
        )}
        <div className="text-xs text-blue-500 mt-1">{new URL(url).hostname}</div>
      </div>
    </a>
  );
};
