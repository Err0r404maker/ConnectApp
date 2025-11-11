import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));
db.runAsync = promisify(db.run.bind(db));

(async () => {
  try {
    console.log('👥 Настройка пользователей...\n');

    // Проверяем существующих пользователей
    const users = await db.allAsync('SELECT username FROM users');
    console.log('Существующие пользователи:', users.map(u => u.username).join(', ') || 'нет');

    // Создаем admin и demo
    const usersToCreate = [
      { username: 'admin', password: 'admin', email: 'admin@example.com', fullName: 'Администратор', role: 'ADMIN' },
      { username: 'demo', password: 'demo', email: 'demo@example.com', fullName: 'Demo User', role: 'STUDENT' }
    ];

    for (const userData of usersToCreate) {
      const existing = await db.getAsync('SELECT id FROM users WHERE username = ?', userData.username);
      
      if (existing) {
        console.log(`✅ ${userData.username} уже существует`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userId = crypto.randomUUID();
      
      await db.runAsync(
        'INSERT INTO users (id, username, email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        userId, userData.username, userData.email, hashedPassword, userData.fullName, '', userData.role
      );

      console.log(`✅ Создан ${userData.username} (пароль: ${userData.password})`);

      // Добавляем в общий чат
      const generalChat = await db.getAsync('SELECT id FROM chats WHERE name = ?', 'Общий чат');
      if (generalChat) {
        await db.runAsync(
          'INSERT INTO chat_members (chatId, userId, role) VALUES (?, ?, ?)',
          generalChat.id, userId, 'MEMBER'
        );
      }
    }

    console.log('\n🎉 Готово! Доступные аккаунты:');
    console.log('   admin / admin');
    console.log('   demo / demo');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    db.close();
  }
})();
