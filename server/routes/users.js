import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../database.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function createUserRoutes(io) {
  const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/avatars/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены'));
    }
  }
});

// Получить профиль пользователя
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await db.getAsync(
      'SELECT id, email, username, firstName, lastName, role, avatar, status, settings, createdAt FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Парсим настройки
    if (user.settings) {
      try {
        user.settings = JSON.parse(user.settings);
      } catch (e) {
        user.settings = null;
      }
    }
    
    res.json(user);
  } catch (error) {
    console.error('Ошибка получения профиля:', error.message);
    res.status(500).json({ error: 'Ошибка получения профиля' });
  }
});

// Обновить профиль пользователя
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, username, email, avatar, currentPassword, newPassword, settings } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Имя и фамилия обязательны' });
    }

    if (username) {
      if (username.length < 3) {
        return res.status(400).json({ error: 'Username должен быть минимум 3 символа' });
      }
      const existing = await db.getAsync('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
      if (existing) {
        return res.status(409).json({ error: 'Username уже занят' });
      }
    }
    
    if (email) {
      const existing = await db.getAsync('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existing) {
        return res.status(409).json({ error: 'Email уже занят' });
      }
    }
    
    // Если меняется пароль
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Введите текущий пароль' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
      }
      
      const user = await db.getAsync('SELECT password FROM users WHERE id = ?', [userId]);
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isValid) {
        return res.status(400).json({ error: 'Неверный текущий пароль' });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.runAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    }
    
    // Сохраняем настройки как JSON
    const settingsJson = settings ? JSON.stringify(settings) : null;
    
    const { bio } = req.body;
    
    await db.runAsync(
      'UPDATE users SET firstName = ?, lastName = ?, username = ?, email = ?, avatar = ?, bio = ?, settings = ?, updatedAt = ? WHERE id = ?',
      [firstName.trim(), lastName.trim(), username?.trim() || null, email?.trim() || null, avatar || null, bio?.trim() || null, settingsJson, new Date().toISOString(), userId]
    );
    
    const updatedUser = await db.getAsync(
      'SELECT id, email, username, firstName, lastName, role, avatar, status, settings, createdAt FROM users WHERE id = ?',
      [userId]
    );
    
    // Парсим настройки обратно в объект
    if (updatedUser.settings) {
      try {
        updatedUser.settings = JSON.parse(updatedUser.settings);
      } catch (e) {
        updatedUser.settings = null;
      }
    }
    
    // Broadcast обновление профиля всем
    io.emit('user:profile_updated', {
      userId: updatedUser.id,
      username: updatedUser.username,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      avatar: updatedUser.avatar
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Ошибка обновления профиля:', error.message);
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
});



// Загрузить аватар
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    
    const userId = req.user.id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    await db.runAsync(
      'UPDATE users SET avatar = ?, updatedAt = ? WHERE id = ?',
      [avatarUrl, new Date().toISOString(), userId]
    );
    
    res.json({ 
      message: 'Аватар загружен',
      avatarUrl: `http://localhost:3002${avatarUrl}`
    });
  } catch (error) {
    console.error('Ошибка загрузки аватара:', error.message);
    res.status(500).json({ error: 'Ошибка загрузки аватара' });
  }
});

// Получить список пользователей
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT id, username, firstName, lastName, role, avatar, status, lastSeen
      FROM users
    `;
    let params = [];
    
    if (search) {
      query += ` WHERE firstName LIKE ? OR lastName LIKE ? OR username LIKE ?`;
      const searchTerm = `%${search}%`;
      params = [searchTerm, searchTerm, searchTerm];
    }
    
    query += ` ORDER BY firstName, lastName LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const users = await db.allAsync(query, params);
    
    res.json(users);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error.message);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

// Получить пользователя по ID (должен быть после '/')
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await db.getAsync(
      'SELECT id, email, username, firstName, lastName, role, avatar, status, bio, settings, lastSeen FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    if (user.settings) {
      try {
        user.settings = JSON.parse(user.settings);
      } catch (e) {
        user.settings = null;
      }
    }
    
    res.json(user);
  } catch (error) {
    console.error('Ошибка получения пользователя:', error.message);
    res.status(500).json({ error: 'Ошибка получения пользователя' });
  }
});

  return router;
}