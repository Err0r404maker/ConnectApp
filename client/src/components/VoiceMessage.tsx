import React, { useState, useRef, useEffect } from 'react';

interface VoiceMessageProps {
  fileUrl: string;
  isOwn: boolean;
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({ fileUrl, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [staticWaveform, setStaticWaveform] = useState<number[]>(Array(40).fill(0.5));
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(fileUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    // Генерация реальной волны из аудио
    generateRealWaveform();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [fileUrl]);

  const generateRealWaveform = async () => {
    try {
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const rawData = audioBuffer.getChannelData(0);
      const samples = 40;
      const blockSize = Math.floor(rawData.length / samples);
      const waveformData: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        const start = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[start + j]);
        }
        waveformData.push((sum / blockSize) * 2);
      }
      
      // Нормализация
      const max = Math.max(...waveformData);
      const normalized = waveformData.map(v => Math.max((v / max) * 0.8 + 0.2, 0.2));
      setStaticWaveform(normalized);
      
      audioContext.close();
    } catch (error) {
      console.error('Ошибка генерации волны:', error);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    const speeds = [1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    
    audioRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 min-w-[240px]">
      <button
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isOwn 
            ? 'bg-white/20 hover:bg-white/30' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isPlaying ? (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="flex-1 space-y-1">
        <div className="flex items-end gap-px h-8 cursor-pointer" onClick={handleSeek}>
          {staticWaveform.map((height, i) => {
            const isActive = i < (progress / 100) * staticWaveform.length;
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-colors ${
                  isActive
                    ? (isOwn ? 'bg-white' : 'bg-blue-600')
                    : (isOwn ? 'bg-white/30' : 'bg-blue-400/30')
                }`}
                style={{
                  height: `${Math.min(height * 100, 100)}%`,
                  minHeight: '2px'
                }}
              />
            );
          })}
        </div>
        
        <div className="flex items-center justify-between text-xs opacity-70">
          <span>{formatTime(currentTime)}</span>
          <button
            onClick={toggleSpeed}
            className="px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
          >
            {playbackRate}x
          </button>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
