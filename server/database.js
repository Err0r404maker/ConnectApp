import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  constructor() {
    this.db = null;
  }

  async initializeSchema() {
    const schemaPath = path.join(__dirname, 'schema-simple.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.warn('⚠️ Файл схемы schema-simple.sql не найден');
      return;
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'));
    
    for (const statement of statements) {
      try {
        const cleanStatement = statement.trim();
        if (cleanStatement) {
          await this.db.runAsync(cleanStatement);
        }
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error('Ошибка выполнения SQL:', error.message);
        }
      }
    }
  }

  async init() {
    return new Promise((resolve, reject) => {
      try {
        const dataDir = path.join(__dirname, 'data');
        
        // Создаем директорию data если не существует
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
          console.log('📁 Создана директория data');
        }
        
        const dbPath = path.join(dataDir, 'database.sqlite');
        
        this.db = new sqlite3.Database(dbPath, async (err) => {
          if (err) {
            console.error('❌ Ошибка подключения к БД:', err.message);
            reject(err);
          } else {
            console.log('✅ База данных подключена');
            // Промисификация методов
            this.db.getAsync = promisify(this.db.get.bind(this.db));
            this.db.allAsync = promisify(this.db.all.bind(this.db));
            this.db.runAsync = promisify(this.db.run.bind(this.db));
            
            // Включаем FOREIGN KEYS
            await this.db.runAsync('PRAGMA foreign_keys = ON');
            
            // Инициализируем схему БД
            try {
              await this.initializeSchema();
              console.log('📋 Схема базы данных инициализирована');
              
              // Миграция: добавляем replyToId если не существует
              try {
                await this.db.runAsync('ALTER TABLE image_messages ADD COLUMN replyToId TEXT');
                console.log('✅ Добавлена колонка replyToId в image_messages');
              } catch (e) {
                if (!e.message.includes('duplicate column')) {
                  console.log('ℹ️ Колонка replyToId уже существует');
                }
              }
              
              // Миграция: добавляем поля для закрепления
              try {
                const tableInfo = await this.db.allAsync('PRAGMA table_info(image_messages)');
                const hasIsPinned = tableInfo.some(col => col.name === 'isPinned');
                
                if (!hasIsPinned) {
                  await this.db.runAsync('ALTER TABLE image_messages ADD COLUMN isPinned BOOLEAN DEFAULT 0');
                  await this.db.runAsync('ALTER TABLE image_messages ADD COLUMN pinnedAt DATETIME');
                  await this.db.runAsync('ALTER TABLE image_messages ADD COLUMN pinnedBy TEXT');
                  console.log('✅ Добавлены поля закрепления в image_messages');
                } else {
                  console.log('ℹ️ Поля закрепления уже существуют');
                }
              } catch (e) {
                console.error('Ошибка миграции закрепления:', e.message);
              }
              
              console.log('✅ Схема БД готова - ответы на медиа работают!');
            } catch (schemaError) {
              console.error('❌ Ошибка инициализации схемы:', schemaError.message);
            }
            
            resolve();
          }
        });
      } catch (error) {
        console.error('❌ Критическая ошибка инициализации БД:', error.message);
        reject(error);
      }
    });
  }
}

const database = new Database();

export const initDatabase = async () => {
  await database.init();
};

export const getDb = () => database.db;

// Для обратной совместимости
export const db = new Proxy({}, {
  get(target, prop) {
    const dbInstance = database.db;
    if (!dbInstance) {
      throw new Error('Database not initialized');
    }
    return dbInstance[prop];
  }
});