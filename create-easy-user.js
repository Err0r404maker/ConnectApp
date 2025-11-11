import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const db = new sqlite3.Database('./server/data/database.sqlite');

const userId = randomUUID();
const email = 'admin@admin.com';
const password = '123456';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Ошибка:', err);
    db.close();
    return;
  }

  db.run(
    `INSERT OR REPLACE INTO users (id, email, username, firstName, lastName, password, role, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, email, 'admin', 'Админ', 'Админов', hash, 'ADMIN', 'OFFLINE'],
    (err) => {
      if (err) {
        console.error('Ошибка:', err);
      } else {
        console.log('✅ Пользователь создан!');
        console.log('📧 Email: admin@admin.com');
        console.log('🔑 Пароль: 123456');
      }
      db.close();
    }
  );
});
