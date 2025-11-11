// Простое решение - создаем отдельную таблицу для изображений
import { db, initDatabase } from './server/database.js';

const createImageTable = async () => {
  try {
    await initDatabase();
    
    // Создаем простую таблицу для изображений
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS image_messages (
        id TEXT PRIMARY KEY,
        chatId TEXT NOT NULL,
        senderId TEXT NOT NULL,
        senderName TEXT NOT NULL,
        imageData TEXT NOT NULL,
        fileName TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Таблица изображений создана');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
};

createImageTable();