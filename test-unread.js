import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');

const db = new sqlite3.Database(dbPath);

console.log('🔍 Проверка таблиц и данных...\n');

// Проверяем таблицы
db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, tables) => {
  if (err) {
    console.error('Ошибка:', err);
    return;
  }
  
  console.log('📋 Таблицы:', tables.map(t => t.name).join(', '));
  
  const hasMessageReads = tables.some(t => t.name === 'message_reads');
  console.log(`\n${hasMessageReads ? '✅' : '❌'} Таблица message_reads ${hasMessageReads ? 'существует' : 'НЕ существует'}`);
  
  if (hasMessageReads) {
    db.all('SELECT * FROM message_reads LIMIT 5', (err, reads) => {
      console.log('\n📊 Записи в message_reads:', reads?.length || 0);
      if (reads?.length) console.log(reads);
    });
  }
  
  // Проверяем сообщения
  db.all('SELECT chatId, COUNT(*) as count FROM messages GROUP BY chatId', (err, msgs) => {
    console.log('\n💬 Сообщения по чатам:');
    msgs?.forEach(m => console.log(`  ${m.chatId}: ${m.count} сообщений`));
  });
  
  // Проверяем chat_members
  db.all('SELECT chatId, userId, lastReadMessageId FROM chat_members LIMIT 10', (err, members) => {
    console.log('\n👥 Chat members:');
    members?.forEach(m => console.log(`  ${m.userId} в ${m.chatId}, lastRead: ${m.lastReadMessageId || 'null'}`));
    
    setTimeout(() => db.close(), 100);
  });
});
