import React, { useState, useRef, useEffect } from 'react';

interface TelegramVoiceRecorderProps {
  onRecordComplete: (audioBlob: Blob) => void;
  onRecordingChange?: (isRecording: boolean) => void;
}

export const TelegramVoiceRecorder: React.FC<TelegramVoiceRecorderProps> = ({ 
  onRecordComplete, 
  onRecordingChange 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(30).fill(0));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setAudioLevels(Array(30).fill(0));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Настройка аудио анализа
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevels = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const levels = Array.from({ length: 30 }, (_, i) => {
          const index = Math.floor((i / 30) * dataArray.length);
          return dataArray[index] / 255;
        });
        setAudioLevels(levels);
        animationFrameRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      onRecordingChange?.(true);

      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Ошибка доступа к микрофону:', error);
      alert('Не удалось получить доступ к микрофону');
    }
  };

  const stopAndSend = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      if (audioBlob.size > 0 && duration >= 1) {
        onRecordComplete(audioBlob);
      }
      
      cleanup();
      setIsRecording(false);
      setDuration(0);
      onRecordingChange?.(false);
    };

    mediaRecorderRef.current.stop();
  };

  const cancel = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    cleanup();
    setIsRecording(false);
    setDuration(0);
    onRecordingChange?.(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording) {
    return (
      <button
        onClick={startRecording}
        className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        title="Записать голосовое сообщение"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-1">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
        <div className="flex items-end gap-px h-6 flex-1">
          {audioLevels.map((level, i) => (
            <div
              key={i}
              className="flex-1 bg-blue-500 rounded-sm transition-all duration-75"
              style={{
                height: `${Math.max(level * 100, 2)}%`
              }}
            />
          ))}
        </div>
        <span className="text-blue-600 dark:text-blue-400 font-medium">{formatTime(duration)}</span>
      </div>
      <button
        onClick={cancel}
        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 transition-colors"
      >
        Отменить
      </button>
      <button
        onClick={stopAndSend}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Отправить
      </button>
    </div>
  );
};
