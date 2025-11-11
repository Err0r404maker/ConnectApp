import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');

async function testFixes() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔍 Проверка исправлений...\n');
  
  try {
    // 1. Проверяем таблицу message_reads
    const messageReads = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='message_reads'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (messageReads.length > 0) {
      console.log('✅ Таблица message_reads существует');
      
      // Проверяем структуру
      const columns = await new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(message_reads)", (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      console.log('   Колонки:', columns.map(c => c.name).join(', '));
    } else {
      console.log('❌ Таблица message_reads не найдена');
    }
    
    // 2. Проверяем поля isEdited и editedAt в messages
    const messageColumns = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(messages)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const hasIsEdited = messageColumns.some(c => c.name === 'isEdited');
    const hasEditedAt = messageColumns.some(c => c.name === 'editedAt');
    const hasOriginalContent = messageColumns.some(c => c.name === 'originalContent');
    
    console.log('\n📝 Таблица messages:');
    console.log(hasIsEdited ? '✅ Поле isEdited существует' : '❌ Поле isEdited отсутствует');
    console.log(hasEditedAt ? '✅ Поле editedAt существует' : '❌ Поле editedAt отсутствует');
    console.log(hasOriginalContent ? '✅ Поле originalContent существует' : '❌ Поле originalContent отсутствует');
    
    // 3. Проверяем количество сообщений и отметок прочтения
    const messageCount = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM messages", (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    const readCount = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM message_reads", (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    console.log('\n📊 Статистика:');
    console.log(`   Всего сообщений: ${messageCount}`);
    console.log(`   Отметок прочтения: ${readCount}`);
    
    // 4. Проверяем индексы
    const indexes = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='message_reads'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('\n🔍 Индексы для message_reads:');
    if (indexes.length > 0) {
      indexes.forEach(idx => console.log(`   ✅ ${idx.name}`));
    } else {
      console.log('   ⚠️  Индексы не найдены');
    }
    
    console.log('\n✨ Проверка завершена!\n');
    console.log('📋 Следующие шаги:');
    console.log('   1. Перезапустите сервер: cd server && npm start');
    console.log('   2. Перезапустите клиент: cd client && npm run dev');
    console.log('   3. Откройте два окна браузера с разными пользователями');
    console.log('   4. Проверьте функции редактирования, удаления и счетчик непрочитанных\n');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    db.close();
  }
}

testFixes();
