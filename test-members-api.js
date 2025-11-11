import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');

async function testMembersAPI() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🧪 Тест API участников\n');
  
  try {
    // Получаем первый чат с участниками
    const chat = await new Promise((resolve, reject) => {
      db.get(`
        SELECT c.id, c.name, COUNT(cm.id) as memberCount
        FROM chats c
        LEFT JOIN chat_members cm ON c.id = cm.chatId
        GROUP BY c.id
        HAVING memberCount > 0
        LIMIT 1
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!chat) {
      console.log('❌ Нет чатов с участниками');
      return;
    }
    
    console.log(`📁 Тестируем чат: ${chat.name} (${chat.id})`);
    console.log(`   Участников в БД: ${chat.memberCount}\n`);
    
    // Тестируем запрос как в API
    const members = await new Promise((resolve, reject) => {
      db.all(`
        SELECT cm.userId, cm.role, cm.joinedAt, u.username, u.firstName, u.lastName, u.avatar,
               CASE WHEN u.status = 'ONLINE' THEN 1 ELSE 0 END as isOnline
        FROM chat_members cm
        LEFT JOIN users u ON cm.userId = u.id
        WHERE cm.chatId = ?
        ORDER BY cm.role DESC, u.firstName
      `, [chat.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📊 Результат запроса: ${members.length} участников\n`);
    
    members.forEach((m, i) => {
      console.log(`${i + 1}. ${m.username || 'NO USERNAME'} (${m.firstName || 'NO NAME'} ${m.lastName || ''}) [${m.role}]`);
      if (!m.username) {
        console.log(`   ⚠️  userId: ${m.userId} - пользователь не найден в таблице users!`);
      }
    });
    
    const validMembers = members.filter(m => m.username);
    console.log(`\n✅ Валидных участников: ${validMembers.length}`);
    
    if (validMembers.length === 0 && members.length > 0) {
      console.log('\n❌ ПРОБЛЕМА: Все участники имеют несуществующих пользователей!');
      console.log('   Запустите: node cleanup-db.js');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    db.close();
  }
}

testMembersAPI();
