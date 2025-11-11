// Базовые типы пользователей
export interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  status?: UserStatus;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type UserStatus = 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY';

// Типы чатов
export interface Chat {
  id: string;
  name?: string;
  groupname?: string;
  type: ChatType;
  avatar?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  members?: ChatMember[];
  lastMessage?: any;
  unreadCount?: number;
  memberCount?: number;
}

export type ChatType = 'DIRECT' | 'GROUP' | 'CHANNEL';
export type ChatRole = 'MEMBER' | 'MODERATOR' | 'ADMIN';

export interface ChatMember {
  id: string;
  userId: string;
  chatId: string;
  role: ChatRole;
  joinedAt: string;
  user?: Pick<User, 'id' | 'username' | 'firstName' | 'lastName' | 'avatar' | 'status'>;
}

// Типы сообщений
export interface Message {
  id: string;
  content: string;
  type?: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  senderId: string;
  chatId?: string;
  replyToId?: string;
  isEdited?: boolean;
  editedAt?: string;
  originalContent?: string;
  createdAt: string;
  updatedAt?: string;
  firstName?: string;
  lastName?: string;
  sender?: any;
  replyTo?: any;
  status?: string;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';

export interface ReadReceipt {
  id: string;
  userId: string;
  messageId: string;
  readAt: string;
  user?: User;
}

// Типы аутентификации
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: UserRole;
}

// Типы для Socket.io
export interface TypingUser {
  userId: string;
  chatId: string;
  user?: Pick<User, 'username' | 'firstName' | 'lastName'>;
}

export interface SocketError {
  message: string;
  code?: string;
}

// Типы для API ответов
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
}

export interface UsersResponse {
  users: User[];
  hasMore: boolean;
}

// Типы для форм
export interface MessageFormData {
  content: string;
  type?: MessageType;
  replyToId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface ChatFormData {
  name?: string;
  type: ChatType;
  description?: string;
  memberIds: string[];
}

export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status?: UserStatus;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

// Типы для состояния приложения
export interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, TypingUser[]>;
  loading: boolean;
  error: string | null;
}

export interface UserState {
  users: User[];
  onlineUsers: User[];
  loading: boolean;
  error: string | null;
}

// Утилитарные типы
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Константы
export const USER_ROLES: Record<UserRole, string> = {
  STUDENT: 'Студент',
  TEACHER: 'Преподаватель',
  ADMIN: 'Администратор'
};

export const USER_STATUSES: Record<UserStatus, string> = {
  ONLINE: 'В сети',
  OFFLINE: 'Не в сети',
  AWAY: 'Отошел',
  BUSY: 'Занят'
};

export const CHAT_TYPES: Record<ChatType, string> = {
  DIRECT: 'Личный чат',
  GROUP: 'Групповой чат',
  CHANNEL: 'Канал'
};

export const MESSAGE_TYPES: Record<MessageType, string> = {
  TEXT: 'Текст',
  IMAGE: 'Изображение',
  FILE: 'Файл',
  VOICE: 'Голосовое сообщение'
};
