import { create } from 'zustand';

interface AudioTrack {
  url: string;
  name: string;
}

interface AudioPlayerStore {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  setTrack: (track: AudioTrack) => void;
  setIsPlaying: (playing: boolean) => void;
  clearTrack: () => void;
}

export const useAudioPlayerStore = create<AudioPlayerStore>((set) => ({
  currentTrack: null,
  isPlaying: false,
  setTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  clearTrack: () => set({ currentTrack: null, isPlaying: false }),
}));
