import { useState, useEffect } from 'react';
import { useSocketStore } from '../store/socketStore';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Reaction {
  emoji: string;
  count: number;
}

export const useReactions = (messageId: string) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const socket = useSocketStore((state) => state.socket);

  useEffect(() => {
    loadReactions();
  }, [messageId]);

  useEffect(() => {
    if (!socket) return;

    const handleReactionUpdated = (data: { messageId: string; reactions: Reaction[] }) => {
      if (data.messageId === messageId) {
        setReactions(data.reactions || []);
      }
    };

    socket.on('reaction:updated', handleReactionUpdated);

    return () => {
      socket.off('reaction:updated', handleReactionUpdated);
    };
  }, [socket, messageId]);

  const loadReactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/reactions/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReactions(data || []);
    } catch (error) {
      console.error('Ошибка загрузки реакций:', error);
    }
  };

  const toggleReaction = async (emoji: string) => {
    if (!socket) return;

    socket.emit('reaction:toggle', { messageId, emoji });
  };

  return { reactions, toggleReaction };
};
