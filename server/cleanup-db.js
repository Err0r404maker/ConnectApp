import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Промисификация методов
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));
db.runAsync = promisify(db.run.bind(db));

console.log('🧹 Начинаю очистку базы данных...\n');

(async () => {
try {
  // Получаем ID общего чата
  const generalChat = await db.getAsync('SELECT id FROM chats WHERE name = ?', 'Общий чат');
  
  if (generalChat) {
    console.log('📝 Очистка сообщений в Общем чате...');
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM messages WHERE chatId = ?', generalChat.id, function(err) {
        if (err) reject(err);
        else {
          console.log(`✅ Удалено сообщений: ${this.changes}`);
          resolve();
        }
      });
    });
    
    console.log('✅ Сообщения в Общем чате очищены');
  }

  // Удаляем тестовых пользователей (оставляем только admin и demo)
  console.log('\n👥 Удаление тестовых пользователей...');
  const testUsers = await db.allAsync(`
    SELECT id, username FROM users 
    WHERE username NOT IN ('admin', 'demo')
  `);
  
  if (testUsers.length > 0) {
    console.log(`Найдено тестовых пользователей: ${testUsers.length}`);
    testUsers.forEach(user => {
      console.log(`  - ${user.username} (ID: ${user.id})`);
    });
    
    // Удаляем сообщения тестовых пользователей
    // Удаляем по одному
    for (const user of testUsers) {
      await db.runAsync('DELETE FROM messages WHERE senderId = ?', user.id);
      await db.runAsync('DELETE FROM chat_members WHERE userId = ?', user.id);
      await db.runAsync('DELETE FROM users WHERE id = ?', user.id);
    }
    console.log(`✅ Удалено пользователей: ${testUsers.length}`);
  } else {
    console.log('✅ Тестовых пользователей не найдено');
  }

  console.log('\n✅ Реакции уже актуальны');

  console.log('\n✨ Очистка завершена успешно!');
  console.log('\n💡 Реакции теперь: 👍 Лайк, ❤️ Сердечко, 😂 Смех, 🔥 Огонь, 👏 Аплодисменты');
  
  // Показываем статистику
  console.log('\n📊 Текущая статистика:');
  const stats = {
    users: (await db.getAsync('SELECT COUNT(*) as count FROM users')).count,
    chats: (await db.getAsync('SELECT COUNT(*) as count FROM chats')).count,
    messages: (await db.getAsync('SELECT COUNT(*) as count FROM messages')).count
  };
  
  console.log(`  Пользователей: ${stats.users}`);
  console.log(`  Чатов: ${stats.chats}`);
  console.log(`  Сообщений: ${stats.messages}`);

} catch (error) {
  console.error('❌ Ошибка при очистке:', error.message);
  process.exit(1);
} finally {
  db.close();
}
})();
