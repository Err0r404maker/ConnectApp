import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../database.js';
import { randomUUID } from 'crypto';

export default function createFriendsRoutes(io) {
  const router = express.Router();

  // Отправить запрос в друзья
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const { username } = req.body;
      const userId = req.user.id;
      
      console.log(`📤 Отправка запроса: userId=${userId}, targetUsername=${username}`);

      const targetUser = await db.getAsync('SELECT id, username, firstName, lastName FROM users WHERE username = ?', [username]);
      if (!targetUser) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      if (targetUser.id === userId) {
        return res.status(400).json({ error: 'Нельзя добавить себя в друзья' });
      }

      const existing = await db.getAsync(
        'SELECT id, status FROM friends WHERE (userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?)',
        [userId, targetUser.id, targetUser.id, userId]
      );

      if (existing) {
        if (existing.status === 'REJECTED') {
          await db.runAsync('UPDATE friends SET status = "PENDING" WHERE id = ?', [existing.id]);
        } else {
          return res.status(409).json({ error: 'Запрос уже отправлен' });
        }
      } else {
        const friendRequestId = randomUUID();
        console.log(`💾 Создание записи: id=${friendRequestId}, userId=${userId}, friendId=${targetUser.id}`);
        await db.runAsync(
          'INSERT INTO friends (id, userId, friendId, status, createdAt) VALUES (?, ?, ?, "PENDING", ?)',
          [friendRequestId, userId, targetUser.id, new Date().toISOString()]
        );
      }

      const sender = await db.getAsync('SELECT username, firstName, lastName, avatar FROM users WHERE id = ?', [userId]);
      
      console.log(`👥 Отправка уведомления friend:request для ${targetUser.username} (${targetUser.id})`);
      
      io.to(targetUser.id).emit('friend:request', {
        id: randomUUID(),
        username: sender.username,
        firstName: sender.firstName,
        lastName: sender.lastName,
        avatar: sender.avatar
      });

      res.json({ message: 'Запрос отправлен', targetUser });
    } catch (error) {
      console.error('Ошибка отправки запроса:', error.message);
      res.status(500).json({ error: 'Ошибка отправки запроса' });
    }
  });

  // Получить список друзей и запросов
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { onlineOnly } = req.query;
      
      console.log(`📚 Запрос списка друзей для userId=${userId}`);

      let friendsQuery = `
        SELECT f.id, f.userId, f.friendId, f.status, f.createdAt,
               u.username, u.firstName, u.lastName, u.avatar, u.status as userStatus, u.lastSeen
        FROM friends f
        LEFT JOIN users u ON (CASE WHEN f.userId = ? THEN f.friendId ELSE f.userId END) = u.id
        WHERE (f.userId = ? OR f.friendId = ?) AND f.status = 'ACCEPTED'
      `;
      
      if (onlineOnly === 'true') {
        friendsQuery += ` AND u.status = 'ONLINE'`;
      }

      const friends = await db.allAsync(friendsQuery, [userId, userId, userId]);

      const requests = await db.allAsync(`
        SELECT f.id, f.userId, f.friendId, f.status, f.createdAt,
               u.username, u.firstName, u.lastName, u.avatar
        FROM friends f
        INNER JOIN users u ON f.userId = u.id
        WHERE f.friendId = ? AND f.status = 'PENDING'
      `, [userId]);
      
      const sentRequests = await db.allAsync(`
        SELECT f.id, f.userId, f.friendId, f.status, f.createdAt,
               u.username, u.firstName, u.lastName, u.avatar
        FROM friends f
        INNER JOIN users u ON f.friendId = u.id
        WHERE f.userId = ? AND f.status = 'PENDING'
      `, [userId]);
      
      console.log(`📬 Входящие: ${requests.length}, Исходящие: ${sentRequests.length}`);

      res.json({ 
        friends: friends.filter(f => f.username), 
        requests: requests.filter(r => r.username),
        sentRequests: sentRequests.filter(r => r.username)
      });
    } catch (error) {
      console.error('Ошибка получения друзей:', error.message, error.stack);
      res.status(500).json({ error: 'Ошибка получения друзей' });
    }
  });

  // Проверить статус дружбы
  router.get('/status/:username', authenticateToken, async (req, res) => {
    try {
      const { username } = req.params;
      const userId = req.user.id;

      const targetUser = await db.getAsync('SELECT id FROM users WHERE username = ?', [username]);
      if (!targetUser) {
        return res.json({ status: 'none' });
      }

      const friendship = await db.getAsync(
        'SELECT * FROM friends WHERE (userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?)',
        [userId, targetUser.id, targetUser.id, userId]
      );

      if (!friendship) {
        return res.json({ status: 'none' });
      }

      if (friendship.status === 'ACCEPTED') {
        return res.json({ status: 'friends', friendshipId: friendship.id });
      }

      if (friendship.userId === userId) {
        return res.json({ status: 'pending_sent' });
      } else {
        return res.json({ status: 'pending_received', friendshipId: friendship.id });
      }
    } catch (error) {
      console.error('Ошибка проверки статуса:', error.message);
      res.status(500).json({ error: 'Ошибка проверки статуса' });
    }
  });

  // Принять/отклонить запрос
  router.put('/:friendId', authenticateToken, async (req, res) => {
    try {
      const { friendId } = req.params;
      const { action } = req.body;
      const userId = req.user.id;

      const request = await db.getAsync('SELECT * FROM friends WHERE id = ? AND friendId = ?', [friendId, userId]);
      if (!request) {
        return res.status(404).json({ error: 'Запрос не найден' });
      }

      if (action === 'accept') {
        await db.runAsync('UPDATE friends SET status = "ACCEPTED" WHERE id = ?', [friendId]);
        res.json({ message: 'Запрос принят' });
      } else {
        await db.runAsync('UPDATE friends SET status = "REJECTED" WHERE id = ?', [friendId]);
        res.json({ message: 'Запрос отклонен' });
      }
    } catch (error) {
      console.error('Ошибка обработки запроса:', error.message);
      res.status(500).json({ error: 'Ошибка обработки запроса' });
    }
  });

  // Удалить друга
  router.delete('/:friendUsername', authenticateToken, async (req, res) => {
    try {
      const { friendUsername } = req.params;
      const userId = req.user.id;

      const friend = await db.getAsync('SELECT id FROM users WHERE username = ?', [friendUsername]);
      if (!friend) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      await db.runAsync(
        'DELETE FROM friends WHERE (userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?)',
        [userId, friend.id, friend.id, userId]
      );

      res.json({ message: 'Друг удален' });
    } catch (error) {
      console.error('Ошибка удаления друга:', error.message);
      res.status(500).json({ error: 'Ошибка удаления друга' });
    }
  });

  return router;
}
