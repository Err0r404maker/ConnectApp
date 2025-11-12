import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getDb } from '../database.js';

const router = express.Router();

// Получить все сохраненные аудио пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const savedAudio = await db.allAsync(
      `SELECT sa.*, 
              COALESCE(m.fileUrl, im.imageData) as fileUrl, 
              COALESCE(m.fileName, im.fileName) as fileName, 
              COALESCE(m.createdAt, im.createdAt) as messageCreatedAt
       FROM saved_audio sa
       LEFT JOIN messages m ON sa.messageId = m.id
       LEFT JOIN image_messages im ON sa.messageId = im.id
       WHERE sa.userId = ?
       ORDER BY sa.savedAt DESC`,
      [req.user.id]
    );
    res.json(savedAudio);
  } catch (error) {
    console.error('Error fetching saved audio:', error);
    res.status(500).json({ error: 'Failed to fetch saved audio' });
  }
});

// Сохранить аудио
router.post('/', authenticateToken, async (req, res) => {
  const { messageId } = req.body;
  
  try {
    const db = getDb();
    // Проверяем в messages
    let message = await db.getAsync(
      'SELECT * FROM messages WHERE id = ? AND (type = "FILE" OR type = "VOICE")',
      [messageId]
    );
    
    // Если не найдено, проверяем image_messages
    if (!message) {
      message = await db.getAsync(
        'SELECT * FROM image_messages WHERE id = ? AND (fileName LIKE "%.mp3" OR fileName LIKE "%.wav" OR fileName LIKE "%.ogg")',
        [messageId]
      );
    }
    
    if (!message) {
      return res.status(404).json({ error: 'Audio message not found' });
    }
    
    // Проверяем, не сохранено ли уже
    const existing = await db.getAsync(
      'SELECT * FROM saved_audio WHERE userId = ? AND messageId = ?',
      [req.user.id, messageId]
    );
    
    if (existing) {
      return res.status(400).json({ error: 'Already saved' });
    }
    
    // Сохраняем с ID
    const crypto = await import('crypto');
    const savedId = crypto.randomUUID();
    await db.runAsync(
      'INSERT INTO saved_audio (id, userId, messageId, savedAt) VALUES (?, ?, ?, ?)',
      [savedId, req.user.id, messageId, new Date().toISOString()]
    );
    
    res.json({ success: true, message: 'Audio saved' });
  } catch (error) {
    console.error('Error saving audio:', error);
    res.status(500).json({ error: 'Failed to save audio' });
  }
});

// Удалить сохраненное аудио
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    await db.runAsync(
      'DELETE FROM saved_audio WHERE userId = ? AND messageId = ?',
      [req.user.id, req.params.messageId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved audio:', error);
    res.status(500).json({ error: 'Failed to delete saved audio' });
  }
});

export default router;
