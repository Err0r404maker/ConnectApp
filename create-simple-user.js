import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');

const db = new sqlite3.Database(dbPath);

const userId = randomUUID();
const email = 'test@test.com';
const password = 'test1234'; // 8 символов, буквы и цифры

bcrypt.hash(password, 12, (err, hash) => {
  if (err) {
    console.error('Ошибка хеширования:', err);
    db.close();
    return;
  }

  db.run(
    `INSERT OR REPLACE INTO users (id, email, username, firstName, lastName, password, role, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, email, 'testuser', 'Тест', 'Пользователь', hash, 'STUDENT', 'OFFLINE'],
    (err) => {
      if (err) {
        console.error('Ошибка создания пользователя:', err);
      } else {
        console.log('✅ Пользователь создан:');
        console.log('📧 Email: test@test.com');
        console.log('🔑 Пароль: test1234');
      }
      db.close();
    }
  );
});
