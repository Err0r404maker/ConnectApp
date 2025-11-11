import React, { useState, useRef, useEffect } from 'react';

interface AvatarCropProps {
  image: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
}

export const AvatarCrop: React.FC<AvatarCropProps> = ({ image, onCrop, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(new Image());

  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => {
      const size = Math.min(img.width, img.height, 300);
      setImgDimensions({ width: img.width, height: img.height });
      setCrop({ x: (img.width - size) / 2, y: (img.height - size) / 2, size });
      drawCanvas();
    };
    img.src = image;
  }, [image]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const img = imgRef.current;
    const scale = Math.min(400 / img.width, 400 / img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaledCrop = { x: crop.x * scale, y: crop.y * scale, size: crop.size * scale };
    ctx.save();
    ctx.beginPath();
    ctx.arc(scaledCrop.x + scaledCrop.size / 2, scaledCrop.y + scaledCrop.size / 2, scaledCrop.size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(scaledCrop.x + scaledCrop.size / 2, scaledCrop.y + scaledCrop.size / 2, scaledCrop.size / 2, 0, Math.PI * 2);
    ctx.stroke();
  };

  useEffect(() => {
    if (imgDimensions.width > 0) drawCanvas();
  }, [crop, imgDimensions]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = imgRef.current.width / canvas.width;
    const x = Math.max(0, Math.min((e.clientX - rect.left) * scale - crop.size / 2, imgDimensions.width - crop.size));
    const y = Math.max(0, Math.min((e.clientY - rect.top) * scale - crop.size / 2, imgDimensions.height - crop.size));
    setCrop({ ...crop, x, y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCrop = () => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 200;
    tempCanvas.height = 200;
    const ctx = tempCanvas.getContext('2d');
    ctx?.drawImage(imgRef.current, crop.x, crop.y, crop.size, crop.size, 0, 0, 200, 200);
    onCrop(tempCanvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Выберите область</h3>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-move border border-gray-300 dark:border-gray-600 rounded-lg mb-4"
        />
        <input
          type="range"
          min="100"
          max={Math.min(imgDimensions.width, imgDimensions.height)}
          value={crop.size}
          onChange={(e) => {
            const size = parseInt(e.target.value);
            setCrop({
              size,
              x: Math.max(0, Math.min(crop.x, imgDimensions.width - size)),
              y: Math.max(0, Math.min(crop.y, imgDimensions.height - size))
            });
          }}
          className="w-full mb-4"
        />
        <div className="flex space-x-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
            Отмена
          </button>
          <button onClick={handleCrop} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
