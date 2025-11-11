import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');

async function cleanupDB() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🧹 Очистка базы данных\n');
  
  try {
    // Удаляем участников чатов с несуществующими пользователями
    const orphanedMembers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT cm.id, cm.userId, cm.chatId
        FROM chat_members cm
        LEFT JOIN users u ON cm.userId = u.id
        WHERE u.id IS NULL
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (orphanedMembers.length > 0) {
      console.log(`🗑️  Найдено ${orphanedMembers.length} участников с несуществующими пользователями`);
      for (const member of orphanedMembers) {
        await new Promise((resolve, reject) => {
          db.run('DELETE FROM chat_members WHERE id = ?', [member.id], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log(`   ✓ Удален участник ${member.userId} из чата ${member.chatId}`);
      }
    } else {
      console.log('✅ Нет участников с несуществующими пользователями');
    }
    
    // Удаляем друзей с несуществующими пользователями
    const orphanedFriends = await new Promise((resolve, reject) => {
      db.all(`
        SELECT f.id, f.userId, f.friendId
        FROM friends f
        LEFT JOIN users u1 ON f.userId = u1.id
        LEFT JOIN users u2 ON f.friendId = u2.id
        WHERE u1.id IS NULL OR u2.id IS NULL
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (orphanedFriends.length > 0) {
      console.log(`\n🗑️  Найдено ${orphanedFriends.length} записей друзей с несуществующими пользователями`);
      for (const friend of orphanedFriends) {
        await new Promise((resolve, reject) => {
          db.run('DELETE FROM friends WHERE id = ?', [friend.id], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log(`   ✓ Удалена связь ${friend.userId} ↔ ${friend.friendId}`);
      }
    } else {
      console.log('\n✅ Нет друзей с несуществующими пользователями');
    }
    
    // Удаляем сообщения от несуществующих пользователей
    const orphanedMessages = await new Promise((resolve, reject) => {
      db.all(`
        SELECT m.id, m.senderId
        FROM messages m
        LEFT JOIN users u ON m.senderId = u.id
        WHERE u.id IS NULL
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (orphanedMessages.length > 0) {
      console.log(`\n🗑️  Найдено ${orphanedMessages.length} сообщений от несуществующих пользователей`);
      for (const message of orphanedMessages) {
        await new Promise((resolve, reject) => {
          db.run('DELETE FROM messages WHERE id = ?', [message.id], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      console.log(`   ✓ Удалено ${orphanedMessages.length} сообщений`);
    } else {
      console.log('\n✅ Нет сообщений от несуществующих пользователей');
    }
    
    console.log('\n📊 Статистика после очистки:\n');
    
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          (SELECT COUNT(*) FROM users) as users,
          (SELECT COUNT(*) FROM chats) as chats,
          (SELECT COUNT(*) FROM chat_members) as members,
          (SELECT COUNT(*) FROM messages) as messages,
          (SELECT COUNT(*) FROM friends) as friends
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log(`👥 Пользователей: ${stats.users}`);
    console.log(`💬 Чатов: ${stats.chats}`);
    console.log(`👤 Участников чатов: ${stats.members}`);
    console.log(`📝 Сообщений: ${stats.messages}`);
    console.log(`🤝 Друзей: ${stats.friends}`);
    
    console.log('\n✅ Очистка завершена');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    db.close();
  }
}

cleanupDB();
