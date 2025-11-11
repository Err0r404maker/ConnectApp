import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');

async function checkMedia() {
  const db = new sqlite3.Database(dbPath);
  
  try {
    console.log('🔍 Проверка медиа в базе данных...\n');
    
    // Проверяем сообщения с изображениями
    const imageMessages = await new Promise((resolve, reject) => {
      db.all("SELECT id, type, fileName, fileUrl FROM messages WHERE type = 'IMAGE' LIMIT 5", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('📸 Сообщения с изображениями (messages):');
    console.log(`   Найдено: ${imageMessages.length}`);
    if (imageMessages.length > 0) {
      imageMessages.forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg.fileName || 'Без имени'}`);
        console.log(`      fileUrl: ${msg.fileUrl ? msg.fileUrl.substring(0, 50) + '...' : 'НЕТ'}`);
      });
    }
    
    // Проверяем image_messages
    const imageMessagesTable = await new Promise((resolve, reject) => {
      db.all("SELECT id, fileName, imageData FROM image_messages LIMIT 5", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('\n🖼️ Таблица image_messages:');
    console.log(`   Найдено: ${imageMessagesTable.length}`);
    if (imageMessagesTable.length > 0) {
      imageMessagesTable.forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg.fileName || 'Без имени'}`);
        console.log(`      imageData: ${msg.imageData ? msg.imageData.substring(0, 50) + '...' : 'НЕТ'}`);
      });
    }
    
    // Проверяем файлы
    const fileMessages = await new Promise((resolve, reject) => {
      db.all("SELECT id, type, fileName, fileUrl FROM messages WHERE type IN ('FILE', 'VOICE') LIMIT 5", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('\n📎 Сообщения с файлами:');
    console.log(`   Найдено: ${fileMessages.length}`);
    if (fileMessages.length > 0) {
      fileMessages.forEach((msg, i) => {
        console.log(`   ${i + 1}. [${msg.type}] ${msg.fileName || 'Без имени'}`);
        console.log(`      fileUrl: ${msg.fileUrl ? msg.fileUrl.substring(0, 50) + '...' : 'НЕТ'}`);
      });
    }
    
    // Общая статистика
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          (SELECT COUNT(*) FROM messages WHERE type = 'IMAGE') as imageCount,
          (SELECT COUNT(*) FROM messages WHERE type = 'FILE') as fileCount,
          (SELECT COUNT(*) FROM messages WHERE type = 'VOICE') as voiceCount,
          (SELECT COUNT(*) FROM image_messages) as imageMessagesCount
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log('\n📊 Общая статистика:');
    console.log(`   Изображения (messages): ${stats.imageCount}`);
    console.log(`   Изображения (image_messages): ${stats.imageMessagesCount}`);
    console.log(`   Файлы: ${stats.fileCount}`);
    console.log(`   Голосовые: ${stats.voiceCount}`);
    console.log(`   Всего медиа: ${stats.imageCount + stats.imageMessagesCount + stats.fileCount + stats.voiceCount}`);
    
    if (stats.imageCount + stats.imageMessagesCount + stats.fileCount + stats.voiceCount === 0) {
      console.log('\n⚠️  В базе данных нет медиа файлов!');
      console.log('   Отправьте изображение или файл в чат, чтобы протестировать галерею.');
    } else {
      console.log('\n✅ Медиа файлы найдены в базе данных!');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    db.close();
  }
}

checkMedia();
