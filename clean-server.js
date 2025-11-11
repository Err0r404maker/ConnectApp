import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import crypto from 'crypto';

const app = express();
const server = createServer(app);

// Проверяем наличие необходимых переменных окружения
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex');
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET не установлен, используется случайный ключ');
}

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Безопасная CORS политика
app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, мобильные приложения)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:5173', 'http://localhost:3000'];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Не разрешено CORS политикой'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
app.use(express.json({ limit: '1mb' }));

// Тестовые данные (пароли из переменных окружения)
const users = [
  { 
    id: '1', 
    email: process.env.DEMO_EMAIL || 'demo@example.com', 
    password: process.env.DEMO_PASSWORD || '<demo_password>', 
    firstName: 'Демо', 
    lastName: 'Пользователь', 
    role: 'STUDENT' 
  }
];

const chats = [
  { id: 'general', name: 'Общий чат', type: 'GROUP', unreadCount: 0 }
];

// CSRF защита
const csrfTokens = new Map();
const generateCSRFToken = () => crypto.randomBytes(32).toString('hex');

app.get('/api/csrf-token', (req, res) => {
  const token = generateCSRFToken();
  const sessionId = req.ip + req.get('User-Agent');
  csrfTokens.set(sessionId, { token, timestamp: Date.now() });
  res.json({ csrfToken: token });
});

const csrfProtection = (req, res, next) => {
  if (req.method === 'GET') return next();
  
  const token = req.headers['x-csrf-token'];
  const sessionId = req.ip + req.get('User-Agent');
  const tokenData = csrfTokens.get(sessionId);
  
  if (!token || !tokenData || tokenData.token !== token) {
    return res.status(403).json({ error: 'Недействительный CSRF токен' });
  }
  
  // Токен действителен 10 минут
  if (Date.now() - tokenData.timestamp > 600000) {
    csrfTokens.delete(sessionId);
    return res.status(403).json({ error: 'CSRF токен истек' });
  }
  
  next();
};

// Middleware для проверки аутентификации
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Недействительный токен' });
  }
};

// Аутентификация
app.post('/api/auth/login', csrfProtection, (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    
    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    
    res.json({
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Чаты (требует аутентификации)
app.get('/api/chats', requireAuth, (req, res) => {
  res.json(chats);
});

// Сообщения (требует аутентификации)
app.get('/api/messages/:chatId', requireAuth, (req, res) => {
  res.json({ messages: [] });
});

app.get('/api/simple-images/:chatId', requireAuth, (req, res) => {
  res.json([]);
});

// Socket.io с базовой аутентификацией
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Токен не предоставлен'));
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Недействительный токен'));
  }
});

io.on('connection', (socket) => {
  console.log(`Пользователь ${socket.userId} подключился`);
  
  socket.on('message:send', (data) => {
    try {
      if (!data || !data.content || !data.chatId) {
        return socket.emit('error', { message: 'Недостаточно данных' });
      }
      
      if (data.content.length > 1000) {
        return socket.emit('error', { message: 'Сообщение слишком длинное' });
      }
      
      // Санитизация контента
      const sanitizedContent = data.content.replace(/<script[^>]*>.*?<\/script>/gi, '').trim();
      
      const message = {
        id: crypto.randomUUID(),
        content: sanitizedContent,
        senderId: socket.userId,
        chatId: data.chatId,
        createdAt: new Date().toISOString(),
        firstName: 'Демо',
        lastName: 'Пользователь'
      };
      
      io.emit('message:new', message);
    } catch (error) {
      socket.emit('error', { message: 'Ошибка отправки сообщения' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`Пользователь ${socket.userId} отключился`);
  });
});

const PORT = process.env.PORT || 3003;

server.listen(PORT, () => {
  console.log(`🚀 Чистый сервер запущен на порту ${PORT}`);
}).on('error', (err) => {
  process.exit(1);
});