import { useEffect, useRef, useState } from 'react';
import { useAudioPlayerStore } from '../store/audioPlayerStore';

export const AudioPlayer = () => {
  const { currentTrack, isPlaying, setIsPlaying, clearTrack } = useAudioPlayerStore();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(Array(200).fill(0.5));
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    
    audioRef.current.src = currentTrack.url;
    if (isPlaying) audioRef.current.play();
    generateWaveform();
  }, [currentTrack]);

  const generateWaveform = async () => {
    if (!currentTrack) return;
    try {
      const response = await fetch(currentTrack.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const rawData = audioBuffer.getChannelData(0);
      const samples = 200;
      const blockSize = Math.floor(rawData.length / samples);
      const waveformData: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        const start = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[start + j]);
        }
        waveformData.push((sum / blockSize) * 2.5);
      }
      
      const max = Math.max(...waveformData);
      const normalized = waveformData.map(v => Math.max((v / max) * 0.9 + 0.1, 0.15));
      setWaveform(normalized);
      audioContext.close();
    } catch (error) {
      console.error('Ошибка генерации волны:', error);
    }
  };

  useEffect(() => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.play() : audioRef.current.pause();
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const total = audioRef.current.duration;
    setCurrentTime(current);
    const newProgress = (current / total) * 100;
    if (Math.abs(newProgress - progress) > 0.1) {
      setProgress(newProgress);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * audioRef.current.duration;
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <div className={`fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all ${isMinimized ? 'w-64' : 'w-96'}`}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="auto"
      />
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm truncate flex-1">{currentTrack.name}</h3>
          <div className="flex gap-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="text-gray-500 hover:text-gray-700">
              {isMinimized ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              )}
            </button>
            <button onClick={clearTrack} className="text-gray-500 hover:text-red-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              
              <div className="flex-1">
                <div className="relative flex items-end gap-[1px] h-16 cursor-pointer mb-1" onClick={handleSeek}>
                  {waveform.map((height, i) => {
                    const progressIndex = (progress / 100) * waveform.length;
                    const isActive = i < progressIndex;
                    const isCurrent = Math.abs(i - progressIndex) < 1;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-[1px] relative ${
                          isActive ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-gray-300 dark:bg-gray-500'
                        }`}
                        style={{
                          height: `${Math.min(height * 100, 100)}%`,
                          minHeight: '3px',
                          transition: 'none'
                        }}
                      >
                        {isCurrent && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-[calc(100%+8px)] bg-white shadow-lg rounded-full" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {isMinimized && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full"
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
