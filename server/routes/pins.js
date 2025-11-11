import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../database.js';

export default function createPinsRoutes(io) {
  const router = express.Router();

  // Закрепить/открепить сообщение
  router.put('/:messageId', authenticateToken, async (req, res) => {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      let message = await db.getAsync('SELECT * FROM messages WHERE id = ?', [messageId]);
      let isImageMessage = false;
      
      if (!message) {
        message = await db.getAsync('SELECT * FROM image_messages WHERE id = ?', [messageId]);
        isImageMessage = true;
      }
      
      if (!message) {
        return res.status(404).json({ error: 'Сообщение не найдено' });
      }

      // Проверяем права (любой участник может закреплять)
      const membership = await db.getAsync(
        'SELECT role FROM chat_members WHERE userId = ? AND chatId = ?',
        [userId, message.chatId]
      );

      if (!membership) {
        return res.status(403).json({ error: 'Нет прав для закрепления' });
      }

      const isPinned = message.isPinned ? 0 : 1;
      const now = new Date().toISOString();

      const table = isImageMessage ? 'image_messages' : 'messages';
      await db.runAsync(
        `UPDATE ${table} SET isPinned = ?, pinnedAt = ?, pinnedBy = ? WHERE id = ?`,
        [isPinned, isPinned ? now : null, isPinned ? userId : null, messageId]
      );

      io.to(message.chatId).emit('message:pinned', { messageId, isPinned, pinnedBy: userId });

      res.json({ isPinned: !!isPinned });
    } catch (error) {
      console.error('Ошибка закрепления:', error.message);
      res.status(500).json({ error: 'Ошибка закрепления' });
    }
  });

  // Получить закрепленные сообщения чата
  router.get('/chat/:chatId', authenticateToken, async (req, res) => {
    try {
      const { chatId } = req.params;
      const userId = req.user.id;

      const membership = await db.getAsync(
        'SELECT id FROM chat_members WHERE userId = ? AND chatId = ?',
        [userId, chatId]
      );

      if (!membership) {
        return res.status(403).json({ error: 'Нет доступа' });
      }

      const textPinned = await db.allAsync(`
        SELECT m.*, u.username, u.firstName, u.lastName, u.avatar, 'TEXT' as sourceTable
        FROM messages m
        JOIN users u ON m.senderId = u.id
        WHERE m.chatId = ? AND m.isPinned = 1
      `, [chatId]);
      
      const imagePinned = await db.allAsync(`
        SELECT id, chatId, senderId, senderName, imageData as fileUrl, fileName, createdAt, isPinned, pinnedAt, pinnedBy, 'IMAGE' as sourceTable
        FROM image_messages
        WHERE chatId = ? AND isPinned = 1
      `, [chatId]);
      
      const allPinned = [...textPinned, ...imagePinned].sort((a, b) => 
        new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime()
      );

      res.json(allPinned);
    } catch (error) {
      console.error('Ошибка получения закрепленных:', error.message);
      res.status(500).json({ error: 'Ошибка получения закрепленных' });
    }
  });

  return router;
}
