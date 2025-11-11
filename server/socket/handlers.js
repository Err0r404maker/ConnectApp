import { db } from '../database.js';
import { randomUUID } from 'crypto';

// Оптимизированное хранилище
const activeUsers = new Map();
const typingUsers = new Map();
const userChatsCache = new Map();
const membershipCache = new Map();

// Кэш для общего чата
let generalChatInitialized = false;
const GENERAL_CHAT_ID = 'general-chat';

// Инициализация общего чата (однократно)
const initializeGeneralChat = async () => {
  if (generalChatInitialized) return;
  
  try {
    const generalChat = await db.getAsync('SELECT id FROM chats WHERE id = ?', [GENERAL_CHAT_ID]);
    
    if (!generalChat) {
      await db.runAsync(
        'INSERT OR IGNORE INTO chats (id, name, type) VALUES (?, ?, ?)',
        [GENERAL_CHAT_ID, 'Общий чат', 'GROUP']
      );
      console.log('💬 Общий чат создан');
    }
    
    generalChatInitialized = true;
  } catch (error) {
    console.error('Ошибка инициализации общего чата:', error.message);
  }
};

// Функция проверки доступа с кэшированием
const checkChatAccess = async (userId, chatId) => {
  const key = `${userId}:${chatId}`;
  let hasAccess = membershipCache.get(key);
  
  if (hasAccess === undefined) {
    const membership = await db.getAsync(
      'SELECT 1 FROM chat_members WHERE userId = ? AND chatId = ? LIMIT 1',
      [userId, chatId]
    );
    hasAccess = !!membership;
    membershipCache.set(key, hasAccess);
    setTimeout(() => membershipCache.delete(key), 300000);
  }
  
  return hasAccess;
};

export const setupSocketHandlers = (io) => {
  io.on('connection', async (socket) => {
    try {
      const userId = socket.userId;
      console.log(`👤 Пользователь подключился: ${userId}`);

      // Добавляем пользователя в активные
      activeUsers.set(userId, {
        socketId: socket.id,
        userId,
        connectedAt: new Date().toISOString()
      });

      // Обновляем статус пользователя на онлайн
      await db.runAsync(
        'UPDATE users SET status = ?, lastSeen = ? WHERE id = ?',
        ['ONLINE', new Date().toISOString(), userId]
      );

      // Кэшируем чаты пользователя
      let userChats = userChatsCache.get(userId);
      if (!userChats) {
        userChats = await db.allAsync(`
          SELECT chatId FROM chat_members WHERE userId = ?
        `, [userId]);
        userChatsCache.set(userId, userChats);
        setTimeout(() => userChatsCache.delete(userId), 300000);
      }

      // Инициализируем общий чат (если еще не сделано)
      await initializeGeneralChat();
      
      // Добавляем пользователя в общий чат
      const memberId = `member-${userId}-${GENERAL_CHAT_ID}`;
      await db.runAsync(
        'INSERT OR IGNORE INTO chat_members (id, userId, chatId, role) VALUES (?, ?, ?, ?)',
        [memberId, userId, GENERAL_CHAT_ID, 'MEMBER']
      );
      
      // Присоединяемся к личной комнате (для уведомлений)
      socket.join(userId);
      
      // Присоединяемся к общему чату
      socket.join(GENERAL_CHAT_ID);
      
      // Присоединяемся ко всем остальным чатам
      for (const chat of userChats) {
        socket.join(chat.chatId);
      }

      // Уведомляем других пользователей о подключении
      socket.broadcast.emit('user:online', { userId });

      // Обработчик отправки сообщения
      socket.on('message:send', async (data) => {
        try {
          const { chatId, content, type = 'TEXT', replyToId, fileUrl, fileName, fileSize } = data;

          console.log('📨 WS message:send:', { userId, chatId, type, replyToId, hasContent: !!content });

          // Валидация
          if (!content || !chatId) {
            console.log('❌ WS validation failed');
            socket.emit('error', { message: 'Контент и ID чата обязательны' });
            return;
          }

          // Проверяем доступ к чату
          const membership = await db.getAsync(
            'SELECT id FROM chat_members WHERE userId = ? AND chatId = ? LIMIT 1',
            [userId, chatId]
          );

          if (!membership) {
            console.log('❌ WS no membership');
            socket.emit('error', { message: 'Нет доступа к чату' });
            return;
          }

          // Проверяем replyToId если есть
          if (replyToId) {
            console.log('🔍 WS checking replyToId:', replyToId);
            let replyMessage = await db.getAsync(
              'SELECT id FROM messages WHERE id = ? AND chatId = ? LIMIT 1',
              [replyToId, chatId]
            );
            
            if (!replyMessage) {
              replyMessage = await db.getAsync(
                'SELECT id FROM image_messages WHERE id = ? AND chatId = ? LIMIT 1',
                [replyToId, chatId]
              );
            }
            
            if (!replyMessage) {
              console.log('❌ WS reply message not found');
              socket.emit('error', { message: 'Сообщение для ответа не найдено' });
              return;
            }
            console.log('✅ WS reply message found');
          }

          // Создаем сообщение в БД
          const messageId = randomUUID();
          const now = new Date().toISOString();

          console.log('💾 WS inserting message:', messageId, 'replyToId:', replyToId || 'none');
          await db.runAsync(`
            INSERT INTO messages (id, content, type, fileUrl, fileName, fileSize, senderId, chatId, replyToId, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [messageId, content.trim(), type, fileUrl, fileName, fileSize, userId, chatId, replyToId || null, now, now]);
          console.log('✅ WS message inserted');

          // Обновляем время последнего обновления чата
          await db.runAsync(
            'UPDATE chats SET updatedAt = ? WHERE id = ?',
            [now, chatId]
          );

          // Оптимизированный запрос сообщения с аватаром и данными об ответе
          const message = await db.getAsync(`
            SELECT 
              m.id, m.content, m.type, m.fileUrl, m.fileName, m.fileSize, m.senderId, m.chatId, m.replyToId, m.createdAt,
              u.username, u.firstName, u.lastName, u.avatar as senderAvatar
            FROM messages m
            INNER JOIN users u ON m.senderId = u.id
            WHERE m.id = ?
          `, [messageId]);

          // Если есть replyToId, загружаем данные об исходном сообщении
          if (message.replyToId) {
            let replyTo = await db.getAsync(`
              SELECT m.id, m.content, m.type, m.fileName, m.fileUrl, u.firstName, u.lastName
              FROM messages m
              LEFT JOIN users u ON m.senderId = u.id
              WHERE m.id = ?
            `, [message.replyToId]);
            
            if (!replyTo) {
              replyTo = await db.getAsync(`
                SELECT id, fileName, imageData as fileUrl, senderName
                FROM image_messages
                WHERE id = ?
              `, [message.replyToId]);
              
              if (replyTo) {
                // Определяем тип файла
                const isImage = replyTo.fileUrl?.startsWith('data:image/');
                const isVoice = replyTo.fileUrl?.startsWith('data:audio/');
                replyTo.type = isVoice ? 'VOICE' : (isImage ? 'IMAGE' : 'FILE');
                replyTo.content = isVoice ? '🎤 Голосовое' : (isImage ? '🖼️ Фото' : replyTo.fileName);
                
                if (replyTo.senderName) {
                  const names = replyTo.senderName.split(' ');
                  replyTo.firstName = names[0] || '';
                  replyTo.lastName = names[1] || '';
                }
              }
            }
            
            message.replyTo = replyTo;
          }

          // Отправляем сообщение всем участникам чата
          console.log('📤 WS emitting message:new with replyTo:', message.replyTo ? 'yes' : 'no');
          io.to(chatId).emit('message:new', message);
          
          // Уведомляем об обновлении непрочитанных (всем кроме отправителя)
          socket.to(chatId).emit('unread:update', { chatId });

          // Останавливаем индикатор набора текста
          const typingKey = `${userId}:${chatId}`;
          if (typingUsers.has(typingKey)) {
            typingUsers.delete(typingKey);
            socket.to(chatId).emit('typing:stop', { userId, chatId });
          }

        } catch (error) {
          console.error('Ошибка отправки сообщения:', error.message);
          socket.emit('error', { message: 'Ошибка отправки сообщения' });
        }
      });

      // Обработчик редактирования сообщения
      socket.on('message:edit', async (data) => {
        try {
          const { messageId, content } = data;

          if (!content || !messageId) {
            socket.emit('error', { message: 'ID сообщения и контент обязательны' });
            return;
          }

          // Проверяем, что сообщение принадлежит пользователю
          const message = await db.getAsync(
            'SELECT id, senderId, chatId, content, isEdited FROM messages WHERE id = ? AND senderId = ? LIMIT 1',
            [messageId, userId]
          );

          if (!message) {
            socket.emit('error', { message: 'Сообщение не найдено или нет прав на редактирование' });
            return;
          }

          // Обновляем сообщение
          const now = new Date().toISOString();
          await db.runAsync(
            'UPDATE messages SET content = ?, isEdited = 1, editedAt = ?, originalContent = ?, updatedAt = ? WHERE id = ?',
            [content.trim(), now, message.isEdited ? undefined : message.content, now, messageId]
          );

          // Получаем обновленное сообщение
          const updatedMessage = await db.getAsync(`
            SELECT 
              m.id, m.content, m.type, m.fileUrl, m.fileName, m.fileSize,
              m.senderId, m.chatId, m.replyToId, m.createdAt, m.updatedAt,
              m.isEdited, m.editedAt,
              u.username, u.firstName, u.lastName, u.avatar as senderAvatar
            FROM messages m
            JOIN users u ON m.senderId = u.id
            WHERE m.id = ?
          `, [messageId]);

          // Отправляем обновленное сообщение всем участникам чата
          io.to(message.chatId).emit('message:edited', updatedMessage);

        } catch (error) {
          console.error('Ошибка редактирования сообщения:', error.message);
          socket.emit('error', { message: 'Ошибка редактирования сообщения' });
        }
      });

      // Обработчик удаления сообщения
      socket.on('message:delete', async (data) => {
        try {
          const { messageId } = data;

          // Проверяем, что сообщение принадлежит пользователю
          const message = await db.getAsync(
            'SELECT id, senderId, chatId FROM messages WHERE id = ? AND senderId = ? LIMIT 1',
            [messageId, userId]
          );

          if (!message) {
            socket.emit('error', { message: 'Сообщение не найдено или нет прав на удаление' });
            return;
          }

          // Удаляем сообщение
          await db.runAsync('DELETE FROM messages WHERE id = ?', [messageId]);

          // Уведомляем всех участников чата
          io.to(message.chatId).emit('message:deleted', { messageId, chatId: message.chatId });
          
          // Обновляем счетчик непрочитанных
          io.to(message.chatId).emit('unread:update', { chatId: message.chatId });

        } catch (error) {
          console.error('Ошибка удаления сообщения:', error.message);
          socket.emit('error', { message: 'Ошибка удаления сообщения' });
        }
      });

      // Обработчик набора текста
      socket.on('typing:start', async (data) => {
        try {
          const { chatId } = data;
          
          if (!chatId) return;

          // Проверяем доступ к чату
          const membership = await db.getAsync(
            'SELECT id FROM chat_members WHERE userId = ? AND chatId = ? LIMIT 1',
            [userId, chatId]
          );

          if (!membership) return;

          const typingKey = `${userId}:${chatId}`;
          typingUsers.set(typingKey, {
            userId,
            chatId,
            startedAt: Date.now()
          });

          // Отправляем только ID пользователя
          socket.to(chatId).emit('typing:start', { userId, chatId });

          // Автоматически останавливаем через 10 секунд
          setTimeout(() => {
            if (typingUsers.has(typingKey)) {
              typingUsers.delete(typingKey);
              socket.to(chatId).emit('typing:stop', { userId, chatId });
            }
          }, 10000);

        } catch (error) {
          console.error('Ошибка обработки набора текста:', error.message);
        }
      });

      socket.on('typing:stop', (data) => {
        try {
          const { chatId } = data;
          if (!chatId) return;

          const typingKey = `${userId}:${chatId}`;
          if (typingUsers.has(typingKey)) {
            typingUsers.delete(typingKey);
            socket.to(chatId).emit('typing:stop', { userId, chatId });
          }
        } catch (error) {
          console.error('Ошибка остановки набора текста:', error.message);
        }
      });

      // Присоединение к чату
      socket.on('chat:join', async (chatId) => {
        try {
          // Проверяем доступ к чату
          const membership = await db.getAsync(
            'SELECT id FROM chat_members WHERE userId = ? AND chatId = ? LIMIT 1',
            [userId, chatId]
          );

          if (membership) {
            socket.join(chatId);
            socket.emit('chat:joined', { chatId });
          } else {
            socket.emit('error', { message: 'Нет доступа к чату' });
          }
        } catch (error) {
          console.error('Ошибка присоединения к чату:', error.message);
          socket.emit('error', { message: 'Ошибка присоединения к чату' });
        }
      });

      // Покидание чата
      socket.on('chat:leave', (chatId) => {
        socket.leave(chatId);
        socket.emit('chat:left', { chatId });
      });

      // Отметка сообщений как прочитанных
      socket.on('messages:mark_read', async (data) => {
        try {
          const { messageIds, chatId } = data;

          if (!Array.isArray(messageIds) || !chatId) {
            socket.emit('error', { message: 'Неверные данные для отметки прочтения' });
            return;
          }

          // Проверяем доступ к чату
          const membership = await db.getAsync(
            'SELECT id FROM chat_members WHERE userId = ? AND chatId = ? LIMIT 1',
            [userId, chatId]
          );

          if (!membership) {
            socket.emit('error', { message: 'Нет доступа к чату' });
            return;
          }

          // Создаем отметки о прочтении
          for (const messageId of messageIds) {
            const receiptId = randomUUID();
            await db.runAsync(`
              INSERT OR IGNORE INTO message_reads (id, userId, messageId, readAt)
              VALUES (?, ?, ?, ?)
            `, [receiptId, userId, messageId, new Date().toISOString()]);
          }

          // Уведомляем других участников чата
          io.to(chatId).emit('messages:read', {
            userId,
            messageIds,
            chatId,
            readAt: new Date().toISOString()
          });

        } catch (error) {
          console.error('Ошибка отметки прочтения:', error.message);
          socket.emit('error', { message: 'Ошибка отметки прочтения' });
        }
      });

      // Обработчик реакций
      socket.on('reaction:toggle', async (data) => {
        try {
          const { messageId, emoji } = data;

          if (!messageId || !emoji) {
            socket.emit('error', { message: 'ID сообщения и emoji обязательны' });
            return;
          }

          // Проверяем существует ли реакция
          const existing = await db.getAsync(
            'SELECT id FROM message_reactions WHERE messageId = ? AND userId = ? AND emoji = ?',
            [messageId, userId, emoji]
          );

          const message = await db.getAsync('SELECT chatId FROM messages WHERE id = ?', [messageId]);
          if (!message) {
            socket.emit('error', { message: 'Сообщение не найдено' });
            return;
          }

          if (existing) {
            // Удаляем реакцию
            await db.runAsync('DELETE FROM message_reactions WHERE id = ?', [existing.id]);
          } else {
            // Добавляем реакцию
            await db.runAsync(
              'INSERT INTO message_reactions (id, messageId, userId, emoji, createdAt) VALUES (?, ?, ?, ?, ?)',
              [randomUUID(), messageId, userId, emoji, new Date().toISOString()]
            );
          }

          // Получаем обновленные реакции
          const reactions = await db.allAsync(
            'SELECT emoji, COUNT(*) as count FROM message_reactions WHERE messageId = ? GROUP BY emoji',
            [messageId]
          );

          // Отправляем всем в чате
          io.to(message.chatId).emit('reaction:updated', { messageId, reactions });

        } catch (error) {
          console.error('Ошибка реакции:', error.message);
          socket.emit('error', { message: 'Ошибка реакции' });
        }
      });

      // Обработчик закрепления
      socket.on('message:pin', async (data) => {
        try {
          const { messageId } = data;
          
          const message = await db.getAsync('SELECT * FROM messages WHERE id = ?', [messageId]);
          if (!message) {
            socket.emit('error', { message: 'Сообщение не найдено' });
            return;
          }

          const membership = await db.getAsync(
            'SELECT role FROM chat_members WHERE userId = ? AND chatId = ?',
            [userId, message.chatId]
          );

          if (!membership || !['ADMIN', 'MODERATOR'].includes(membership.role)) {
            socket.emit('error', { message: 'Нет прав для закрепления' });
            return;
          }

          const isPinned = message.isPinned ? 0 : 1;
          const now = new Date().toISOString();

          await db.runAsync(
            'UPDATE messages SET isPinned = ?, pinnedAt = ?, pinnedBy = ? WHERE id = ?',
            [isPinned, isPinned ? now : null, isPinned ? userId : null, messageId]
          );

          io.to(message.chatId).emit('message:pinned', { messageId, isPinned: !!isPinned, pinnedBy: userId });
          socket.emit('success', { message: isPinned ? 'Сообщение закреплено' : 'Сообщение откреплено' });
        } catch (error) {
          console.error('Ошибка закрепления:', error.message);
          socket.emit('error', { message: 'Ошибка закрепления' });
        }
      });

      // Обработчик пересылки
      socket.on('message:forward', async (data) => {
        try {
          const { messageId, targetChatIds } = data;

          if (!messageId || !Array.isArray(targetChatIds) || targetChatIds.length === 0) {
            socket.emit('error', { message: 'Неверные данные' });
            return;
          }

          const message = await db.getAsync('SELECT * FROM messages WHERE id = ?', [messageId]);
          if (!message) {
            socket.emit('error', { message: 'Сообщение не найдено' });
            return;
          }

          const forwarded = [];
          for (const chatId of targetChatIds) {
            const membership = await db.getAsync(
              'SELECT id FROM chat_members WHERE userId = ? AND chatId = ?',
              [userId, chatId]
            );

            if (!membership) continue;

            const newId = randomUUID();
            const now = new Date().toISOString();

            await db.runAsync(
              'INSERT INTO messages (id, content, type, fileUrl, fileName, fileSize, senderId, chatId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [`↪️ ${message.content}`, message.type, message.fileUrl, message.fileName, message.fileSize, userId, chatId, now, now]
            );

            const newMessage = await db.getAsync(`
              SELECT m.*, u.username, u.firstName, u.lastName, u.avatar as senderAvatar
              FROM messages m
              JOIN users u ON m.senderId = u.id
              WHERE m.id = ?
            `, [newId]);

            io.to(chatId).emit('message:new', newMessage);
            forwarded.push({ chatId, messageId: newId });
          }

          socket.emit('success', { message: `Переслано в ${forwarded.length} чатов` });
        } catch (error) {
          console.error('Ошибка пересылки:', error.message);
          socket.emit('error', { message: 'Ошибка пересылки' });
        }
      });

      // Обработчик запроса на вступление в группу
      socket.on('group:join_request', async (data) => {
        try {
          const { chatId, requestId } = data;
          
          // Получаем админов группы
          const admins = await db.allAsync(
            'SELECT userId FROM chat_members WHERE chatId = ? AND role = "ADMIN"',
            [chatId]
          );
          
          // Отправляем уведомление каждому админу
          for (const admin of admins) {
            io.to(admin.userId).emit('group:new_request', { chatId, requestId });
          }
        } catch (error) {
          console.error('Ошибка уведомления о запросе:', error.message);
        }
      });

      // Обработчик обновления профиля
      socket.on('profile:updated', async (data) => {
        try {
          const { userId, avatar, firstName, lastName } = data;
          console.log('Профиль обновлен:', userId);
          
          // Уведомляем всех в общих чатах
          const userChats = await db.allAsync(
            'SELECT DISTINCT chatId FROM chat_members WHERE userId = ?',
            [userId]
          );
          
          for (const chat of userChats) {
            io.to(chat.chatId).emit('user:profile_updated', { userId, avatar, firstName, lastName });
          }
        } catch (error) {
          console.error('Ошибка обновления профиля:', error.message);
        }
      });

      // Обработчик изменения статуса
      socket.on('status:change', async (data) => {
        try {
          const { status } = data;
          
          if (!['ONLINE', 'AWAY', 'BUSY'].includes(status)) {
            socket.emit('error', { message: 'Неверный статус' });
            return;
          }

          await db.runAsync(
            'UPDATE users SET status = ?, lastSeen = ? WHERE id = ?',
            [status, new Date().toISOString(), userId]
          );

          // Уведомляем всех о изменении статуса
          socket.broadcast.emit('user:status_changed', { userId, status });

        } catch (error) {
          console.error('Ошибка изменения статуса:', error.message);
          socket.emit('error', { message: 'Ошибка изменения статуса' });
        }
      });

      // Обработчик отключения
      socket.on('disconnect', async () => {
        try {
          console.log(`👋 Пользователь отключился: ${userId}`);

          // Удаляем из активных пользователей
          activeUsers.delete(userId);

          // Очищаем индикаторы набора текста
          for (const [key, typing] of typingUsers.entries()) {
            if (typing.userId === userId) {
              typingUsers.delete(key);
              socket.to(typing.chatId).emit('typing:stop', { 
                userId, 
                chatId: typing.chatId 
              });
            }
          }

          // Обновляем статус на оффлайн
          await db.runAsync(
            'UPDATE users SET status = ?, lastSeen = ? WHERE id = ?',
            ['OFFLINE', new Date().toISOString(), userId]
          );

          // Уведомляем других пользователей об отключении
          socket.broadcast.emit('user:offline', { userId });

        } catch (error) {
          console.error('Ошибка при отключении:', error.message);
        }
      });

    } catch (error) {
      console.error('Ошибка подключения пользователя:', error.message);
      socket.emit('error', { message: 'Ошибка подключения' });
      socket.disconnect();
    }
  });

  // Оптимизированная очистка
  setInterval(() => {
    const now = Date.now();
    
    // Очищаем старые индикаторы набора
    for (const [key, typing] of typingUsers.entries()) {
      if (now - typing.startedAt > 10000) {
        typingUsers.delete(key);
        io.to(typing.chatId).emit('typing:stop', { 
          userId: typing.userId, 
          chatId: typing.chatId 
        });
      }
    }
    
    // Очищаем кэши каждые 10 минут (детерминированно)
    const currentTime = Date.now();
    if (currentTime % 600000 < 10000) { // Каждые 10 минут
      userChatsCache.clear();
      membershipCache.clear();
      console.log('🧹 Кэши очищены');
    }
  }, 10000);
};