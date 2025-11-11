import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Проверка реализованных улучшений...\n');

const files = [
  // Онлайн-статус
  { path: 'client/src/utils/timeAgo.ts', feature: '🟢 Онлайн-статус' },
  { path: 'client/src/components/Sidebar.tsx', feature: '🟢 Онлайн-статус' },
  
  // Drag & Drop
  { path: 'client/src/components/DragDropZone.tsx', feature: '📎 Drag & Drop' },
  
  // Звуковые уведомления
  { path: 'client/src/utils/soundNotification.ts', feature: '🔔 Звуковые уведомления' },
  
  // Основные файлы
  { path: 'client/src/pages/ImprovedChatPage.tsx', feature: '💬 Главная страница' },
  { path: 'server/routes/friends.js', feature: '👥 API друзей' },
  { path: 'server/socket/handlers.js', feature: '⚡ WebSocket' },
];

let allGood = true;

console.log('📁 Проверка файлов:\n');

files.forEach(({ path: filePath, feature }) => {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    const size = (stats.size / 1024).toFixed(2);
    console.log(`✅ ${feature}`);
    console.log(`   ${filePath} (${size} KB)\n`);
  } else {
    console.log(`❌ ${feature}`);
    console.log(`   ${filePath} - НЕ НАЙДЕН!\n`);
    allGood = false;
  }
});

console.log('─'.repeat(60));

if (allGood) {
  console.log('\n✅ Все файлы на месте! Улучшения готовы к использованию.\n');
  console.log('📚 Документация:');
  console.log('   - IMPROVEMENTS_IMPLEMENTED.md - описание улучшений');
  console.log('   - TEST_IMPROVEMENTS.md - руководство по тестированию');
  console.log('   - CHANGELOG.md - список изменений\n');
  console.log('🚀 Запуск:');
  console.log('   cd server && npm run dev');
  console.log('   cd client && npm run dev\n');
} else {
  console.log('\n❌ Некоторые файлы отсутствуют. Проверьте установку.\n');
  process.exit(1);
}

// Проверка содержимого ключевых файлов
console.log('🔍 Проверка содержимого файлов:\n');

const checks = [
  {
    file: 'client/src/utils/timeAgo.ts',
    contains: 'timeAgo',
    name: 'Функция timeAgo'
  },
  {
    file: 'client/src/components/DragDropZone.tsx',
    contains: 'onFileDrop',
    name: 'Компонент DragDropZone'
  },
  {
    file: 'client/src/utils/soundNotification.ts',
    contains: 'soundNotification',
    name: 'Класс SoundNotification'
  },
  {
    file: 'client/src/components/Sidebar.tsx',
    contains: 'lastSeen',
    name: 'Отображение lastSeen'
  },
  {
    file: 'client/src/pages/ImprovedChatPage.tsx',
    contains: 'DragDropZone',
    name: 'Интеграция DragDropZone'
  },
  {
    file: 'client/src/pages/ImprovedChatPage.tsx',
    contains: 'soundNotification.play',
    name: 'Воспроизведение звука'
  },
];

checks.forEach(({ file, contains, name }) => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    if (content.includes(contains)) {
      console.log(`✅ ${name}`);
    } else {
      console.log(`⚠️  ${name} - не найден в файле`);
    }
  }
});

console.log('\n' + '─'.repeat(60));
console.log('\n🎉 Проверка завершена!\n');
