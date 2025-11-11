import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../database.js';
import { randomUUID } from 'crypto';

export default function createReactionsRoutes(io) {
  const router = express.Router();

  // Добавить/удалить реакцию
  router.post('/:messageId', authenticateToken, async (req, res) => {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.user.id;

      if (!emoji) {
        return res.status(400).json({ error: 'Emoji обязателен' });
      }

      // Проверяем существует ли уже реакция
      const existing = await db.getAsync(
        'SELECT id FROM message_reactions WHERE messageId = ? AND userId = ? AND emoji = ?',
        [messageId, userId, emoji]
      );

      // Проверяем существует ли сообщение (в messages или image_messages)
      let message = await db.getAsync('SELECT chatId FROM messages WHERE id = ?', [messageId]);
      if (!message) {
        message = await db.getAsync('SELECT chatId FROM image_messages WHERE id = ?', [messageId]);
      }
      if (!message) {
        return res.status(404).json({ error: 'Сообщение не найдено' });
      }

      if (existing) {
        // Удаляем реакцию
        await db.runAsync('DELETE FROM message_reactions WHERE id = ?', [existing.id]);
        
        // Получаем обновленные реакции
        const reactions = await db.allAsync(
          'SELECT emoji, COUNT(*) as count FROM message_reactions WHERE messageId = ? GROUP BY emoji',
          [messageId]
        );

        io.to(message.chatId).emit('reaction:removed', { messageId, userId, emoji, reactions });
        
        return res.json({ action: 'removed', reactions });
      }

      // Добавляем реакцию
      await db.runAsync(
        'INSERT INTO message_reactions (id, messageId, userId, emoji, createdAt) VALUES (?, ?, ?, ?, ?)',
        [randomUUID(), messageId, userId, emoji, new Date().toISOString()]
      );

      // Получаем обновленные реакции
      const reactions = await db.allAsync(
        'SELECT emoji, COUNT(*) as count FROM message_reactions WHERE messageId = ? GROUP BY emoji',
        [messageId]
      );

      io.to(message.chatId).emit('reaction:added', { messageId, userId, emoji, reactions });

      res.json({ action: 'added', reactions });
    } catch (error) {
      console.error('Ошибка реакции:', error.message);
      res.status(500).json({ error: 'Ошибка реакции' });
    }
  });

  // Получить реакции сообщения
  router.get('/:messageId', authenticateToken, async (req, res) => {
    try {
      const { messageId } = req.params;
      
      const reactions = await db.allAsync(`
        SELECT emoji, COUNT(*) as count,
          GROUP_CONCAT(COALESCE(u.username, 'deleted')) as users
        FROM message_reactions mr
        LEFT JOIN users u ON mr.userId = u.id
        WHERE mr.messageId = ?
        GROUP BY emoji
      `, [messageId]);

      res.json(reactions);
    } catch (error) {
      console.error('Ошибка получения реакций:', error.message);
      res.status(500).json({ error: 'Ошибка получения реакций' });
    }
  });

  return router;
}
