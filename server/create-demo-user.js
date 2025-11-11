import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import crypto from 'crypto';

const uuidv4 = () => crypto.randomUUID();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.getAsync = promisify(db.get.bind(db));
db.runAsync = promisify(db.run.bind(db));

(async () => {
  try {
    console.log('👤 Создание пользователя demo...\n');

    // Проверяем существует ли пользователь
    const existing = await db.getAsync('SELECT id FROM users WHERE username = ?', 'demo');
    
    if (existing) {
      console.log('✅ Пользователь demo уже существует');
      db.close();
      return;
    }

    // Создаем пользователя
    const hashedPassword = await bcrypt.hash('demo', 10);
    const userId = uuidv4();
    
    await db.runAsync(
      'INSERT INTO users (id, username, email, password, fullName, role) VALUES (?, ?, ?, ?, ?, ?)',
      userId, 'demo', 'demo@example.com', hashedPassword, 'Demo User', 'STUDENT'
    );

    console.log('✅ Пользователь создан:');
    console.log('   Username: demo');
    console.log('   Password: demo');
    console.log('   Email: demo@example.com');
    
    // Добавляем в общий чат
    const generalChat = await db.getAsync('SELECT id FROM chats WHERE name = ?', 'Общий чат');
    if (generalChat) {
      await db.runAsync(
        'INSERT INTO chat_members (chatId, userId, role) VALUES (?, ?, ?)',
        generalChat.id, userId, 'MEMBER'
      );
      console.log('✅ Добавлен в Общий чат');
    }

    console.log('\n🎉 Готово! Можете войти с логином: demo, пароль: demo');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    db.close();
  }
})();
