import dotenv from 'dotenv';
dotenv.config();

// Проверяем наличие обязательных переменных окружения
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('❌ Критическая ошибка: JWT_SECRET и JWT_REFRESH_SECRET должны быть установлены в .env');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.length < 32) {
  console.error('❌ Критическая ошибка: JWT секреты должны быть минимум 32 символа');
  process.exit(1);
}

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import createUserRoutes from './routes/users.js';
import chatRoutes from './routes/chats-simple.js';
import messageRoutes from './routes/messages.js';
import createImageRoutes from './routes/simple-images.js';
import inviteRoutes from './routes/invites.js';
import chatInviteRoutes from './routes/chat-invites.js';
import createFriendsRoutes from './routes/friends.js';
import createReactionsRoutes from './routes/reactions.js';
import createPinsRoutes from './routes/pins.js';
import createMessageReadsRoutes from './routes/message-reads.js';
import createForwardRoutes from './routes/forward.js';
import linkPreviewRoutes from './routes/link-preview.js';
import chatStatsRoutes from './routes/chat-stats.js';
import savedAudioRoutes from './routes/saved-audio.js';
import { authenticateSocket } from './middleware/auth.js';
import { setupSocketHandlers } from './socket/handlers.js';

const app = express();
const server = createServer(app);

// Socket.io setup
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:5173', 'http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true
});

// Глобальный rate limiting (смягчен в dev режиме)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 2000 : 1000, // Разумные лимиты в dev
  message: { error: 'Слишком много запросов с вашего IP' },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:3001"],
      connectSrc: ["'self'", "ws:", "wss:", "http://localhost:3001"]
    }
  }
}));
app.use(compression());
// CORS для разработки
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use(globalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы с CORS
const uploadsPath = path.resolve(__dirname, 'uploads');
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsPath, {
  dotfiles: 'deny',
  index: false,
  redirect: false
}));

// Простая защита от CSRF в dev режиме
if (process.env.NODE_ENV !== 'development') {
  app.use((req, res, next) => {
    const origin = req.get('Origin') || req.get('Referer');
    if (req.method !== 'GET' && origin && !origin.includes('localhost')) {
      return res.status(403).json({ error: 'Недопустимый источник' });
    }
    next();
  });
}

// Логирование запросов в development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', createUserRoutes(io));
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/images', createImageRoutes(io));
app.use('/api/simple-images', createImageRoutes(io));
app.use('/api/invites', inviteRoutes);
app.use('/api/chat-invites', chatInviteRoutes);
app.use('/api/friends', createFriendsRoutes(io));
app.use('/api/reactions', createReactionsRoutes(io));
app.use('/api/pins', createPinsRoutes(io));
app.use('/api/message-reads', createMessageReadsRoutes(io));
app.use('/api/forward', createForwardRoutes(io));
app.use('/api/link-preview', linkPreviewRoutes);
app.use('/api/chats', chatStatsRoutes);
app.use('/api/saved-audio', savedAudioRoutes);

// Socket authentication
io.use(authenticateSocket);

// Socket handlers
setupSocketHandlers(io);



// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// API информация
app.get('/api', (req, res) => {
  res.json({
    name: 'College Messenger API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      chats: '/api/chats',
      messages: '/api/messages'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint не найден' });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  // Логируем только необходимую информацию
  const errorInfo = {
    message: err.message,
    status: err.status || 500,
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorInfo.stack = err.stack;
  }
  
  console.error('Глобальная ошибка:', errorInfo);
  
  const status = err.status || 500;
  res.status(status).json({
    error: status >= 500 && process.env.NODE_ENV === 'production' 
      ? 'Внутренняя ошибка сервера' 
      : err.message
  });
});

const PORT = process.env.PORT || 3001;

// Инициализируем базу данных и запускаем сервер
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📊 Окружение: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
    console.log(`❤️ Health: http://localhost:${PORT}/health`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Порт ${PORT} уже используется`);
      process.exit(1);
    } else {
      console.error(`❌ Ошибка запуска сервера:`, err.message);
      process.exit(1);
    }
  });
}).catch((error) => {
  console.error('❌ Ошибка инициализации базы данных:', error.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Завершение работы сервера...');
  server.close(() => {
    console.log('✅ Сервер остановлен');
    process.exit(0);
  });
});