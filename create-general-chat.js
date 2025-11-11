import { db, initDatabase } from './server/database.js';
import { randomUUID } from 'crypto';

const createGeneralChat = async () => {
  try {
    await initDatabase();
    
    // Проверяем, есть ли уже чат
    const existingChat = await db.getAsync('SELECT id FROM chats WHERE id = ?', ['general-chat']);
    
    if (!existingChat) {
      // Создаем общий чат
      await db.runAsync(`
        INSERT INTO chats (id, name, type, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
      `, ['general-chat', 'Общий чат', 'GROUP', new Date().toISOString(), new Date().toISOString()]);
      
      console.log('✅ Общий чат создан');
      
      // Добавляем всех пользователей в общий чат
      const users = await db.allAsync('SELECT id FROM users');
      for (const user of users) {
        await db.runAsync(`
          INSERT OR IGNORE INTO chat_members (id, userId, chatId, role, joinedAt)
          VALUES (?, ?, ?, ?, ?)
        `, [randomUUID(), user.id, 'general-chat', 'MEMBER', new Date().toISOString()]);
      }
      
      console.log(`✅ Добавлено ${users.length} пользователей в общий чат`);
    } else {
      console.log('✅ Общий чат уже существует');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
};

createGeneralChat();