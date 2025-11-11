import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../database.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Отправить приглашение в чат
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { chatId, username } = req.body;
    const fromUserId = req.user.id;

    const targetUser = await db.getAsync('SELECT id FROM users WHERE username = ?', [username]);
    if (!targetUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const existing = await db.getAsync(
      'SELECT id FROM chat_invites WHERE chatId = ? AND toUserId = ? AND status = "PENDING"',
      [chatId, targetUser.id]
    );

    if (existing) {
      return res.status(409).json({ error: 'Приглашение уже отправлено' });
    }

    const member = await db.getAsync(
      'SELECT id FROM chat_members WHERE userId = ? AND chatId = ?',
      [targetUser.id, chatId]
    );

    if (member) {
      return res.status(409).json({ error: 'Пользователь уже в чате' });
    }

    await db.runAsync(
      'INSERT INTO chat_invites (id, chatId, fromUserId, toUserId, createdAt) VALUES (?, ?, ?, ?, ?)',
      [randomUUID(), chatId, fromUserId, targetUser.id, new Date().toISOString()]
    );

    res.json({ message: 'Приглашение отправлено' });
  } catch (error) {
    console.error('Ошибка отправки приглашения:', error.message);
    res.status(500).json({ error: 'Ошибка отправки приглашения' });
  }
});

// Получить мои приглашения
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const invites = await db.allAsync(`
      SELECT ci.*, c.name as chatName, u.username, u.firstName, u.lastName, u.avatar
      FROM chat_invites ci
      JOIN chats c ON ci.chatId = c.id
      JOIN users u ON ci.fromUserId = u.id
      WHERE ci.toUserId = ? AND ci.status = 'PENDING'
      ORDER BY ci.createdAt DESC
    `, [userId]);

    res.json(invites);
  } catch (error) {
    console.error('Ошибка получения приглашений:', error.message);
    res.status(500).json({ error: 'Ошибка получения приглашений' });
  }
});

// Подать заявку на вступление в группу
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.body;
    const userId = req.user.id;

    const chat = await db.getAsync('SELECT * FROM chats WHERE id = ? AND type = "GROUP"', [chatId]);
    if (!chat) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }

    const member = await db.getAsync(
      'SELECT id FROM chat_members WHERE userId = ? AND chatId = ?',
      [userId, chatId]
    );

    if (member) {
      return res.status(409).json({ error: 'Вы уже участник группы' });
    }

    // Удаляем старые отклоненные заявки
    await db.runAsync(
      'DELETE FROM chat_invites WHERE chatId = ? AND fromUserId = ? AND status IN ("REJECTED", "ACCEPTED")',
      [chatId, userId]
    );

    const existing = await db.getAsync(
      'SELECT id FROM chat_invites WHERE chatId = ? AND fromUserId = ? AND status = "PENDING"',
      [chatId, userId]
    );

    if (existing) {
      return res.status(409).json({ error: 'Заявка уже отправлена' });
    }

    // Получаем всех админов группы
    const admins = await db.allAsync(
      'SELECT userId FROM chat_members WHERE chatId = ? AND role = "ADMIN"',
      [chatId]
    );

    // Создаем заявку для каждого админа
    const requestId = randomUUID();
    for (const admin of admins) {
      await db.runAsync(
        'INSERT INTO chat_invites (id, chatId, fromUserId, toUserId, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [randomUUID(), chatId, userId, admin.userId, 'PENDING', new Date().toISOString()]
      );
    }

    // Уведомляем админов через WebSocket
    const io = req.app.get('io');
    if (io) {
      for (const admin of admins) {
        io.to(admin.userId).emit('group:new_request', { chatId, requestId, userId });
      }
    }

    res.json({ message: 'Заявка отправлена' });
  } catch (error) {
    console.error('Ошибка отправки заявки:', error.message);
    res.status(500).json({ error: 'Ошибка отправки заявки' });
  }
});

// Получить заявки на вступление в мои группы
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await db.allAsync(`
      SELECT ci.*, c.name as chatName, u.username, u.firstName, u.lastName, u.avatar
      FROM chat_invites ci
      JOIN chats c ON ci.chatId = c.id
      JOIN users u ON ci.fromUserId = u.id
      JOIN chat_members cm ON cm.chatId = c.id AND cm.userId = ? AND cm.role = 'ADMIN'
      WHERE ci.toUserId = ? AND ci.status = 'PENDING'
      ORDER BY ci.createdAt DESC
    `, [userId, userId]);

    res.json(requests);
  } catch (error) {
    console.error('Ошибка получения заявок:', error.message);
    res.status(500).json({ error: 'Ошибка получения заявок' });
  }
});

// Принять/отклонить приглашение
router.put('/:inviteId', authenticateToken, async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const userId = req.user.id;

    const invite = await db.getAsync('SELECT * FROM chat_invites WHERE id = ?', [inviteId]);
    if (!invite) {
      return res.status(404).json({ error: 'Приглашение не найдено' });
    }

    // Проверяем права - либо это приглашение для меня, либо я админ
    const isRecipient = invite.toUserId === userId;
    const isAdmin = await db.getAsync(
      'SELECT id FROM chat_members WHERE userId = ? AND chatId = ? AND role = "ADMIN"',
      [userId, invite.chatId]
    );

    if (!isRecipient && !isAdmin) {
      return res.status(403).json({ error: 'Нет прав' });
    }

    if (action === 'accept') {
      // Добавляем fromUserId (того кто подал заявку) в группу
      const userToAdd = isRecipient ? userId : invite.fromUserId;
      await db.runAsync(
        'INSERT OR IGNORE INTO chat_members (id, userId, chatId, role, joinedAt) VALUES (?, ?, ?, ?, ?)',
        [randomUUID(), userToAdd, invite.chatId, 'MEMBER', new Date().toISOString()]
      );
      await db.runAsync('UPDATE chat_invites SET status = "ACCEPTED" WHERE id = ?', [inviteId]);
      
      // Уведомляем пользователя через WebSocket
      const io = req.app.get('io');
      if (io) {
        io.to(userToAdd).emit('chat:joined', { chatId: invite.chatId });
      }
      
      res.json({ message: 'Приглашение принято' });
    } else {
      await db.runAsync('UPDATE chat_invites SET status = "REJECTED" WHERE id = ?', [inviteId]);
      res.json({ message: 'Приглашение отклонено' });
    }
  } catch (error) {
    console.error('Ошибка обработки приглашения:', error.message);
    res.status(500).json({ error: 'Ошибка обработки приглашения' });
  }
});

export default router;
