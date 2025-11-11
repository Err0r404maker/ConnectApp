import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');

const db = new sqlite3.Database(dbPath);

db.all(`
  SELECT mr.*, u.username 
  FROM message_reactions mr
  LEFT JOIN users u ON mr.userId = u.id
  LIMIT 10
`, (err, rows) => {
  if (err) {
    console.error('Ошибка:', err.message);
  } else {
    console.log('Реакции:', rows);
  }
  db.close();
});
