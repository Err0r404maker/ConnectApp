import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');

async function improveSystem() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔧 Улучшение системы\n');
  
  try {
    // Удаляем пустые чаты
    const emptyChats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT c.id, c.name FROM chats c
        LEFT JOIN chat_members cm ON c.id = cm.chatId
        WHERE cm.id IS NULL
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (emptyChats.length > 0) {
      console.log(`🗑️  Найдено ${emptyChats.length} пустых чатов. Удаляю...`);
      for (const chat of emptyChats) {
        await new Promise((resolve, reject) => {
          db.run('DELETE FROM chats WHERE id = ?', [chat.id], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log(`   ✓ Удален: ${chat.name}`);
      }
    } else {
      console.log('✅ Пустых чатов не найдено');
    }
    
    console.log('\n📊 Статистика после очистки:\n');
    
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          (SELECT COUNT(*) FROM users) as users,
          (SELECT COUNT(*) FROM chats) as chats,
          (SELECT COUNT(*) FROM chat_members) as members,
          (SELECT COUNT(*) FROM friends) as friends,
          (SELECT COUNT(*) FROM chat_invites) as invites
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log(`👥 Пользователей: ${stats.users}`);
    console.log(`💬 Чатов: ${stats.chats}`);
    console.log(`👤 Участников чатов: ${stats.members}`);
    console.log(`🤝 Друзей: ${stats.friends}`);
    console.log(`📨 Приглашений: ${stats.invites}`);
    
    console.log('\n💡 Рекомендации для улучшения:\n');
    console.log('1. Добавить кнопку "Удалить друга" в профиле');
    console.log('2. Добавить поиск пользователей по username');
    console.log('3. Добавить уведомления о новых запросах в друзья');
    console.log('4. Добавить список онлайн друзей');
    console.log('5. Добавить возможность создать групповой чат с друзьями');
    console.log('6. Добавить статус "печатает..." в личных чатах');
    console.log('7. Добавить возможность отправить файлы/изображения');
    console.log('8. Добавить реакции на сообщения (👍❤️😂)');
    console.log('9. Добавить закрепленные сообщения в чатах');
    console.log('10. Добавить поиск по сообщениям в чате');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    db.close();
  }
}

improveSystem();
