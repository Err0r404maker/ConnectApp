import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');

async function testFriendsSystem() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🧪 Тестирование системы друзей\n');
  
  try {
    // Получаем пользователей
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT id, username, firstName, lastName FROM users LIMIT 5', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (users.length < 2) {
      console.log('❌ Недостаточно пользователей для теста. Создайте минимум 2 пользователя.');
      return;
    }
    
    console.log('👥 Найдено пользователей:', users.length);
    users.forEach(u => console.log(`  - ${u.username} (${u.firstName} ${u.lastName})`));
    console.log('');
    
    // Проверяем таблицу friends
    const friendsTable = await new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='friends'", (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!friendsTable) {
      console.log('❌ Таблица friends не найдена. Запустите миграции.');
      return;
    }
    
    console.log('✅ Таблица friends существует\n');
    
    // Проверяем существующие запросы в друзья
    const existingRequests = await new Promise((resolve, reject) => {
      db.all(`
        SELECT f.*, 
          u1.username as requester_username, 
          u2.username as friend_username
        FROM friends f
        JOIN users u1 ON f.userId = u1.id
        JOIN users u2 ON f.friendId = u2.id
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('📋 Существующие запросы в друзья:', existingRequests.length);
    if (existingRequests.length > 0) {
      existingRequests.forEach(req => {
        console.log(`  ${req.requester_username} → ${req.friend_username} [${req.status}]`);
      });
    }
    console.log('');
    
    // Проверяем чаты
    const chats = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM chats', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('💬 Чатов в системе:', chats.length);
    
    // Проверяем участников чатов
    for (const chat of chats) {
      const members = await new Promise((resolve, reject) => {
        db.all(`
          SELECT cm.*, u.username, u.firstName, u.lastName
          FROM chat_members cm
          JOIN users u ON cm.userId = u.id
          WHERE cm.chatId = ?
        `, [chat.id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      console.log(`  📁 ${chat.name} (${chat.type}): ${members.length} участников`);
      members.forEach(m => {
        console.log(`     - ${m.username} [${m.role}]`);
      });
    }
    console.log('');
    
    // Проверяем приглашения в чаты
    const invitesTable = await new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_invites'", (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (invitesTable) {
      const invites = await new Promise((resolve, reject) => {
        db.all(`
          SELECT ci.*, 
            u.username as invitee_username,
            c.name as chat_name
          FROM chat_invites ci
          JOIN users u ON ci.toUserId = u.id
          JOIN chats c ON ci.chatId = c.id
        `, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      console.log('📨 Приглашения в чаты:', invites.length);
      if (invites.length > 0) {
        invites.forEach(inv => {
          console.log(`  ${inv.invitee_username} → ${inv.chat_name} [${inv.status}]`);
        });
      }
    }
    
    console.log('\n✅ Тестирование завершено');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    db.close();
  }
}

testFriendsSystem();
