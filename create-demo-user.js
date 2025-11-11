import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');

async function createDemoUser() {
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Проверяем существует ли demo@demo.com
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', ['demo@demo.com'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existing) {
      console.log('❌ Пользователь demo@demo.com уже существует');
      console.log('Удаляем старого...');
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM users WHERE email = ?', ['demo@demo.com'], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Создаем нового пользователя
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const userId = randomUUID();

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO users (id, email, username, firstName, lastName, password, role)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userId, 'demo@demo.com', 'demouser', 'Demo', 'User', hashedPassword, 'STUDENT'], 
      (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('✅ Пользователь создан:');
    console.log('📧 Email: demo@demo.com');
    console.log('🔑 Пароль: demo123');
    console.log('👤 ID:', userId);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    db.close();
  }
}

createDemoUser();
