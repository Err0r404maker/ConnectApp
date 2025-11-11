# 🔧 Исправление реакций и прочтения для файлов/медиа

## ❌ Проблема

1. **Реакции не ставились на файлы/медиа** - работали только для текстовых сообщений
2. **Файлы/медиа не помечались прочитанными** - учитывались только текстовые сообщения

## 🔍 Причина

Файлы и медиа хранятся в отдельной таблице `image_messages`, а логика работала только с таблицей `messages`.

## ✅ Решение

### 1. Backend - Реакции (`server/routes/reactions.js`)

**Было:**
```javascript
const message = await db.getAsync('SELECT chatId FROM messages WHERE id = ?', [messageId]);
if (!message) {
  return res.status(404).json({ error: 'Сообщение не найдено' });
}
```

**Стало:**
```javascript
// Проверяем в обеих таблицах
let message = await db.getAsync('SELECT chatId FROM messages WHERE id = ?', [messageId]);
if (!message) {
  message = await db.getAsync('SELECT chatId FROM image_messages WHERE id = ?', [messageId]);
}
if (!message) {
  return res.status(404).json({ error: 'Сообщение не найдено' });
}
```

### 2. Backend - Прочтение (`server/routes/message-reads.js`)

**Уже исправлено ранее:**
```javascript
// Получаем все непрочитанные текстовые сообщения
const unreadMessages = await db.allAsync(...);

// Получаем все непрочитанные изображения
const unreadImages = await db.allAsync(...);

const allUnread = [...unreadMessages, ...unreadImages];
```

### 3. Backend - Загрузка файлов с реакциями (`server/routes/simple-images.js`)

**Было:**
```javascript
const formattedFiles = files.map(file => ({
  id: file.id,
  // ... другие поля
}));
```

**Стало:**
```javascript
const formattedFiles = await Promise.all(files.map(async (file) => {
  // Загружаем реакции для каждого файла/медиа
  const reactions = await db.allAsync(`
    SELECT emoji, COUNT(*) as count
    FROM message_reactions
    WHERE messageId = ?
    GROUP BY emoji
  `, [file.id]);
  
  const reactionsObj = {};
  reactions.forEach(r => {
    reactionsObj[r.emoji] = r.count;
  });
  
  return {
    id: file.id,
    // ... другие поля
    reactions: reactionsObj
  };
}));
```

### 4. Frontend - Обогащение данных (`client/src/pages/ImprovedChatPage.tsx`)

**Было:**
```javascript
if (imagesResponse.ok) {
  const imageMessages = await imagesResponse.json();
  allMessages = [...allMessages, ...imageMessages];
}
```

**Стало:**
```javascript
if (imagesResponse.ok) {
  const imageMessages = await imagesResponse.json();
  // Добавляем статусы прочтения и реакции для файлов/медиа
  const enrichedImages = imageMessages.map((img: any) => ({
    ...img,
    isRead: readStatus[img.id]?.isRead || false,
    readCount: readStatus[img.id]?.readCount || 0,
    totalMembers: readStatus[img.id]?.totalMembers || 0,
    status: readStatus[img.id]?.isRead ? 'read' : 'delivered',
    reactions: img.reactions || {},
    sender: {
      id: img.senderId,
      firstName: img.firstName || '',
      lastName: img.lastName || '',
      avatar: img.avatar
    }
  }));
  allMessages = [...allMessages, ...enrichedImages];
}
```

## 🎯 Результат

### Теперь работает:

✅ **Реакции на файлы/медиа**
- Можно ставить эмодзи на изображения
- Можно ставить эмодзи на файлы
- Можно ставить эмодзи на голосовые сообщения
- Счетчик реакций отображается корректно

✅ **Прочтение файлов/медиа**
- Файлы помечаются прочитанными при открытии чата
- Изображения помечаются прочитанными
- Двойные галочки ✓✓ отображаются
- Счетчик прочитавших работает (✓✓ 3)

✅ **Единая логика**
- Текстовые сообщения и файлы/медиа обрабатываются одинаково
- Все функции работают для всех типов контента

## 🔄 Как это работает

### Поток данных:

1. **Отправка файла:**
   ```
   Клиент → POST /api/images → Сохранение в image_messages → WebSocket broadcast
   ```

2. **Загрузка сообщений:**
   ```
   GET /api/messages/:chatId → messages (текст)
   GET /api/images/:chatId → image_messages (файлы) + реакции
   GET /api/message-reads/status/:chatId → статусы прочтения для всех
   → Объединение и сортировка
   ```

3. **Добавление реакции:**
   ```
   POST /api/reactions/:messageId
   → Проверка в messages
   → Если нет, проверка в image_messages
   → Добавление в message_reactions
   → WebSocket broadcast
   ```

4. **Отметка прочитанным:**
   ```
   POST /api/message-reads/mark-read
   → Поиск непрочитанных в messages
   → Поиск непрочитанных в image_messages
   → Отметка всех в message_reads
   → WebSocket broadcast
   ```

## 📊 Таблицы БД

```sql
-- Текстовые сообщения
messages (id, content, type, senderId, chatId, ...)

-- Файлы и медиа
image_messages (id, imageData, fileName, senderId, chatId, ...)

-- Реакции (для обоих типов)
message_reactions (id, messageId, userId, emoji, ...)

-- Прочтение (для обоих типов)
message_reads (id, messageId, userId, readAt, ...)
```

## 🧪 Тестирование

### Проверьте:

1. ✅ Отправьте изображение → поставьте реакцию
2. ✅ Отправьте файл → поставьте реакцию
3. ✅ Отправьте голосовое → поставьте реакцию
4. ✅ Откройте чат → файлы должны пометиться прочитанными
5. ✅ В групповом чате → счетчик прочитавших должен работать
6. ✅ Двойные галочки ✓✓ должны появляться

## 🚀 Запуск

```bash
# Перезапустите сервер
cd server
npm start

# Перезапустите клиент
cd client
npm run dev
```

## ✨ Готово!

Теперь реакции и прочтение работают для всех типов контента одинаково!
