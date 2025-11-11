import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../database.js';
import { randomUUID } from 'crypto';

export default function createMessageReadsRoutes(io) {
  const router = express.Router();

  // Отметить сообщения как прочитанные (включая файлы/медиа)
  router.post('/mark-read', authenticateToken, async (req, res) => {
    try {
      const { chatId } = req.body;
      const userId = req.user.id;

      if (!chatId) {
        return res.status(400).json({ error: 'chatId обязателен' });
      }

      // Получаем все непрочитанные текстовые сообщения
      const unreadMessages = await db.allAsync(
        `SELECT m.id FROM messages m
         LEFT JOIN message_reads mr ON m.id = mr.messageId AND mr.userId = ?
         WHERE m.chatId = ? AND m.senderId != ? AND mr.id IS NULL`,
        [userId, chatId, userId]
      );

      // Получаем все непрочитанные изображения
      const unreadImages = await db.allAsync(
        `SELECT i.id FROM image_messages i
         LEFT JOIN message_reads mr ON mr.messageId = i.id AND mr.userId = ?
         WHERE i.chatId = ? AND i.senderId != ? AND mr.id IS NULL`,
        [userId, chatId, userId]
      );

      const allUnread = [...unreadMessages, ...unreadImages];

      // Отмечаем все как прочитанные
      for (const msg of allUnread) {
        await db.runAsync(
          'INSERT OR IGNORE INTO message_reads (id, messageId, userId, readAt) VALUES (?, ?, ?, ?)',
          [randomUUID(), msg.id, userId, new Date().toISOString()]
        );
      }

      // Уведомляем о прочтении
      if (allUnread.length > 0) {
        io.to(chatId).emit('messages:read', { chatId, userId, count: allUnread.length });
      }

      res.json({ success: true, markedCount: allUnread.length });
    } catch (error) {
      console.error('Ошибка отметки прочитанных:', error.message);
      res.status(500).json({ error: 'Ошибка отметки прочитанных' });
    }
  });

  // Получить количество непрочитанных по чатам
  router.get('/unread-counts', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;

      const messageCounts = await db.allAsync(`
        SELECT m.chatId, COUNT(DISTINCT m.id) as unreadCount
        FROM messages m
        LEFT JOIN message_reads mr ON m.id = mr.messageId AND mr.userId = ?
        WHERE m.senderId != ? AND mr.id IS NULL
        GROUP BY m.chatId
      `, [userId, userId]);

      const imageCounts = await db.allAsync(`
        SELECT i.chatId, COUNT(DISTINCT i.id) as unreadCount
        FROM image_messages i
        LEFT JOIN message_reads mr ON mr.messageId = i.id AND mr.userId = ?
        WHERE i.senderId != ? AND mr.id IS NULL
        GROUP BY i.chatId
      `, [userId, userId]);

      const result = {};
      messageCounts.forEach(c => {
        result[c.chatId] = (result[c.chatId] || 0) + c.unreadCount;
      });
      imageCounts.forEach(c => {
        result[c.chatId] = (result[c.chatId] || 0) + c.unreadCount;
      });

      res.json(result);
    } catch (error) {
      console.error('Ошибка получения непрочитанных:', error.message);
      res.status(500).json({ error: 'Ошибка получения непрочитанных' });
    }
  });

  // Получить детальный статус прочитанности для сообщений чата
  router.get('/status/:chatId', authenticateToken, async (req, res) => {
    try {
      const { chatId } = req.params;
      const userId = req.user.id;

      // Получаем количество участников чата (кроме отправителя)
      const chatMembers = await db.allAsync(
        'SELECT COUNT(*) as count FROM chat_members WHERE chatId = ?',
        [chatId]
      );
      const totalMembers = chatMembers[0]?.count || 0;

      // Получаем все сообщения пользователя в этом чате
      const myMessages = await db.allAsync(
        'SELECT id FROM messages WHERE chatId = ? AND senderId = ?',
        [chatId, userId]
      );

      const myImages = await db.allAsync(
        'SELECT id FROM image_messages WHERE chatId = ? AND senderId = ?',
        [chatId, userId]
      );

      const allMyMessages = [...myMessages, ...myImages];
      const messageIds = allMyMessages.map(m => m.id);
      
      if (messageIds.length === 0) {
        return res.json({});
      }

      // Проверяем статус прочтения каждого сообщения
      const readStatus = {};
      for (const msgId of messageIds) {
        const reads = await db.allAsync(
          'SELECT userId FROM message_reads WHERE messageId = ? AND userId != ?',
          [msgId, userId]
        );
        const readCount = reads.length;
        const isReadByAll = readCount >= (totalMembers - 1) && totalMembers > 1;
        
        readStatus[msgId] = {
          isRead: readCount > 0,
          readCount,
          isReadByAll,
          totalMembers: totalMembers - 1
        };
      }

      res.json(readStatus);
    } catch (error) {
      console.error('Ошибка получения статуса:', error.message);
      res.status(500).json({ error: 'Ошибка получения статуса' });
    }
  });

  return router;
}
