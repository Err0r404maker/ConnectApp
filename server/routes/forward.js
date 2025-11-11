import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../database.js';
import { randomUUID } from 'crypto';

const router = express.Router();

export default function createForwardRoutes(io) {
  const router = express.Router();

  router.post('/', authenticateToken, async (req, res) => {
    try {
      const { messageId, targetChatIds } = req.body;
      const userId = req.user.id;

      if (!messageId || !Array.isArray(targetChatIds) || targetChatIds.length === 0) {
        return res.status(400).json({ error: 'Неверные данные' });
      }

      let message = await db.getAsync('SELECT * FROM messages WHERE id = ?', [messageId]);
      let isImageMessage = false;
      
      if (!message) {
        message = await db.getAsync('SELECT * FROM image_messages WHERE id = ?', [messageId]);
        isImageMessage = true;
      }
      
      if (!message) {
        return res.status(404).json({ error: 'Сообщение не найдено' });
      }

      const user = await db.getAsync('SELECT firstName, lastName FROM users WHERE id = ?', [userId]);
      const forwarded = [];
      
      for (const chatId of targetChatIds) {
        const membership = await db.getAsync(
          'SELECT id FROM chat_members WHERE userId = ? AND chatId = ?',
          [userId, chatId]
        );

        if (!membership) continue;

        const newId = randomUUID();
        const now = new Date().toISOString();

        if (isImageMessage) {
          await db.runAsync(
            'INSERT INTO image_messages (id, chatId, senderId, senderName, imageData, fileName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [newId, chatId, userId, `${user.firstName} ${user.lastName}`, message.imageData, `↪️ ${message.fileName}`, now]
          );
          
          const isImage = message.imageData?.startsWith('data:image/');
          const isVoice = message.imageData?.startsWith('data:audio/');
          
          io.to(chatId).emit('message:new', {
            id: newId,
            type: isVoice ? 'VOICE' : (isImage ? 'IMAGE' : 'FILE'),
            fileUrl: message.imageData,
            fileName: `↪️ ${message.fileName}`,
            senderId: userId,
            firstName: user.firstName,
            lastName: user.lastName,
            chatId,
            createdAt: now
          });
        } else {
          await db.runAsync(
            'INSERT INTO messages (id, content, type, fileUrl, fileName, senderId, chatId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [newId, `↪️ ${message.content}`, message.type, message.fileUrl, message.fileName, userId, chatId, now, now]
          );
          
          io.to(chatId).emit('message:new', {
            id: newId,
            content: `↪️ ${message.content}`,
            type: message.type,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            senderId: userId,
            firstName: user.firstName,
            lastName: user.lastName,
            chatId,
            createdAt: now
          });
        }

        forwarded.push({ chatId, messageId: newId });
      }

      res.json({ forwarded });
    } catch (error) {
      console.error('Ошибка пересылки:', error.message);
      res.status(500).json({ error: 'Ошибка пересылки' });
    }
  });
  
  return router;
}


