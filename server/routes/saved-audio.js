import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getDb } from '../database.js';

const router = express.Router();
const db = getDb();

// Получить все сохраненные аудио пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const savedAudio = await db.allAsync(
      `SELECT sa.*, m.fileUrl, m.fileName, m.createdAt as messageCreatedAt
       FROM saved_audio sa
       JOIN messages m ON sa.messageId = m.id
       WHERE sa.userId = ?
       ORDER BY sa.savedAt DESC`,
      [req.user.userId]
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
    // Проверяем, что сообщение существует и это аудио файл
    const message = await db.getAsync(
      'SELECT * FROM messages WHERE id = ? AND (type = "FILE" OR type = "VOICE")',
      [messageId]
    );
    
    if (!message) {
      return res.status(404).json({ error: 'Audio message not found' });
    }
    
    // Проверяем, не сохранено ли уже
    const existing = await db.getAsync(
      'SELECT * FROM saved_audio WHERE userId = ? AND messageId = ?',
      [req.user.userId, messageId]
    );
    
    if (existing) {
      return res.status(400).json({ error: 'Already saved' });
    }
    
    // Сохраняем
    await db.runAsync(
      'INSERT INTO saved_audio (userId, messageId, savedAt) VALUES (?, ?, ?)',
      [req.user.userId, messageId, new Date().toISOString()]
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
    await db.runAsync(
      'DELETE FROM saved_audio WHERE userId = ? AND messageId = ?',
      [req.user.userId, req.params.messageId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved audio:', error);
    res.status(500).json({ error: 'Failed to delete saved audio' });
  }
});

export default router;
