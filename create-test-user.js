import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');

async function createTestUser() {
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Создаем таблицы если их нет
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'STUDENT',
          avatar TEXT,
          isOnline BOOLEAN DEFAULT FALSE,
          lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Проверяем есть ли уже пользователи
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (users.length > 0) {
      console.log('✅ Пользователи уже существуют:');
      users.forEach(user => {
        console.log(`- ${user.email} (${user.role})`);
      });
      return;
    }

    // Создаем тестовых пользователей
    const testUsers = [
      {
        id: 'user-1',
        email: 'student@test.com',
        username: 'student',
        firstName: 'Иван',
        lastName: 'Студентов',
        password: await bcrypt.hash('123456', 10),
        role: 'STUDENT'
      },
      {
        id: 'user-2', 
        email: 'teacher@test.com',
        username: 'teacher',
        firstName: 'Мария',
        lastName: 'Преподавателева',
        password: await bcrypt.hash('123456', 10),
        role: 'TEACHER'
      }
    ];

    for (const user of testUsers) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO users (id, email, username, firstName, lastName, password, role)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [user.id, user.email, user.username, user.firstName, user.lastName, user.password, user.role], 
        (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log('✅ Тестовые пользователи созданы:');
    console.log('📧 student@test.com / 123456 (STUDENT)');
    console.log('📧 teacher@test.com / 123456 (TEACHER)');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    db.close();
  }
}

createTestUser();