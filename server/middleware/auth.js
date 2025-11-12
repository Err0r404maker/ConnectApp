import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

// Rate limiting для аутентификации (отключен в dev)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // Мягче в dev, но не отключаем
  message: { error: 'Слишком много попыток входа' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    return crypto.createHash('sha256').update(ip + userAgent).digest('hex');
  }
});

// Валидация JWT секрета
const validateJWTSecret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET должен быть не менее 32 символов');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET должен быть не менее 32 символов');
  }
};

export const authenticateToken = async (req, res, next) => {
  try {
    validateJWTSecret();
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка конфигурации сервера' });
  }
  
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен доступа отсутствует' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Базовая валидация токена
  if (!token || token.length < 10) {
    return res.status(401).json({ error: 'Недействительный формат токена' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // Явно указываем алгоритм
      issuer: 'college-messenger',
      maxAge: '15m'
    });
    
    if (!decoded.userId || typeof decoded.userId !== 'string') {
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    
    // Дополнительная проверка роли если есть
    if (decoded.role && !['STUDENT', 'TEACHER', 'ADMIN'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Недействительная роль' });
    }
    
    req.user = { 
      id: decoded.userId,
      role: decoded.role 
    };
    next();
  } catch (error) {
    let errorMessage = 'Ошибка аутентификации';
    let statusCode = 403;
    
    switch (error.name) {
      case 'TokenExpiredError':
        errorMessage = 'Токен истек';
        statusCode = 401;
        break;
      case 'JsonWebTokenError':
        errorMessage = 'Недействительный токен';
        statusCode = 403;
        break;
      case 'NotBeforeError':
        errorMessage = 'Токен еще не активен';
        statusCode = 403;
        break;
      default:
        // Не раскрываем детали внутренних ошибок
        console.error('Ошибка JWT:', error.message);
    }
    
    return res.status(statusCode).json({ error: errorMessage });
  }
};

export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token || typeof token !== 'string' || token.length < 10) {
      return next(new Error('Недействительный токен'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'college-messenger',
      maxAge: '15m'
    });
    
    if (!decoded.userId || typeof decoded.userId !== 'string') {
      return next(new Error('Недействительный токен'));
    }
    
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    let errorMessage = 'Недействительный токен';
    
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Токен истек';
    }
    
    // Не логируем чувствительную информацию
    console.error('Socket auth error:', error.name);
    next(new Error(errorMessage));
  }
};

// Middleware для проверки ролей
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Роль не определена' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    next();
  };
};

// Middleware для проверки владельца ресурса
export const requireOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (ownerId !== req.user.id && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Нет доступа к ресурсу' });
      }
      
      next();
    } catch (error) {
      console.error('Ownership check error:', error.message);
      return res.status(500).json({ error: 'Ошибка проверки прав' });
    }
  };
};