import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');

const db = new sqlite3.Database(dbPath);

const updates = [
  // Добавляем lastReadMessageId в chat_members
  `ALTER TABLE chat_members ADD COLUMN lastReadMessageId TEXT`,
  
  // Создаем таблицу message_reads
  `CREATE TABLE IF NOT EXISTS message_reads (
    id TEXT PRIMARY KEY,
    messageId TEXT NOT NULL,
    userId TEXT NOT NULL,
    readAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(messageId, userId)
  )`,
  
  // Индексы
  `CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(messageId)`,
  `CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(userId)`
];

console.log('🔄 Применяю обновления схемы БД...\n');

let completed = 0;
updates.forEach((sql, index) => {
  db.run(sql, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error(`❌ Ошибка ${index + 1}:`, err.message);
    } else {
      console.log(`✅ Обновление ${index + 1}/${updates.length} применено`);
    }
    
    completed++;
    if (completed === updates.length) {
      console.log('\n✅ Все обновления применены!');
      db.close();
    }
  });
});
