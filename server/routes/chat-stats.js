import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../database.js';

const router = express.Router();

// Получить расширенную статистику чата
router.get('/:chatId/stats', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Проверяем доступ к чату
    const membership = await db.getAsync(
      'SELECT id FROM chat_members WHERE userId = ? AND chatId = ?',
      [userId, chatId]
    );

    if (!membership) {
      return res.status(403).json({ error: 'Нет доступа к чату' });
    }

    // Базовая информация о чате
    const chat = await db.getAsync('SELECT * FROM chats WHERE id = ?', [chatId]);
    
    // Общее количество сообщений
    const messageCount = await db.getAsync(
      'SELECT COUNT(*) as count FROM messages WHERE chatId = ?',
      [chatId]
    );
    
    const imageCount = await db.getAsync(
      'SELECT COUNT(*) as count FROM image_messages WHERE chatId = ?',
      [chatId]
    );
    
    const totalMessages = (messageCount?.count || 0) + (imageCount?.count || 0);

    // Количество участников
    const memberCount = await db.getAsync(
      'SELECT COUNT(*) as count FROM chat_members WHERE chatId = ?',
      [chatId]
    );

    // Типы сообщений
    const textMessages = await db.getAsync(
      "SELECT COUNT(*) as count FROM messages WHERE chatId = ? AND type = 'TEXT'",
      [chatId]
    );
    
    const voiceMessages = await db.getAsync(
      "SELECT COUNT(*) as count FROM messages WHERE chatId = ? AND type = 'VOICE'",
      [chatId]
    );
    
    const fileMessages = await db.getAsync(
      "SELECT COUNT(*) as count FROM messages WHERE chatId = ? AND type = 'FILE'",
      [chatId]
    );

    // Топ пользователей по активности
    const topUsers = await db.allAsync(`
      SELECT 
        u.firstName || ' ' || u.lastName as name,
        u.avatar,
        COUNT(*) as count
      FROM (
        SELECT senderId FROM messages WHERE chatId = ?
        UNION ALL
        SELECT senderId FROM image_messages WHERE chatId = ?
      ) as all_messages
      JOIN users u ON all_messages.senderId = u.id
      GROUP BY all_messages.senderId
      ORDER BY count DESC
      LIMIT 5
    `, [chatId, chatId]);

    // Количество реакций
    const reactionCount = await db.getAsync(`
      SELECT COUNT(*) as count 
      FROM message_reactions mr
      JOIN messages m ON mr.messageId = m.id
      WHERE m.chatId = ?
    `, [chatId]);

    // Количество закрепленных сообщений
    const pinnedCount = await db.getAsync(
      'SELECT COUNT(*) as count FROM messages WHERE chatId = ? AND isPinned = 1',
      [chatId]
    );

    // Последнее сообщение
    const lastMessage = await db.getAsync(
      'SELECT createdAt FROM messages WHERE chatId = ? ORDER BY createdAt DESC LIMIT 1',
      [chatId]
    );
    
    // Сообщения за последние 24 часа
    const recentMessages = await db.getAsync(`
      SELECT COUNT(*) as count FROM messages 
      WHERE chatId = ? AND datetime(createdAt) > datetime('now', '-1 day')
    `, [chatId]);
    
    // Самый популярный эмодзи
    const topEmoji = await db.getAsync(`
      SELECT emoji, COUNT(*) as count
      FROM message_reactions mr
      JOIN messages m ON mr.messageId = m.id
      WHERE m.chatId = ?
      GROUP BY emoji
      ORDER BY count DESC
      LIMIT 1
    `, [chatId]);
    
    // Средняя длина сообщений
    const avgLength = await db.getAsync(`
      SELECT AVG(LENGTH(content)) as avg FROM messages WHERE chatId = ? AND type = 'TEXT'
    `, [chatId]);
    
    // Самый активный день недели
    const activeDayOfWeek = await db.getAsync(`
      SELECT strftime('%w', createdAt) as day, COUNT(*) as count
      FROM messages WHERE chatId = ?
      GROUP BY day ORDER BY count DESC LIMIT 1
    `, [chatId]);
    
    // Самый активный час
    const activeHour = await db.getAsync(`
      SELECT strftime('%H', createdAt) as hour, COUNT(*) as count
      FROM messages WHERE chatId = ?
      GROUP BY hour ORDER BY count DESC LIMIT 1
    `, [chatId]);

    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    
    res.json({
      chatInfo: {
        name: chat?.name,
        username: chat?.username,
        type: chat?.type,
        createdAt: chat?.createdAt
      },
      totalMessages,
      totalMembers: memberCount?.count || 0,
      messageTypes: {
        text: textMessages?.count || 0,
        image: imageCount?.count || 0,
        file: fileMessages?.count || 0,
        voice: voiceMessages?.count || 0
      },
      topUsers: topUsers || [],
      totalReactions: reactionCount?.count || 0,
      pinnedCount: pinnedCount?.count || 0,
      lastActivity: lastMessage?.createdAt || chat?.createdAt,
      messagesLast24h: recentMessages?.count || 0,
      topEmoji: topEmoji ? { emoji: topEmoji.emoji, count: topEmoji.count } : null,
      avgMessageLength: Math.round(avgLength?.avg || 0),
      mostActiveDay: activeDayOfWeek ? dayNames[activeDayOfWeek.day] : null,
      mostActiveHour: activeHour ? `${activeHour.hour}:00` : null
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error.message);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

export default router;
