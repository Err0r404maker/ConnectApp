import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('ALTER TABLE messages ADD COLUMN isEdited BOOLEAN DEFAULT 0', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Ошибка добавления isEdited:', err.message);
    } else {
      console.log('✅ Колонка isEdited добавлена');
    }
  });

  db.run('ALTER TABLE messages ADD COLUMN editedAt DATETIME', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Ошибка добавления editedAt:', err.message);
    } else {
      console.log('✅ Колонка editedAt добавлена');
    }
  });

  db.run('ALTER TABLE messages ADD COLUMN originalContent TEXT', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Ошибка добавления originalContent:', err.message);
    } else {
      console.log('✅ Колонка originalContent добавлена');
    }
  });

  db.close(() => {
    console.log('✅ Миграция завершена');
  });
});
