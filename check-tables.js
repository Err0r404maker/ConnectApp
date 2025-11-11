import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');

const db = new sqlite3.Database(dbPath);

db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, tables) => {
  if (err) {
    console.error('Ошибка:', err.message);
  } else {
    console.log('Таблицы в БД:', tables.map(t => t.name));
    
    // Проверяем структуру message_reactions
    db.all(`PRAGMA table_info(message_reactions)`, (err2, cols) => {
      if (err2) {
        console.log('Таблица message_reactions не существует');
      } else {
        console.log('\nСтруктура message_reactions:', cols);
      }
      db.close();
    });
  }
});
