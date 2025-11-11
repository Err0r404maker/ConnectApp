import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'server', 'data', 'database.sqlite');
const migrationPath = join(__dirname, 'server', 'migrations', 'add_invites_and_friends.sql');

async function applyMigrations() {
  const db = new sqlite3.Database(dbPath);
  
  try {
    const sql = readFileSync(migrationPath, 'utf8');
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      await new Promise((resolve, reject) => {
        db.run(statement, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    console.log('✅ Миграции применены успешно');
  } catch (error) {
    console.error('❌ Ошибка применения миграций:', error.message);
  } finally {
    db.close();
  }
}

applyMigrations();
