import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../database.js';
import { randomUUID } from 'crypto';

export default function createImageRoutes(io) {
  const router = express.Router();

// Отправить файл (изображение или любой другой)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { chatId, imageData, fileName, replyToId, type } = req.body;
    const userId = req.user.id;
    const messageId = randomUUID();
    
    if (!imageData || !chatId) {
      return res.status(400).json({ error: 'Отсутствуют данные файла или ID чата' });
    }
    
    // Проверяем replyToId в обеих таблицах
    if (replyToId) {
      let replyMessage = await db.getAsync(
        'SELECT id FROM messages WHERE id = ? AND chatId = ? LIMIT 1',
        [replyToId, chatId]
      );
      
      if (!replyMessage) {
        replyMessage = await db.getAsync(
          'SELECT id FROM image_messages WHERE id = ? AND chatId = ? LIMIT 1',
          [replyToId, chatId]
        );
      }
      
      if (!replyMessage) {
        return res.status(400).json({ error: 'Сообщение для ответа не найдено' });
      }
    }
    
    console.log('Получен файл:', fileName, 'размер:', imageData?.length || 0, 'тип:', type, 'replyToId:', replyToId);
    
    const user = await db.getAsync('SELECT firstName, lastName, avatar FROM users WHERE id = ?', [userId]);
    const senderName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    
    await db.runAsync(`
      INSERT INTO image_messages (id, chatId, senderId, senderName, imageData, fileName, replyToId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [messageId, chatId, userId, senderName, imageData, fileName, replyToId || null, new Date().toISOString()]);
    
    console.log('Файл сохранен в базу');
    
    const isImage = imageData.startsWith('data:image/');
    const isVoice = type === 'VOICE' || imageData.startsWith('data:audio/');
    
    // Загружаем данные об ответе
    let replyTo = null;
    if (replyToId) {
      replyTo = await db.getAsync(`
        SELECT m.id, m.content, m.type, m.fileName, m.fileUrl, u.firstName, u.lastName
        FROM messages m
        LEFT JOIN users u ON m.senderId = u.id
        WHERE m.id = ?
      `, [replyToId]);
      
      if (!replyTo) {
        replyTo = await db.getAsync(`
          SELECT id, fileName, imageData as fileUrl, senderName
          FROM image_messages
          WHERE id = ?
        `, [replyToId]);
        
        if (replyTo) {
          const isReplyImage = replyTo.fileUrl?.startsWith('data:image/');
          const isReplyVoice = replyTo.fileUrl?.startsWith('data:audio/');
          replyTo.type = isReplyVoice ? 'VOICE' : (isReplyImage ? 'IMAGE' : 'FILE');
          replyTo.content = isReplyVoice ? '🎤 Голосовое' : (isReplyImage ? '🖼️ Фото' : replyTo.fileName);
          
          if (replyTo.senderName) {
            const names = replyTo.senderName.split(' ');
            replyTo.firstName = names[0] || '';
            replyTo.lastName = names[1] || '';
          }
        }
      }
    }
    
    const message = {
      id: messageId,
      type: isVoice ? 'VOICE' : (isImage ? 'IMAGE' : 'FILE'),
      content: isVoice ? '🎤 Голосовое сообщение' : (isImage ? imageData : fileName),
      fileUrl: imageData,
      senderId: userId,
      firstName: user?.firstName,
      lastName: user?.lastName,
      avatar: user?.avatar,
      chatId,
      fileName,
      replyToId: replyToId || null,
      replyTo,
      createdAt: new Date().toISOString()
    };
    
    // Broadcast сообщение всем участникам чата
    io.to(chatId).emit('message:new', message);
    
    res.json(message);
  } catch (error) {
    console.error('Ошибка сохранения файла:', error.message);
    res.status(500).json({ error: 'Ошибка сохранения файла' });
  }
});

// Получить файлы чата
router.get('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    try {
      const files = await db.allAsync(`
        SELECT id, senderId, senderName, imageData, fileName, replyToId, isPinned, pinnedAt, pinnedBy, createdAt
        FROM image_messages 
        WHERE chatId = ? 
        ORDER BY createdAt ASC
      `, [chatId]);
      
      const formattedFiles = await Promise.all(files.map(async (file) => {
        const isImage = file.imageData?.startsWith('data:image/');
        const isVoice = file.imageData?.startsWith('data:audio/');
        
        // Загружаем реакции
        const reactions = await db.allAsync(`
          SELECT emoji, COUNT(*) as count
          FROM message_reactions
          WHERE messageId = ?
          GROUP BY emoji
        `, [file.id]);
        
        const reactionsObj = {};
        reactions.forEach(r => {
          reactionsObj[r.emoji] = r.count;
        });
        
        // Загружаем данные об ответе
        let replyTo = null;
        if (file.replyToId) {
          replyTo = await db.getAsync(`
            SELECT m.id, m.content, m.type, m.fileName, u.firstName, u.lastName
            FROM messages m
            LEFT JOIN users u ON m.senderId = u.id
            WHERE m.id = ?
          `, [file.replyToId]);
          
          if (!replyTo) {
            replyTo = await db.getAsync(`
              SELECT id, fileName, 'IMAGE' as type, senderName
              FROM image_messages
              WHERE id = ?
            `, [file.replyToId]);
            
            if (replyTo && replyTo.senderName) {
              const names = replyTo.senderName.split(' ');
              replyTo.firstName = names[0] || '';
              replyTo.lastName = names[1] || '';
            }
          }
        }
        
        return {
          id: file.id,
          type: isVoice ? 'VOICE' : (isImage ? 'IMAGE' : 'FILE'),
          content: isVoice ? '🎤 Голосовое сообщение' : (isImage ? file.imageData : file.fileName),
          fileUrl: file.imageData,
          senderId: file.senderId,
          firstName: file.senderName?.split(' ')[0] || '',
          lastName: file.senderName?.split(' ')[1] || '',
          fileName: file.fileName,
          replyToId: file.replyToId,
          replyTo,
          isPinned: file.isPinned || false,
          pinnedAt: file.pinnedAt,
          pinnedBy: file.pinnedBy,
          createdAt: file.createdAt,
          reactions: reactionsObj
        };
      }));
      
      res.json(formattedFiles);
    } catch (dbError) {
      if (dbError.message.includes('no such table')) {
        res.json([]);
      } else {
        throw dbError;
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки файлов:', error.message);
    res.status(500).json({ error: 'Ошибка загрузки файлов' });
  }
});

  return router;
}