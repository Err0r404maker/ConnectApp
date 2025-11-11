import React, { memo, useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useNotifications } from '../hooks/useNotifications';
import { socketService } from '../services/socketService';
import { Sidebar } from '../components/Sidebar';
import { DragDropZone } from '../components/DragDropZone';
import { UserProfile } from '../components/UserProfile';
import { EnhancedProfileSettings } from '../components/EnhancedProfileSettings';
import { ChatMediaGallery } from '../components/ChatMediaGallery';
import { EmojiPickerComponent } from '../components/EmojiPicker';
import { MessageActions } from '../components/MessageActions';
import { MessageReactions } from '../components/MessageReactions';
import { PinnedMessages } from '../components/PinnedMessages';
import { ForwardModal } from '../components/ForwardModal';
import { ChatMembers } from '../components/ChatMembers';
import ChatSettings from '../components/ChatSettings';
import { TelegramVoiceRecorder } from '../components/TelegramVoiceRecorder';
import { MarkdownMessage } from '../components/MarkdownMessage';
import { TypingIndicator } from '../components/TypingIndicator';
import { OnlineStatus } from '../components/OnlineStatus';
import { LinkPreview } from '../components/LinkPreview';
import { ChatStats } from '../components/ChatStats';
import { CreateGroupChat } from '../components/CreateGroupChat';
import CreateChatModal from '../components/CreateChatModal';
import { soundManager } from '../utils/sounds';
import { ImageMessage } from '../components/ImageMessage';
import { VoiceMessage } from '../components/VoiceMessage';

const ImprovedChatPage: React.FC = memo(() => {
  const { user, logout, accessToken } = useAuthStore();
  const { chats, messages, activeChat, setChats, addMessage, setActiveChat, setMessages } = useChatStore();
  const { showNotification, requestPermission } = useNotifications();
  const { accessToken: authAccessToken } = useAuthStore();
  
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [previewFile, setPreviewFile] = useState<{url: string, name: string, type: string} | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [editingMessage, setEditingMessage] = useState<{id: string, content: string} | null>(null);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [forwardingMessage, setForwardingMessage] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestPermission();
    
    const handleOpenUserProfile = (e: any) => {
      setSelectedUserId(e.detail.userId);
    };
    
    const handleOpenChat = (e: any) => {
      const chatId = e.detail.chatId;
      setActiveChat(chatId);
      loadMessages(chatId);
    };
    
    const handleOpenCreateGroup = () => {
      setShowCreateGroup(true);
    };
    
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewFile) setPreviewFile(null);
      }
    };
    
    window.addEventListener('openUserProfile', handleOpenUserProfile);
    window.addEventListener('openChat', handleOpenChat);
    window.addEventListener('openCreateGroup', handleOpenCreateGroup);
    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('openUserProfile', handleOpenUserProfile);
      window.removeEventListener('openChat', handleOpenChat);
      window.removeEventListener('openCreateGroup', handleOpenCreateGroup);
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [previewFile]);

  const loadMessages = useCallback(async (chatId: string) => {
    if (!accessToken) return;
    try {
      const API_URL = 'http://localhost:3001/api';
      
      // Загружаем текстовые сообщения
      const messagesResponse = await fetch(`${API_URL}/messages/${chatId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (messagesResponse.status === 401) {
        console.log('Token expired, logging out...');
        logout();
        return;
      }
      
      // Загружаем файлы/изображения
      const imagesResponse = await fetch(`${API_URL}/images/${chatId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      // Загружаем детальные статусы прочтения
      const readStatusResponse = await fetch(`${API_URL}/message-reads/status/${chatId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const readStatus = readStatusResponse.ok ? await readStatusResponse.json() : {};
      
      let allMessages: any[] = [];
      
      if (messagesResponse.ok) {
        const data = await messagesResponse.json();
        const textMessages = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          content: msg.content || '',
          senderId: msg.senderId,
          sender: {
            id: msg.senderId,
            firstName: msg.firstName || '',
            lastName: msg.lastName || '',
            avatar: msg.senderAvatar
          },
          firstName: msg.firstName,
          lastName: msg.lastName,
          avatar: msg.senderAvatar,
          createdAt: msg.createdAt,
          type: msg.type || 'TEXT',
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          isEdited: msg.isEdited,
          editedAt: msg.editedAt,
          isRead: readStatus[msg.id]?.isRead || false,
          readCount: readStatus[msg.id]?.readCount || 0,
          totalMembers: readStatus[msg.id]?.totalMembers || 0,
          status: readStatus[msg.id]?.isRead ? 'read' : 'delivered',
          reactions: msg.reactions || {},
          replyToId: msg.replyToId,
          isPinned: msg.isPinned || false,
          pinnedAt: msg.pinnedAt || null,
          pinnedBy: msg.pinnedBy || null
        }));
        allMessages = [...textMessages];
      }
      
      if (imagesResponse.ok) {
        const imageMessages = await imagesResponse.json();
        const enrichedImages = imageMessages.map((img: any) => ({
          ...img,
          isRead: readStatus[img.id]?.isRead || false,
          readCount: readStatus[img.id]?.readCount || 0,
          totalMembers: readStatus[img.id]?.totalMembers || 0,
          status: readStatus[img.id]?.isRead ? 'read' : 'delivered',
          sender: {
            id: img.senderId,
            firstName: img.firstName || '',
            lastName: img.lastName || '',
            avatar: img.avatar
          }
        }));
        allMessages = [...allMessages, ...enrichedImages];
      }
      
      // Сортируем по времени
      allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      setMessages(chatId, allMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [accessToken, setMessages, logout]);

  const loadChats = useCallback(async (retry = true) => {
    if (!accessToken) return;
    try {
      const API_URL = 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/chats`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.status === 401 && retry) {
        console.log('Token expired, logging out...');
        logout();
        return;
      }
      if (response.ok) {
        const chatsData = await response.json();
        setChats(chatsData);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }, [accessToken, setChats, logout]);

  const markMessagesAsRead = useCallback(async (chatId: string) => {
    if (!accessToken) return;
    try {
      await fetch('http://localhost:3001/api/message-reads/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ chatId })
      });
    } catch (error) {
      console.error('Ошибка отметки прочитанных:', error);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !user) return;
    loadChats();
    const socket = socketService.connect(accessToken);
    if (socket) {
      setIsConnected(true);
      
      // Удаляем старый обработчик если есть
      socket.off('message:new');
      
      // Добавляем новый обработчик
      socket.on('message:new', (message) => {
        console.log('📨 Received message:new', message);
        addMessage(message.chatId, {
          id: message.id || Date.now().toString(),
          content: message.content,
          senderId: message.senderId,
          sender: message.sender,
          firstName: message.sender?.firstName || '',
          lastName: message.sender?.lastName || '',
          avatar: message.sender?.avatar || message.senderAvatar,
          createdAt: message.createdAt,
          type: message.type || 'TEXT',
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          replyToId: message.replyToId,
          replyTo: message.replyTo,
          status: 'delivered'
        });
        if (message.senderId === user?.id) {
          soundManager.playMessageSent();
        } else {
          soundManager.playMessageReceived();
        }
        if (message.chatId === activeChat && message.senderId !== user?.id) {
          markMessagesAsRead(message.chatId);
        }
      });
      
      socket.on('messages:read', (data: any) => {
        console.log('Messages read event:', data);
        if (activeChat) loadMessages(activeChat);
      });
      
      socket.on('message:edited', (message: any) => {
        if (activeChat) loadMessages(activeChat);
      });
      
      socket.on('message:deleted', (data: any) => {
        if (activeChat === data.chatId) loadMessages(activeChat);
      });
      
      socket.on('reaction:updated', (data: any) => {
        if (activeChat) loadMessages(activeChat);
      });
      
      socket.on('message:pinned', (data: any) => {
        if (activeChat) {
          loadMessages(activeChat);
          window.dispatchEvent(new CustomEvent('pins:updated'));
        }
      });
      
      socket.on('typing:start', (data: any) => {
        if (data.chatId === activeChat && data.userId !== user?.id) {
          setTypingUsers(prev => [...new Set([...prev, data.username || 'Пользователь'])]);
        }
      });
      
      socket.on('typing:stop', (data: any) => {
        if (data.chatId === activeChat) {
          setTypingUsers(prev => prev.filter(u => u !== (data.username || 'Пользователь')));
        }
      });
      
      // Слушаем обновление профиля
      socket.on('user:updated', (data: any) => {
        console.log('User updated:', data);
        if (activeChat) loadMessages(activeChat);
        loadChats();
      });
      
      socket.on('chat:joined', (data: any) => {
        console.log('Joined new chat:', data);
        loadChats();
        showNotification('Успех', 'Вы были добавлены в группу');
      });
      
      socket.on('group:new_request', (data: any) => {
        console.log('New group request:', data);
        showNotification('Новая заявка', 'Получена новая заявка на вступление в группу');
      });
      
      return () => {
        socketService.disconnect();
        setIsConnected(false);
      };
    }
  }, [accessToken, user, activeChat, loadMessages, markMessagesAsRead, loadChats]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
      markMessagesAsRead(activeChat);
    }
  }, [activeChat, loadMessages, markMessagesAsRead]);

  const handleSendMessage = useCallback(async () => {
    if (newMessage.trim() && activeChat) {
      const messageData: any = {
        chatId: activeChat,
        content: newMessage.trim(),
        type: 'TEXT'
      };
      if (replyTo) {
        messageData.replyToId = replyTo.id;
        console.log('📎 Setting replyToId in message:', replyTo.id, 'replyTo object:', replyTo);
      }
      console.log('📤 Sending message:', messageData);
      setNewMessage('');
      setReplyTo(null);
      socketService.sendMessage(messageData);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [newMessage, activeChat, replyTo]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!activeChat || !accessToken) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        
        const API_URL = 'http://localhost:3001/api';
        const payload: any = {
          chatId: activeChat,
          imageData: base64Data,
          fileName: file.name
        };
        
        if (replyTo) {
          payload.replyToId = replyTo.id;
        }
        
        const response = await fetch(`${API_URL}/images`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          showNotification('Файл загружен', `${file.name} успешно отправлен`);
          setReplyTo(null);
        } else {
          showNotification('Ошибка', 'Не удалось загрузить файл');
        }
      };
      reader.onerror = () => {
        showNotification('Ошибка', 'Не удалось прочитать файл');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      showNotification('Ошибка', 'Не удалось загрузить файл');
    }
  }, [activeChat, accessToken, showNotification, replyTo]);

  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!accessToken) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/reactions/${messageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ emoji })
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.status === 404) {
        console.error('Сообщение удалено');
        if (activeChat) loadMessages(activeChat);
        return;
      }
      
      if (response.ok && activeChat) {
        loadMessages(activeChat);
      }
    } catch (error) {
      console.error('Ошибка реакции:', error);
    }
  }, [accessToken, activeChat, loadMessages, logout]);

  const handlePin = useCallback(async (messageId: string) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`http://localhost:3001/api/pins/${messageId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        if (activeChat) {
          loadMessages(activeChat);
          window.dispatchEvent(new CustomEvent('pins:updated'));
        }
        soundManager.playSuccess();
        showNotification('Успех', 'Сообщение закреплено');
      } else {
        const error = await response.json();
        showNotification('Ошибка', error.error || 'Не удалось закрепить');
        soundManager.playError();
      }
    } catch (error) {
      console.error('Ошибка закрепления:', error);
      soundManager.playError();
    }
  }, [accessToken, activeChat, loadMessages, showNotification]);

  const handleVoiceMessage = useCallback(async (audioBlob: Blob) => {
    if (!activeChat || !accessToken) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        
        const API_URL = 'http://localhost:3001/api';
        const payload: any = {
          chatId: activeChat,
          imageData: base64Data,
          fileName: 'voice-message.webm',
          type: 'VOICE'
        };
        
        if (replyTo) {
          payload.replyToId = replyTo.id;
        }
        
        const response = await fetch(`${API_URL}/images`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          setReplyTo(null);
          soundManager.playMessageSent();
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
          soundManager.playError();
        }
      };
      
      reader.onerror = () => soundManager.playError();
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Ошибка отправки голосового:', error);
      soundManager.playError();
    }
  }, [activeChat, accessToken, replyTo]);

  // Объявляем currentMessages ДО использования в других функциях
  const currentMessages = activeChat ? messages[activeChat] || [] : [];
  const filteredMessages = searchQuery 
    ? currentMessages.filter(msg => 
        msg.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${msg.firstName} ${msg.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentMessages;
  const currentChatName = chats.find(c => c.id === activeChat)?.name || 'Select chat';

  // Обновляем результаты поиска
  useEffect(() => {
    if (searchQuery && activeChat) {
      const results = currentMessages
        .filter(msg => 
          msg.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${msg.firstName} ${msg.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(msg => msg.id);
      setSearchResults(results);
      setCurrentSearchIndex(0);
      if (results.length > 0) {
        setTimeout(() => {
          const element = document.getElementById(`message-${results[0]}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }
  }, [searchQuery, activeChat]);

  const goToNextSearchResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    const element = document.getElementById(`message-${searchResults[nextIndex]}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const goToPrevSearchResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    const element = document.getElementById(`message-${searchResults[prevIndex]}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onChatSelect={setActiveChat}
        onCreateChat={() => setShowCreateChat(true)}
        onCreateGroupChat={() => setShowCreateGroup(true)}
        onProfileClick={() => setShowProfile(true)}
        onLogout={logout}
        isConnected={isConnected}
      />
      <div className="flex-1">
        <DragDropZone onFileDrop={uploadFile}>
          <div className="h-full flex flex-col">
          {activeChat ? (
            <>
              <div className="glass border-b border-gray-200/60 dark:border-gray-700/60 soft-shadow">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{currentChatName}</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowMembers(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Участники"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Настройки"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowStats(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Статистика"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowMediaGallery(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Медиа"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <div className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Поиск..."
                          className="bg-transparent border-none outline-none text-sm w-32 dark:text-white pl-2"
                        />
                        {searchResults.length > 0 && (
                          <>
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {currentSearchIndex + 1}/{searchResults.length}
                            </span>
                            <button
                              onClick={goToPrevSearchResult}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                              title="Предыдущее"
                            >
                              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={goToNextSearchResult}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                              title="Следующее"
                            >
                              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </>
                        )}
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Очистить"
                          >
                            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <PinnedMessages chatId={activeChat} />
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={(e) => { if (e.target === e.currentTarget) setSelectedMessageId(null); }}>
                <TypingIndicator users={typingUsers} />
                {filteredMessages.map((msg, idx) => {
                  const isOwn = msg.senderId === user?.id;
                  const senderName = msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : `${msg.firstName || ''} ${msg.lastName || ''}`.trim();
                  const senderAvatar = msg.sender?.avatar || msg.avatar;
                  
                  const isSearchResult = searchResults.includes(msg.id);
                  const isCurrentSearchResult = searchResults[currentSearchIndex] === msg.id;
                  
                  return (
                  <div 
                    key={idx} 
                    id={`message-${msg.id}`} 
                    className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'} group relative transition-all cursor-pointer ${
                      isCurrentSearchResult ? 'ring-4 ring-blue-500 rounded-lg' : 
                      isSearchResult ? 'ring-2 ring-blue-300 rounded-lg' : ''
                    } ${selectedMessageId === msg.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedMessageId(msg.id);
                    }}
                  >
                    {!isOwn && (
                      <div 
                        className="flex-shrink-0 cursor-pointer"
                        onClick={() => msg.senderId && setSelectedUserId(msg.senderId)}
                        title={`Профиль ${senderName}`}
                      >
                        {senderAvatar ? (
                          <img src={senderAvatar} alt={senderName} className="w-8 h-8 rounded-full hover:ring-2 hover:ring-blue-500 transition-all" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold hover:ring-2 hover:ring-blue-500 transition-all">
                            {senderName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      {!isOwn && senderName && (
                        <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-1">{senderName}</span>
                      )}
                      <div className="flex flex-col gap-1">
                        {msg.replyToId && (() => {
                          const replyMsg = msg.replyTo || currentMessages.find(m => m.id === msg.replyToId);
                          if (!replyMsg) return null;
                          
                          return (
                            <div 
                              className="group/reply mb-1.5 px-3 py-2.5 glass rounded-xl border-l-3 border-blue-500 cursor-pointer glass-hover"
                              onClick={(e) => {
                                e.stopPropagation();
                                const element = document.getElementById(`message-${msg.replyToId}`);
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  element.classList.add('animate-pulse', 'ring-2', 'ring-blue-400', 'shadow-lg');
                                  setTimeout(() => {
                                    element.classList.remove('animate-pulse', 'ring-2', 'ring-blue-400', 'shadow-lg');
                                  }, 2000);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 group-hover/reply:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
                                  {replyMsg.firstName || replyMsg.sender?.firstName || 'Пользователь'}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed truncate pl-5">
                                {replyMsg.type === 'IMAGE' && '🖼️ Фото'}
                                {replyMsg.type === 'FILE' && `📎 ${replyMsg.fileName || 'Файл'}`}
                                {replyMsg.type === 'VOICE' && '🎤 Голосовое'}
                                {(!replyMsg.type || replyMsg.type === 'TEXT') && (replyMsg.content || 'Сообщение').substring(0, 50)}
                              </p>
                            </div>
                          );
                        })()}
                        <div className={`max-w-md px-4 py-2.5 ${msg.replyToId ? 'rounded-b-2xl' : 'rounded-2xl'} ${isOwn ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' : 'glass dark:text-white soft-shadow'}`}>
                        {msg.type === 'VOICE' && msg.fileUrl ? (
                          <VoiceMessage fileUrl={msg.fileUrl} isOwn={isOwn} />
                        ) : msg.type === 'IMAGE' && msg.fileUrl ? (
                          <div onClick={(e) => e.stopPropagation()}>
                            <ImageMessage
                              src={msg.fileUrl}
                              alt="Image"
                              isOwn={isOwn}
                              onClick={() => {
                                const img = document.createElement('div');
                                img.className = 'fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4';
                                img.onclick = () => img.remove();
                                img.innerHTML = `<img src="${msg.fileUrl}" class="max-w-full max-h-full object-contain" />`;
                                document.body.appendChild(img);
                              }}
                            />
                            {msg.content && msg.content !== msg.fileUrl && (
                              <p className="mt-2 text-sm">{msg.content}</p>
                            )}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <MessageReactions 
                                reactions={msg.reactions}
                                onToggleReaction={(emoji) => handleReaction(msg.id, emoji)}
                              />
                            )}
                          </div>
                        ) : msg.type === 'FILE' && msg.fileName ? (
                          <div className="space-y-2">
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                const fileType = msg.fileUrl?.split(';')[0].split(':')[1] || '';
                                setPreviewFile({ url: msg.fileUrl || '', name: msg.fileName || '', type: fileType });
                              }}
                              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <div className="text-left flex-1">
                                <p className="text-sm font-medium">{msg.fileName}</p>
                                <p className="text-xs opacity-70">Нажмите для просмотра</p>
                              </div>
                            </div>
                            {(msg.fileName?.endsWith('.mp3') || msg.fileName?.endsWith('.wav') || msg.fileName?.endsWith('.ogg')) && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch('http://localhost:3001/api/saved-audio', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${accessToken}`
                                      },
                                      body: JSON.stringify({ messageId: msg.id })
                                    });
                                    if (response.ok) {
                                      showNotification('Успех', 'Аудио сохранено');
                                    } else {
                                      const error = await response.json();
                                      showNotification('Ошибка', error.error || 'Не удалось сохранить');
                                    }
                                  } catch (error) {
                                    console.error('Error saving audio:', error);
                                    showNotification('Ошибка', 'Не удалось сохранить');
                                  }
                                }}
                                className="w-full px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                Сохранить аудио
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            <MarkdownMessage content={msg.content} />
                            {msg.content.match(/https?:\/\/[^\s]+/) && (
                              <LinkPreview url={msg.content.match(/https?:\/\/[^\s]+/)?.[0] || ''} />
                            )}
                          </>
                        )}
                        {msg.type !== 'IMAGE' && msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <MessageReactions 
                            reactions={msg.reactions}
                            onToggleReaction={(emoji) => handleReaction(msg.id, emoji)}
                          />
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs opacity-70">
                            {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.isEdited && (
                            <span className="text-xs opacity-70" title={`Отредактировано ${new Date(msg.editedAt || msg.createdAt).toLocaleString('ru-RU')}`}>
                              ✏️ изм.
                            </span>
                          )}
                          {isOwn && (
                            <div className="flex items-center gap-1">
                              <span className={`text-xs flex items-center ${msg.status === 'read' || msg.isRead ? 'text-blue-400' : 'opacity-70'}`} title={msg.totalMembers > 1 ? `Прочитали: ${msg.readCount}/${msg.totalMembers}` : (msg.status === 'read' || msg.isRead ? 'Прочитано' : 'Доставлено')}>
                                {msg.status === 'read' || msg.isRead ? '✓✓' : '✓'}
                              </span>
                              {msg.totalMembers > 1 && msg.isRead && (
                                <span className={`text-[10px] font-medium ${msg.readCount >= msg.totalMembers ? 'text-green-400' : 'text-blue-400'}`}>
                                  {msg.readCount}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        </div>
                        {selectedMessageId === msg.id && (
                          <div className="absolute right-0 top-0 flex flex-col gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-2 z-10 min-w-[180px]">
                            <button onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, '👍'); setSelectedMessageId(null); }} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left text-sm transition-colors">
                              <span>👍</span><span className="text-gray-700 dark:text-gray-300">Нравится</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, '❤️'); setSelectedMessageId(null); }} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left text-sm transition-colors">
                              <span>❤️</span><span className="text-gray-700 dark:text-gray-300">Любовь</span>
                            </button>
                            <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                            <button onClick={(e) => { 
                              e.stopPropagation(); 
                              console.log('📎 Setting replyTo:', msg);
                              setReplyTo(msg); 
                              setSelectedMessageId(null); 
                            }} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left text-sm transition-colors">
                              <span>↩️</span><span className="text-gray-700 dark:text-gray-300">Ответить</span>
                            </button>
                            {isOwn && msg.type === 'TEXT' && (
                              <button onClick={(e) => { e.stopPropagation(); setEditingMessage({ id: msg.id, content: msg.content }); setSelectedMessageId(null); }} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left text-sm transition-colors">
                                <span>✏️</span><span className="text-gray-700 dark:text-gray-300">Редактировать</span>
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); handlePin(msg.id); setSelectedMessageId(null); }} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left text-sm transition-colors">
                              <span>📌</span><span className="text-gray-700 dark:text-gray-300">Закрепить</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setForwardingMessage(msg.id); setSelectedMessageId(null); }} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left text-sm transition-colors">
                              <span>➡️</span><span className="text-gray-700 dark:text-gray-300">Переслать</span>
                            </button>
                            {isOwn && (
                              <>
                                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                                <button onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setDeleteConfirmId(msg.id);
                                  setSelectedMessageId(null);
                                }} className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 rounded text-left text-sm transition-colors font-medium">
                                  <span>🗑️</span><span>Удалить</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {isOwn && (
                      <div className="flex-shrink-0">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-gray-200/60 dark:border-gray-700/60 glass">
                {replyTo && (
                  <div className="mb-3 p-3 glass rounded-2xl border border-blue-200/60 dark:border-blue-800/60 soft-shadow animate-slide-in-from-bottom">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-1 h-full bg-blue-500 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                            {replyTo.sender?.firstName || replyTo.firstName || 'Пользователь'}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm truncate">
                          {replyTo.type === 'IMAGE' && '🖼️ Фото'}
                          {replyTo.type === 'FILE' && `📎 ${replyTo.fileName || 'Файл'}`}
                          {replyTo.type === 'VOICE' && '🎤 Голосовое'}
                          {(!replyTo.type || replyTo.type === 'TEXT') && (replyTo.content?.substring(0, 50) + (replyTo.content?.length > 50 ? '...' : ''))}
                        </p>
                      </div>
                      <button 
                        onClick={() => setReplyTo(null)} 
                        className="flex-shrink-0 p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Отменить"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-xl transition-all duration-200 hover:scale-105"
                    title="Прикрепить файл"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-xl transition-all duration-200 hover:scale-105"
                    title="Эмодзи"
                  >
                    😊
                  </button>
                  <TelegramVoiceRecorder
                    onRecordComplete={handleVoiceMessage}
                    onRecordingChange={setIsRecordingVoice}
                  />
                  {showEmojiPicker && (
                    <EmojiPickerComponent
                      onEmojiSelect={(emoji) => {
                        setNewMessage(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  )}
                  {!isRecordingVoice && (
                    <>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Введите сообщение..."
                        rows={1}
                        className="flex-1 px-4 py-2.5 glass rounded-2xl dark:text-white resize-none overflow-hidden focus:ring-2 focus:ring-blue-500/50 transition-all"
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                        }}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 disabled:hover:scale-100"
                      >
                        Отправить
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-transparent">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Welcome!</h3>
                <p className="text-gray-600 dark:text-gray-400">Select a chat to start messaging</p>
              </div>
            </div>
          )}
          </div>
        </DragDropZone>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setPreviewFile(null)}>
          <div className="relative w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{previewFile.name}</h3>
                  <p className="text-gray-400 text-sm">{previewFile.type || 'Неизвестный тип'}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  className="px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium shadow-lg hover:shadow-blue-500/50 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Скачать</span>
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-medium backdrop-blur-sm"
                >
                  Закрыть
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
              {previewFile.type.startsWith('image/') ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
              ) : previewFile.type.startsWith('video/') ? (
                <video src={previewFile.url} controls className="max-w-full max-h-full rounded-lg shadow-2xl" />
              ) : previewFile.type.startsWith('audio/') ? (
                <div className="w-full max-w-2xl">
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <div className="flex items-center justify-center mb-8">
                      <div className="relative">
                        <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                          <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                          </svg>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                      </div>
                    </div>
                    <h3 className="text-white text-xl font-bold text-center mb-2">{previewFile.name}</h3>
                    <p className="text-gray-300 text-sm text-center mb-6">Аудио файл</p>
                    <audio src={previewFile.url} controls className="w-full" style={{filter: 'invert(1) hue-rotate(180deg)'}} />
                  </div>
                </div>
              ) : previewFile.type === 'application/pdf' || previewFile.name.endsWith('.pdf') ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="text-center mb-6">
                    <div className="w-24 h-24 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.5h8v1H8v-1zm0-2.5h8v1H8v-1zm0-2.5h5v1H8v-1z" />
                      </svg>
                    </div>
                    <h3 className="text-white text-xl font-bold mb-2">PDF Документ</h3>
                    <p className="text-gray-400 mb-6">{previewFile.name}</p>
                    <div className="flex space-x-3 justify-center">
                      <button
                        onClick={() => {
                          const byteString = atob(previewFile.url.split(',')[1]);
                          const mimeString = previewFile.url.split(',')[0].split(':')[1].split(';')[0];
                          const ab = new ArrayBuffer(byteString.length);
                          const ia = new Uint8Array(ab);
                          for (let i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                          }
                          const blob = new Blob([ab], { type: mimeString });
                          const blobUrl = URL.createObjectURL(blob);
                          window.open(blobUrl, '_blank');
                        }}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium shadow-lg hover:shadow-blue-500/50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Открыть в новой вкладке</span>
                      </button>
                      <a
                        href={previewFile.url}
                        download={previewFile.name}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium shadow-lg hover:shadow-green-500/50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Скачать</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : previewFile.type.startsWith('text/') || previewFile.name.match(/\.(txt|md|json|xml|html|css|js|ts|py|java|cpp|c|h)$/i) ? (
                <div className="w-full max-w-4xl max-h-[80vh] bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
                  <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                    <p className="text-gray-400 text-sm font-mono">{previewFile.name}</p>
                  </div>
                  <iframe src={previewFile.url} className="w-full h-full min-h-[500px]" style={{colorScheme: 'dark', background: '#1a1a1a'}} />
                </div>
              ) : (
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-3xl flex items-center justify-center shadow-2xl">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 rounded-3xl blur-2xl opacity-30"></div>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">Предпросмотр недоступен</h3>
                  <p className="text-gray-400 mb-6">Данный тип файла не поддерживает предпросмотр</p>
                  <a
                    href={previewFile.url}
                    download={previewFile.name}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium shadow-lg hover:shadow-blue-500/50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Скачать файл</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Profile Settings Modal */}
      {showProfile && !selectedUserId && (
        <EnhancedProfileSettings
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Friend Profile Modal */}
      {selectedUserId && (
        <UserProfile
          userId={selectedUserId}
          isOpen={true}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Forward Modal */}
      {forwardingMessage && (
        <ForwardModal
          messageId={forwardingMessage}
          onClose={() => setForwardingMessage(null)}
        />
      )}

      {/* Chat Members */}
      {activeChat && showMembers && (
        <ChatMembers
          chatId={activeChat}
          isOpen={showMembers}
          onClose={() => setShowMembers(false)}
        />
      )}

      {/* Chat Settings */}
      {activeChat && showSettings && (
        <ChatSettings
          chatId={activeChat}
          chat={chats.find(c => c.id === activeChat)}
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Chat Stats */}
      {activeChat && showStats && (
        <ChatStats
          chatId={activeChat}
          isOpen={showStats}
          onClose={() => setShowStats(false)}
        />
      )}

      {/* Create Chat Modal */}
      {showCreateChat && (
        <CreateChatModal
          isOpen={showCreateChat}
          onClose={() => setShowCreateChat(false)}
          onCreateChat={async (name, type, username) => {
            try {
              const response = await fetch('http://localhost:3001/api/chats', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify({ name, type, username })
              });
              if (response.ok) {
                const newChat = await response.json();
                loadChats();
                setActiveChat(newChat.id);
                soundManager.playSuccess();
                const usernameText = username ? ` (@${username})` : '';
                showNotification('Успех', `Чат "${name}"${usernameText} создан`);
              } else {
                const error = await response.json();
                soundManager.playError();
                showNotification('Ошибка', error.error || 'Не удалось создать чат');
              }
            } catch (error) {
              console.error('Ошибка создания чата:', error);
              soundManager.playError();
              showNotification('Ошибка', 'Не удалось создать чат');
            }
          }}
        />
      )}

      {/* Create Group Chat */}
      {showCreateGroup && (
        <CreateGroupChat
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          onCreated={() => {
            setShowCreateGroup(false);
            loadChats();
          }}
        />
      )}

      {/* Media Gallery */}
      {activeChat && (
        <ChatMediaGallery
          chatId={activeChat}
          isOpen={showMediaGallery}
          onClose={() => setShowMediaGallery(false)}
          messages={currentMessages}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setDeleteConfirmId(null)}>
          <div className="glass rounded-3xl w-full max-w-sm soft-shadow-lg animate-slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">Удалить сообщение?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">Это действие нельзя отменить</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2.5 glass hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-medium transition-all duration-200 hover:scale-105"
                >
                  Отмена
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`http://localhost:3001/api/messages/${deleteConfirmId}`, { 
                        method: 'DELETE', 
                        headers: { 'Authorization': `Bearer ${accessToken}` } 
                      });
                      if (response.ok && activeChat) { 
                        loadMessages(activeChat); 
                        soundManager.playSuccess(); 
                      }
                    } catch (error) {
                      console.error(error);
                      soundManager.playError();
                    }
                    setDeleteConfirmId(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:from-red-600 hover:to-red-700 font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/30"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Message Modal */}
      {editingMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setEditingMessage(null)}>
          <div className="glass rounded-3xl w-full max-w-lg soft-shadow-lg animate-slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 tracking-tight">✏️ Редактировать сообщение</h3>
              <textarea
                value={editingMessage.content}
                onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                className="w-full px-4 py-3 glass rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none resize-none transition-all"
                rows={5}
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setEditingMessage(null)}
                  className="flex-1 px-4 py-2.5 glass hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-medium transition-all duration-200 hover:scale-105"
                >
                  Отмена
                </button>
                <button
                  onClick={async () => {
                    if (!editingMessage.content.trim()) return;
                    try {
                      const response = await fetch(`http://localhost:3001/api/messages/${editingMessage.id}`, {
                        method: 'PUT',
                        headers: { 
                          'Content-Type': 'application/json', 
                          'Authorization': `Bearer ${accessToken}` 
                        },
                        body: JSON.stringify({ content: editingMessage.content.trim() })
                      });
                      if (response.ok) {
                        setEditingMessage(null);
                        if (activeChat) loadMessages(activeChat);
                      }
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ImprovedChatPage;
