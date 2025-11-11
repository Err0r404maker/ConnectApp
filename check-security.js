#!/usr/bin/env node

/**
 * 🔒 Скрипт проверки безопасности проекта
 * Проверяет критические настройки безопасности
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

console.log('🔒 Проверка безопасности проекта...\n');

let hasErrors = false;
let hasWarnings = false;

function error(message) {
  console.error(`❌ КРИТИЧНО: ${message}`);
  hasErrors = true;
}

function warning(message) {
  console.warn(`⚠️  ПРЕДУПРЕЖДЕНИЕ: ${message}`);
  hasWarnings = true;
}

function success(message) {
  console.log(`✅ ${message}`);
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

// 1. Проверка переменных окружения
console.log('📋 Проверка переменных окружения:');

const envPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(envPath)) {
  error('Файл .env не найден в папке server/');
  error('Скопируйте server/.env.example в server/.env и настройте переменные');
} else {
  success('Файл .env найден');
  
  // Проверяем JWT секреты
  if (!process.env.JWT_SECRET) {
    error('JWT_SECRET не установлен в .env');
  } else if (process.env.JWT_SECRET.length < 32) {
    error(`JWT_SECRET слишком короткий (${process.env.JWT_SECRET.length} символов, нужно минимум 32)`);
  } else if (process.env.JWT_SECRET === 'CHANGE_THIS_TO_RANDOM_32_CHAR_STRING') {
    error('JWT_SECRET не изменен с примера! Установите случайную строку');
  } else {
    success(`JWT_SECRET установлен корректно (${process.env.JWT_SECRET.length} символов)`);
  }
  
  if (!process.env.JWT_REFRESH_SECRET) {
    error('JWT_REFRESH_SECRET не установлен в .env');
  } else if (process.env.JWT_REFRESH_SECRET.length < 32) {
    error(`JWT_REFRESH_SECRET слишком короткий (${process.env.JWT_REFRESH_SECRET.length} символов, нужно минимум 32)`);
  } else if (process.env.JWT_REFRESH_SECRET === 'CHANGE_THIS_TO_ANOTHER_32_CHAR_STRING') {
    error('JWT_REFRESH_SECRET не изменен с примера! Установите случайную строку');
  } else {
    success(`JWT_REFRESH_SECRET установлен корректно (${process.env.JWT_REFRESH_SECRET.length} символов)`);
  }
  
  // Проверяем демо пароли
  if (process.env.DEMO_PASSWORD === 'demo123' || process.env.DEMO_PASSWORD === 'changeme123') {
    warning('DEMO_PASSWORD использует небезопасное значение по умолчанию');
  }
  
  if (process.env.TEST_STUDENT_PASSWORD === '123456') {
    warning('TEST_STUDENT_PASSWORD использует небезопасное значение по умолчанию');
  }
  
  if (process.env.TEST_TEACHER_PASSWORD === '123456') {
    warning('TEST_TEACHER_PASSWORD использует небезопасное значение по умолчанию');
  }
}

console.log();

// 2. Проверка файлов на жестко закодированные секреты
console.log('🔍 Проверка файлов на жестко закодированные секреты:');

const dangerousPatterns = [
  { pattern: /password.*=.*['"][^'"]{1,20}['"]/, message: 'Возможно жестко закодированный пароль' },
  { pattern: /secret.*=.*['"][^'"]{1,50}['"]/, message: 'Возможно жестко закодированный секрет' },
  { pattern: /jwt\.sign\([^,]+,\s*['"][^'"]+['"]/, message: 'JWT подписывается жестко закодированным секретом' },
  { pattern: /demo123|123456|password123/i, message: 'Найден небезопасный пароль по умолчанию' }
];

const filesToCheck = [
  'server/routes/auth.js',
  'server/simple-auth.js', 
  'server/minimal-server.js',
  'clean-server.js',
  'server/create-test-user.js',
  'server/secure.js'
];

let foundSecrets = false;

filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    dangerousPatterns.forEach(({ pattern, message }) => {
      const matches = content.match(pattern);
      if (matches) {
        warning(`${filePath}: ${message}`);
        foundSecrets = true;
      }
    });
  }
});

if (!foundSecrets) {
  success('Жестко закодированные секреты не найдены');
}

console.log();

// 3. Проверка зависимостей
console.log('📦 Проверка зависимостей:');

const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Проверяем наличие важных зависимостей безопасности
  const securityDeps = ['helmet', 'express-rate-limit', 'bcryptjs'];
  const serverPackageJsonPath = path.join(__dirname, 'server', 'package.json');
  
  if (fs.existsSync(serverPackageJsonPath)) {
    const serverPackageJson = JSON.parse(fs.readFileSync(serverPackageJsonPath, 'utf8'));
    const allDeps = { ...serverPackageJson.dependencies, ...serverPackageJson.devDependencies };
    
    securityDeps.forEach(dep => {
      if (allDeps[dep]) {
        success(`${dep} установлен (${allDeps[dep]})`);
      } else {
        warning(`${dep} не установлен - рекомендуется для безопасности`);
      }
    });
  }
}

console.log();

// 4. Проверка файловых разрешений
console.log('📁 Проверка файловых разрешений:');

const sensitiveFiles = [
  'server/.env',
  'server/data/database.sqlite'
];

sensitiveFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    try {
      const stats = fs.statSync(fullPath);
      // В Windows проверка разрешений ограничена
      success(`${filePath} существует`);
    } catch (err) {
      warning(`Не удалось проверить разрешения для ${filePath}: ${err.message}`);
    }
  } else {
    info(`${filePath} не найден (это нормально, если файл еще не создан)`);
  }
});

console.log();

// 5. Итоговый отчет
console.log('📊 ИТОГОВЫЙ ОТЧЕТ:');

if (hasErrors) {
  console.log('❌ НАЙДЕНЫ КРИТИЧЕСКИЕ ПРОБЛЕМЫ БЕЗОПАСНОСТИ!');
  console.log('   Исправьте их перед запуском в продакшене.');
} else if (hasWarnings) {
  console.log('⚠️  Найдены предупреждения безопасности.');
  console.log('   Рекомендуется исправить их для повышения безопасности.');
} else {
  console.log('✅ Все проверки безопасности пройдены!');
}

console.log();

// 6. Рекомендации
console.log('💡 РЕКОМЕНДАЦИИ:');
console.log('1. Регулярно обновляйте зависимости: npm audit fix');
console.log('2. Используйте HTTPS в продакшене');
console.log('3. Настройте мониторинг безопасности');
console.log('4. Проводите регулярные аудиты безопасности');
console.log('5. Никогда не коммитьте .env файлы');

if (hasErrors) {
  process.exit(1);
} else {
  process.exit(0);
}