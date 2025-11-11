import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../database.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Поиск групп по username (ДОЛЖЕН БЫТЬ ПЕРЕД /:chatId)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { username } = req.query;
    const userId = req.user.id;
    
    if (!username) {
      return res.status(400).json({ error: 'Username обязателен' });
    }
    
    const groups = await db.allAsync(`
      SELECT c.id, c.name, c.username, c.description, c.avatar,
             (SELECT COUNT(*) FROM chat_members WHERE chatId = c.id) as memberCount,
             (SELECT COUNT(*) FROM chat_members WHERE chatId = c.id AND userId = ?) as isMember
      FROM chats c
      WHERE c.type = 'GROUP' AND c.username LIKE ? AND c.isPrivate = 0
      ORDER BY memberCount DESC
      LIMIT 20
    `, [userId, `%${username}%`]);
    
    res.json(groups.filter(g => g.isMember === 0));
  } catch (error) {
    console.error('Ошибка поиска групп:', error.message);
    res.status(500).json({ error: 'Ошибка поиска групп' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await db.allAsync(`
      SELECT c.id, c.name, c.type, c.avatar, c.description, c.username as groupname, c.createdAt, c.updatedAt, cm.role as userRole
      FROM chats c
      JOIN chat_members cm ON c.id = cm.chatId
      WHERE cm.userId = ?
      ORDER BY c.updatedAt DESC
    `, [userId]);
    
    // Для каждого чата получаем последнее сообщение
    for (const chat of chats) {
      // Получаем последнее сообщение
      const lastMessage = await db.getAsync(`
        SELECT content, createdAt, senderId
        FROM messages
        WHERE chatId = ?
        ORDER BY createdAt DESC
        LIMIT 1
      `, [chat.id]);
      
      if (lastMessage) {
        chat.lastMessage = {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt
        };
      }
      
      // Для личных чатов получаем имя собеседника и статус
      if (chat.type === 'DIRECT') {
        const otherUser = await db.getAsync(`
          SELECT u.id, u.firstName, u.lastName, u.avatar, u.status
          FROM users u
          JOIN chat_members cm ON u.id = cm.userId
          WHERE cm.chatId = ? AND u.id != ?
          LIMIT 1
        `, [chat.id, userId]);
        if (otherUser) {
          chat.name = `${otherUser.firstName} ${otherUser.lastName}`;
          chat.avatar = otherUser.avatar;
          chat.isOnline = otherUser.status === 'ONLINE';
          chat.otherUserId = otherUser.id;
        }
      }
    }
    
    res.json(chats);
  } catch (error) {
    console.error('Ошибка загрузки чатов:', error.message);
    res.status(500).json({ error: 'Ошибка загрузки чатов' });
  }
});

router.get('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const membership = await db.getAsync('SELECT role FROM chat_members WHERE userId = ? AND chatId = ?', [userId, chatId]);
    if (!membership) return res.status(403).json({ error: 'Нет доступа' });
    const chat = await db.getAsync('SELECT * FROM chats WHERE id = ?', [chatId]);
    if (!chat) return res.status(404).json({ error: 'Чат не найден' });
    const members = await db.allAsync(`
      SELECT cm.userId, cm.role, cm.joinedAt, u.username, u.firstName, u.lastName, u.avatar,
             CASE WHEN u.status = 'ONLINE' THEN 1 ELSE 0 END as isOnline
      FROM chat_members cm JOIN users u ON cm.userId = u.id WHERE cm.chatId = ?
    `, [chatId]);
    chat.members = members;
    chat.userRole = membership.role;
    res.json(chat);
  } catch (error) {
    console.error('Ошибка загрузки чата:', error.message);
    res.status(500).json({ error: 'Ошибка загрузки чата' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, type = 'GROUP', description, targetUserId, username } = req.body;
    const userId = req.user.id;
    
    // Если это личный чат, проверяем существует ли уже
    if (type === 'DIRECT' && targetUserId) {
      const existingChat = await db.getAsync(`
        SELECT c.* FROM chats c
        JOIN chat_members cm1 ON c.id = cm1.chatId
        JOIN chat_members cm2 ON c.id = cm2.chatId
        WHERE c.type = 'DIRECT' AND cm1.userId = ? AND cm2.userId = ?
        LIMIT 1
      `, [userId, targetUserId]);
      
      if (existingChat) {
        return res.json(existingChat);
      }
    }
    
    const chatId = randomUUID();
    const chatName = name?.trim() || 'Новый чат';
    const now = new Date().toISOString();
    
    // Генерируем username если не указан
    let chatUsername = username?.trim();
    if (type === 'GROUP' && !chatUsername) {
      chatUsername = chatName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_а-я]/g, '') + '_' + chatId.substring(0, 8);
    }
    
    // Проверяем уникальность username
    if (chatUsername) {
      const existing = await db.getAsync('SELECT id FROM chats WHERE username = ?', [chatUsername]);
      if (existing) {
        return res.status(409).json({ error: 'Такой username уже существует' });
      }
    }
    
    await db.runAsync('INSERT INTO chats (id, name, type, description, username, isPrivate, ownerId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [chatId, chatName, type, description?.trim() || null, chatUsername, 0, userId, now, now]);
    
    await db.runAsync('INSERT INTO chat_members (id, userId, chatId, role, joinedAt) VALUES (?, ?, ?, ?, ?)',
      [randomUUID(), userId, chatId, 'ADMIN', now]);
    
    // Если личный чат, добавляем второго участника
    if (type === 'DIRECT' && targetUserId) {
      await db.runAsync('INSERT INTO chat_members (id, userId, chatId, role, joinedAt) VALUES (?, ?, ?, ?, ?)',
        [randomUUID(), targetUserId, chatId, 'MEMBER', now]);
    }
    
    const chat = await db.getAsync('SELECT * FROM chats WHERE id = ?', [chatId]);
    chat.lastMessage = null;
    res.status(201).json(chat);
  } catch (error) {
    console.error('Ошибка создания чата:', error.message);
    res.status(500).json({ error: 'Ошибка создания чата' });
  }
});

// Получить участников чата
router.get('/:chatId/members', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    
    const membership = await db.getAsync('SELECT role FROM chat_members WHERE userId = ? AND chatId = ?', [userId, chatId]);
    if (!membership) {
      return res.status(403).json({ error: 'Нет доступа' });
    }
    
    const members = await db.allAsync(`
      SELECT cm.userId, cm.role, cm.joinedAt, u.username, u.firstName, u.lastName, u.avatar, 
             CASE WHEN u.status = 'ONLINE' THEN 1 ELSE 0 END as isOnline
      FROM chat_members cm
      LEFT JOIN users u ON cm.userId = u.id
      WHERE cm.chatId = ?
      ORDER BY cm.role DESC, u.firstName
    `, [chatId]);
    
    console.log(`Members for chat ${chatId}:`, members.length);
    
    // Фильтруем участников с существующими пользователями
    const validMembers = members.filter(m => m.username);
    console.log(`Valid members: ${validMembers.length}`);
    
    res.json(validMembers);
  } catch (error) {
    console.error('Ошибка получения участников:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка получения участников' });
  }
});

router.post('/:chatId/members', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId: newMemberId, username } = req.body;
    const userId = req.user.id;
    
    // Поддержка приглашения по username
    let targetUserId = newMemberId;
    if (!targetUserId && username) {
      const user = await db.getAsync('SELECT id FROM users WHERE username = ?', [username]);
      if (!user) return res.status(404).json({ error: `Пользователь @${username} не найден` });
      targetUserId = user.id;
    }
    
    if (!targetUserId) return res.status(400).json({ error: 'Укажите userId или username' });
    
    const membership = await db.getAsync('SELECT role FROM chat_members WHERE userId = ? AND chatId = ?', [userId, chatId]);
    if (!membership || !['ADMIN', 'MODERATOR'].includes(membership.role)) {
      return res.status(403).json({ error: 'Нет прав' });
    }
    
    const user = await db.getAsync('SELECT * FROM users WHERE id = ?', [targetUserId]);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    
    const existing = await db.getAsync('SELECT id FROM chat_members WHERE userId = ? AND chatId = ?', [targetUserId, chatId]);
    if (existing) return res.status(409).json({ error: 'Уже участник' });
    
    await db.runAsync('INSERT INTO chat_members (id, userId, chatId, role, joinedAt) VALUES (?, ?, ?, ?, ?)',
      [randomUUID(), targetUserId, chatId, 'MEMBER', new Date().toISOString()]);
    
    res.status(201).json({ message: `@${user.username} добавлен в чат`, user });
  } catch (error) {
    console.error('Ошибка добавления участника:', error.message);
    res.status(500).json({ error: 'Ошибка добавления участника' });
  }
});

// Обновить настройки чата
router.put('/:chatId/settings', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { allowMedia, allowFiles, allowVoice, isPrivate } = req.body;
    const userId = req.user.id;
    const membership = await db.getAsync('SELECT role FROM chat_members WHERE userId = ? AND chatId = ?', [userId, chatId]);
    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Только админы могут менять настройки' });
    }
    await db.runAsync('UPDATE chats SET allowMedia = ?, allowFiles = ?, allowVoice = ?, isPrivate = ? WHERE id = ?',
      [allowMedia ? 1 : 0, allowFiles ? 1 : 0, allowVoice ? 1 : 0, isPrivate ? 1 : 0, chatId]);
    const chat = await db.getAsync('SELECT * FROM chats WHERE id = ?', [chatId]);
    res.json(chat);
  } catch (error) {
    console.error('Ошибка обновления настроек:', error.message);
    res.status(500).json({ error: 'Ошибка обновления настроек' });
  }
});

// Изменить роль участника
router.put('/:chatId/members/:memberId/role', authenticateToken, async (req, res) => {
  try {
    const { chatId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user.id;
    if (!['MEMBER', 'MODERATOR', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Неверная роль' });
    }
    const membership = await db.getAsync('SELECT role FROM chat_members WHERE userId = ? AND chatId = ?', [userId, chatId]);
    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Только админы могут менять роли' });
    }
    await db.runAsync('UPDATE chat_members SET role = ? WHERE userId = ? AND chatId = ?', [role, memberId, chatId]);
    res.json({ message: 'Роль обновлена' });
  } catch (error) {
    console.error('Ошибка изменения роли:', error.message);
    res.status(500).json({ error: 'Ошибка изменения роли' });
  }
});

// Получить статистику чата
router.get('/:chatId/stats', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const membership = await db.getAsync(
      'SELECT id FROM chat_members WHERE userId = ? AND chatId = ? LIMIT 1',
      [userId, chatId]
    );

    if (!membership) {
      return res.status(403).json({ error: 'Нет доступа к чату' });
    }

    const chat = await db.getAsync('SELECT createdAt FROM chats WHERE id = ?', [chatId]);
    const messageCount = await db.getAsync('SELECT COUNT(*) as count FROM messages WHERE chatId = ?', [chatId]);
    const memberCount = await db.getAsync('SELECT COUNT(*) as count FROM chat_members WHERE chatId = ?', [chatId]);

    res.json({
      totalMessages: messageCount.count,
      totalMembers: memberCount.count,
      createdAt: chat.createdAt
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error.message);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// Покинуть чат
router.post('/:chatId/leave', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    
    const chat = await db.getAsync('SELECT type, ownerId FROM chats WHERE id = ?', [chatId]);
    if (!chat) return res.status(404).json({ error: 'Чат не найден' });
    
    if (chat.type === 'DIRECT') {
      return res.status(400).json({ error: 'Нельзя покинуть личный чат' });
    }
    
    if (chat.ownerId === userId) {
      return res.status(400).json({ error: 'Владелец не может покинуть чат' });
    }
    
    await db.runAsync('DELETE FROM chat_members WHERE userId = ? AND chatId = ?', [userId, chatId]);
    res.json({ message: 'Вы покинули чат' });
  } catch (error) {
    console.error('Ошибка выхода из чата:', error.message);
    res.status(500).json({ error: 'Ошибка выхода из чата' });
  }
});

// Удалить чат
router.delete('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    
    const chat = await db.getAsync('SELECT type, ownerId FROM chats WHERE id = ?', [chatId]);
    if (!chat) return res.status(404).json({ error: 'Чат не найден' });
    
    // Для личных чатов разрешаем удаление любому участнику
    if (chat.type === 'DIRECT') {
      const membership = await db.getAsync('SELECT id FROM chat_members WHERE userId = ? AND chatId = ?', [userId, chatId]);
      if (!membership) return res.status(403).json({ error: 'Нет доступа' });
    } else {
      // Для групповых чатов только админ или владелец
      const membership = await db.getAsync('SELECT role FROM chat_members WHERE userId = ? AND chatId = ?', [userId, chatId]);
      if (!membership || (membership.role !== 'ADMIN' && chat.ownerId !== userId)) {
        return res.status(403).json({ error: 'Только админы и владелец могут удалять групповой чат' });
      }
    }
    
    await db.runAsync('DELETE FROM messages WHERE chatId = ?', [chatId]);
    await db.runAsync('DELETE FROM chat_members WHERE chatId = ?', [chatId]);
    await db.runAsync('DELETE FROM chats WHERE id = ?', [chatId]);
    res.json({ message: 'Чат удален' });
  } catch (error) {
    console.error('Ошибка удаления чата:', error.message);
    res.status(500).json({ error: 'Ошибка удаления чата' });
  }
});

export default router;
