import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../database.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Пригласить пользователя по username
router.post('/user', authenticateToken, async (req, res) => {
  try {
    const { chatId, username } = req.body;
    const userId = req.user.id;

    const membership = await db.getAsync(
      'SELECT role FROM chat_members WHERE userId = ? AND chatId = ?',
      [userId, chatId]
    );

    if (!membership) {
      return res.status(403).json({ error: 'Вы не участник этого чата' });
    }

    const targetUser = await db.getAsync('SELECT id FROM users WHERE username = ?', [username]);
    if (!targetUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const existing = await db.getAsync(
      'SELECT id FROM chat_members WHERE userId = ? AND chatId = ?',
      [targetUser.id, chatId]
    );

    if (existing) {
      return res.status(409).json({ error: 'Пользователь уже в чате' });
    }

    await db.runAsync(
      'INSERT INTO chat_members (id, userId, chatId, role, joinedAt) VALUES (?, ?, ?, ?, ?)',
      [randomUUID(), targetUser.id, chatId, 'MEMBER', new Date().toISOString()]
    );

    res.json({ message: 'Пользователь приглашен' });
  } catch (error) {
    console.error('Ошибка приглашения:', error.message);
    res.status(500).json({ error: 'Ошибка приглашения' });
  }
});







export default router;
