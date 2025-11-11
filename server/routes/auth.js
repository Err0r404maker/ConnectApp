import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database.js';
import { randomUUID } from 'crypto';
import { authRateLimit } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();



// Rate limiting отключен для тестирования
// const registerLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000,
//   max: 3,
//   message: { error: 'Слишком много попыток регистрации' }
// });

// Строгая валидация
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email) && email.length <= 254;
};

const validateRequired = (value) => {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 255 && !/[<>\"'&]/.test(trimmed);
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6 && password.length <= 128;
};

const validateRole = (role) => ['STUDENT', 'TEACHER', 'ADMIN'].includes(role);

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>\"'&]/g, '');
};

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { email, username, firstName, lastName, password, role = 'STUDENT' } = req.body;

    // Строгая валидация
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Неверный формат email' });
    }
    if (!validateRequired(username) || !validateRequired(firstName) || !validateRequired(lastName)) {
      return res.status(400).json({ error: 'Все поля обязательны и не должны содержать специальные символы' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        error: 'Пароль должен содержать минимум 6 символов' 
      });
    }
    if (!validateRole(role)) {
      return res.status(400).json({ error: 'Недопустимая роль' });
    }

    // Санитизация входных данных
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedFirstName = sanitizeInput(firstName);
    const sanitizedLastName = sanitizeInput(lastName);

    // Хешируем пароль до проверки пользователя для защиты от timing attacks
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Проверка существования пользователя с использованием параметризованных запросов
    const existingUser = await db.getAsync(
      'SELECT email, username FROM users WHERE email = ? OR username = ? LIMIT 1',
      [sanitizedEmail, sanitizedUsername]
    );

    if (existingUser) {
      // Не раскрываем какое именно поле занято для безопасности
      return res.status(409).json({ error: 'Пользователь с такими данными уже существует' });
    }
    const userId = randomUUID();

    // Создание пользователя в транзакции
    await db.runAsync('BEGIN TRANSACTION');
    
    try {
      await db.runAsync(
        'INSERT INTO users (id, email, username, firstName, lastName, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, sanitizedEmail, sanitizedUsername, sanitizedFirstName, sanitizedLastName, hashedPassword, role]
      );
      
      await db.runAsync('COMMIT');
    } catch (dbError) {
      await db.runAsync('ROLLBACK');
      throw dbError;
    }

    const user = {
      id: userId,
      email: sanitizedEmail,
      username: sanitizedUsername,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      role,
      createdAt: new Date().toISOString()
    };

    // Генерация токенов
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { 
        expiresIn: '15m', 
        issuer: 'college-messenger',
        algorithm: 'HS256'
      }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { 
        expiresIn: '7d', 
        issuer: 'college-messenger',
        algorithm: 'HS256'
      }
    );

    // Устанавливаем безопасные заголовки
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    });

    res.status(201).json({
      user,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Пользователь уже существует' });
    }
    
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Вход
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validateEmail(email) || !password) {
      return res.status(400).json({ error: 'Неверный формат данных' });
    }

    const sanitizedEmail = email.toLowerCase().trim();

    // Безопасный поиск пользователя
    const user = await db.getAsync(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [sanitizedEmail]
    );

    if (!user) {
      // Защита от timing attacks - выполняем хеширование даже если пользователь не найден
      await bcrypt.hash('dummy-password', 12);
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    // Обновление статуса в транзакции
    await db.runAsync('BEGIN TRANSACTION');
    try {
      await db.runAsync(
        'UPDATE users SET status = ?, lastSeen = CURRENT_TIMESTAMP WHERE id = ?',
        ['ONLINE', user.id]
      );
      await db.runAsync('COMMIT');
    } catch (dbError) {
      await db.runAsync('ROLLBACK');
      console.error('Status update error:', dbError.message);
    }

    // Генерация токенов
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { 
        expiresIn: '15m', 
        issuer: 'college-messenger',
        algorithm: 'HS256'
      }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { 
        expiresIn: '7d', 
        issuer: 'college-messenger',
        algorithm: 'HS256'
      }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    });

    res.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление токена
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(401).json({ error: 'Refresh token отсутствует' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
      issuer: 'college-messenger',
      algorithms: ['HS256']
    });
    
    const user = await db.getAsync(
      'SELECT id, email, username, firstName, lastName, role FROM users WHERE id = ? LIMIT 1',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { 
        expiresIn: '15m', 
        issuer: 'college-messenger',
        algorithm: 'HS256'
      }
    );

    res.json({ accessToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token истек' });
    }
    console.error('Token refresh error:', error.name);
    res.status(403).json({ error: 'Недействительный refresh token' });
  }
});

// Выход
router.post('/logout', async (req, res) => {
  try {
    res.json({ message: 'Успешный выход' });
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({ error: 'Ошибка выхода' });
  }
});

export default router;