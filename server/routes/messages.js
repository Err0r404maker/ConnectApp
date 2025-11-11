import express from 'express';
import { db } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

const validateMessage = (content, type = 'TEXT') => {
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return false;
  }
  
  if (type === 'IMAGE') {
    try {
      if (!content.startsWith('data:image/')) return false;
      const parts = content.split(',');
      if (parts.length !== 2) return false;
      const allowedHeaders = [
        'data:image/jpeg;base64',
        'data:image/jpg;base64', 
        'data:image/png;base64',
        'data:image/gif;base64',
        'data:image/webp;base64'
      ];
      if (!allowedHeaders.includes(parts[0])) return false;
      return content.length <= 10 * 1024 * 1024;
    } catch (error) {
      return false;
    }
  }
  
  if (type === 'VOICE') {
    return true;
  }
  
  if (content.length > 4000) return false;
  return ['TEXT', 'IMAGE', 'FILE', 'VOICE'].includes(type);
};

// Поиск сообщений
router.get('/search/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { query } = req.query;
    const userId = req.user.id;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Запрос должен содержать минимум 2 символа' });
    }

    const membership = await db.getAsync(
      'SELECT id FROM chat_members WHERE userId = ? AND chatId = ? LIMIT 1',
      [userId, chatId]
    );

    if (!membership) {
      return res.status(403).json({ error: 'Нет доступа к чату' });
    }

    const messages = await db.allAsync(`
      SELECT 
        m.id, m.content, m.type, m.senderId, m.chatId, m.createdAt,
        u.username, u.firstName, u.lastName
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE m.chatId = ? AND m.content LIKE ?
      ORDER BY m.createdAt DESC
      LIMIT 50
    `, [chatId, `%${query}%`]);

    res.json({ messages });
  } catch (error) {
    console.error('Ошибка поиска сообщений:', error.message);
    res.status(500).json({ error: 'Ошибка поиска сообщений' });
  }
});

router.get('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 20, before } = req.query;
    const userId = req.user.id;
    
    const membership = await db.getAsync(
      'SELECT id FROM chat_members WHERE userId = ? AND chatId = ? LIMIT 1',
      [userId, chatId]
    );
    
    if (!membership) {
      return res.status(403).json({ error: 'Нет доступа к чату' });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let query = `
      SELECT 
        m.id, m.content, m.type, m.fileUrl, m.fileName, m.fileSize,
        m.senderId, m.chatId, m.replyToId, m.createdAt, m.updatedAt,
        u.username, u.firstName, u.lastName, u.avatar as senderAvatar
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE m.chatId = ?
    `;
    
    const params = [chatId];
    
    if (before) {
      query += ' AND m.createdAt < ?';
      params.push(before);
    }
    
    query += ' ORDER BY m.createdAt DESC LIMIT ?';
    params.push(limitNum);
    
    if (!before && skip > 0) {
      query += ' OFFSET ?';
      params.push(skip);
    }
    
    const messages = await db.allAsync(query, params);

    // Загружаем reactions и данные об ответах для каждого сообщения
    const messagesWithData = await Promise.all(
      messages.map(async (msg) => {
        // Загружаем реакции
        const reactions = await db.allAsync(
          'SELECT emoji, COUNT(*) as count FROM message_reactions WHERE messageId = ? GROUP BY emoji',
          [msg.id]
        );
        
        const reactionsObj = {};
        reactions.forEach(r => {
          reactionsObj[r.emoji] = r.count;
        });
        
        // Если есть replyToId, загружаем данные об исходном сообщении
        let replyTo = null;
        if (msg.replyToId) {
          // Проверяем в messages
          replyTo = await db.getAsync(`
            SELECT m.id, m.content, m.type, m.fileName, m.fileUrl, u.firstName, u.lastName
            FROM messages m
            LEFT JOIN users u ON m.senderId = u.id
            WHERE m.id = ?
          `, [msg.replyToId]);
          
          // Если не нашли, проверяем в image_messages
          if (!replyTo) {
            replyTo = await db.getAsync(`
              SELECT id, fileName, imageData as fileUrl, senderName
              FROM image_messages
              WHERE id = ?
            `, [msg.replyToId]);
            
            if (replyTo) {
              // Определяем тип файла
              const isImage = replyTo.fileUrl?.startsWith('data:image/');
              const isVoice = replyTo.fileUrl?.startsWith('data:audio/');
              replyTo.type = isVoice ? 'VOICE' : (isImage ? 'IMAGE' : 'FILE');
              replyTo.content = isVoice ? '🎤 Голосовое' : (isImage ? '🖼️ Фото' : replyTo.fileName);
              
              if (replyTo.senderName) {
                const names = replyTo.senderName.split(' ');
                replyTo.firstName = names[0] || '';
                replyTo.lastName = names[1] || '';
              }
            }
          }
        }
        
        return {
          ...msg,
          reactions: reactionsObj,
          replyTo
        };
      })
    );

    res.json({
      messages: messagesWithData.reverse(),
      hasMore: messages.length === limitNum
    });
  } catch (error) {
    console.error('Ошибка загрузки сообщений:', error.message);
    res.status(500).json({ error: 'Ошибка загрузки сообщений' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, chatId, type = 'TEXT', replyToId, fileUrl, fileName, fileSize } = req.body;
    const userId = req.user.id;

    console.log('📨 POST /messages:', { userId, chatId, type, replyToId, hasContent: !!content });

    if (!validateMessage(content, type)) {
      console.log('❌ Validation failed');
      return res.status(400).json({ 
        error: type === 'IMAGE' ? 'Неверный формат изображения' : 'Неверный формат сообщения' 
      });
    }

    if (!chatId) {
      console.log('❌ No chatId');
      return res.status(400).json({ error: 'ID чата обязателен' });
    }

    const membership = await db.getAsync(
      'SELECT id FROM chat_members WHERE userId = ? AND chatId = ? LIMIT 1',
      [userId, chatId]
    );

    if (!membership) {
      console.log('❌ No membership');
      return res.status(403).json({ error: 'Нет доступа к чату' });
    }

    if (replyToId) {
      console.log('🔍 Checking replyToId:', replyToId);
      let replyMessage = await db.getAsync(
        'SELECT id FROM messages WHERE id = ? AND chatId = ? LIMIT 1',
        [replyToId, chatId]
      );
      console.log('  messages table:', replyMessage ? '✅ found' : '❌ not found');
      
      if (!replyMessage) {
        replyMessage = await db.getAsync(
          'SELECT id FROM image_messages WHERE id = ? AND chatId = ? LIMIT 1',
          [replyToId, chatId]
        );
        console.log('  image_messages table:', replyMessage ? '✅ found' : '❌ not found');
      }
      
      if (!replyMessage) {
        console.log('❌ Reply message not found in any table');
        return res.status(400).json({ error: 'Сообщение для ответа не найдено' });
      }
      console.log('✅ Reply message found');
    }

    const messageId = randomUUID();
    const now = new Date().toISOString();
    
    console.log('💾 Inserting message:', messageId);
    await db.runAsync(`
      INSERT INTO messages (id, content, type, fileUrl, fileName, fileSize, senderId, chatId, replyToId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [messageId, content.trim(), type, fileUrl, fileName, fileSize, userId, chatId, replyToId || null, now, now]);

    console.log('🔍 Loading message with reply data...');
    const message = await db.getAsync(`
      SELECT 
        m.id, m.content, m.type, m.fileUrl, m.fileName, m.fileSize,
        m.senderId, m.chatId, m.replyToId, m.createdAt, m.updatedAt,
        u.username, u.firstName, u.lastName, u.avatar as senderAvatar
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE m.id = ?
    `, [messageId]);

    // Load reply data if exists
    if (message.replyToId) {
      console.log('🔍 Loading reply data for:', message.replyToId);
      let replyTo = await db.getAsync(`
        SELECT m.id, m.content, m.type, m.fileName, m.fileUrl, u.firstName, u.lastName
        FROM messages m
        LEFT JOIN users u ON m.senderId = u.id
        WHERE m.id = ?
      `, [message.replyToId]);
      
      if (!replyTo) {
        replyTo = await db.getAsync(`
          SELECT id, fileName, imageData as fileUrl, senderName
          FROM image_messages
          WHERE id = ?
        `, [message.replyToId]);
        
        if (replyTo) {
          const isImage = replyTo.fileUrl?.startsWith('data:image/');
          const isVoice = replyTo.fileUrl?.startsWith('data:audio/');
          replyTo.type = isVoice ? 'VOICE' : (isImage ? 'IMAGE' : 'FILE');
          replyTo.content = isVoice ? '🎤 Голосовое сообщение' : (isImage ? '🖼 Изображение' : replyTo.fileName);
          
          if (replyTo.senderName) {
            const names = replyTo.senderName.split(' ');
            replyTo.firstName = names[0] || '';
            replyTo.lastName = names[1] || '';
          }
        }
      }
      
      message.replyTo = replyTo;
      console.log('✅ Reply data loaded:', replyTo ? 'yes' : 'no');
    }

    await db.runAsync('UPDATE chats SET updatedAt = ? WHERE id = ?', [now, chatId]);

    console.log('✅ Message created successfully');
    res.status(201).json(message);
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error.message);
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

router.put('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!validateMessage(content)) {
      return res.status(400).json({ error: 'Неверный формат сообщения' });
    }

    const message = await db.getAsync('SELECT senderId FROM messages WHERE id = ?', [messageId]);
    if (!message || message.senderId !== userId) {
      return res.status(403).json({ error: 'Нет прав на редактирование этого сообщения' });
    }

    const currentMessage = await db.getAsync(
      'SELECT content, isEdited FROM messages WHERE id = ? LIMIT 1',
      [messageId]
    );

    if (!currentMessage) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }

    const now = new Date().toISOString();
    
    await db.runAsync(`
      UPDATE messages 
      SET content = ?, isEdited = 1, editedAt = ?, originalContent = ?
      WHERE id = ?
    `, [
      content.trim(), 
      now, 
      currentMessage.isEdited ? undefined : currentMessage.content,
      messageId
    ]);

    const updatedMessage = await db.getAsync(`
      SELECT 
        m.id, m.content, m.type, m.fileUrl, m.fileName, m.fileSize,
        m.senderId, m.chatId, m.replyToId, m.createdAt, m.updatedAt,
        m.isEdited, m.editedAt,
        u.username, u.firstName, u.lastName, u.avatar as senderAvatar
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE m.id = ?
    `, [messageId]);

    res.json(updatedMessage);
  } catch (error) {
    console.error('Ошибка редактирования сообщения:', error.message);
    res.status(500).json({ error: 'Ошибка редактирования сообщения' });
  }
});

router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Проверяем в messages
    let message = await db.getAsync('SELECT senderId, chatId FROM messages WHERE id = ?', [messageId]);
    
    // Если не нашли, проверяем в image_messages
    if (!message) {
      message = await db.getAsync('SELECT senderId, chatId FROM image_messages WHERE id = ?', [messageId]);
      if (message && message.senderId === userId) {
        await db.runAsync('DELETE FROM image_messages WHERE id = ?', [messageId]);
        return res.json({ message: 'Файл удален', chatId: message.chatId });
      }
    }
    
    if (!message || message.senderId !== userId) {
      return res.status(403).json({ error: 'Нет прав на удаление этого сообщения' });
    }

    await db.runAsync('DELETE FROM messages WHERE id = ?', [messageId]);

    res.json({ message: 'Сообщение удалено', chatId: message.chatId });
  } catch (error) {
    console.error('Ошибка удаления сообщения:', error.message);
    res.status(500).json({ error: 'Ошибка удаления сообщения' });
  }
});

export default router;
