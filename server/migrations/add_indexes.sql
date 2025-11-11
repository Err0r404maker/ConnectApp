-- Индексы для оптимизации запросов

-- Сообщения
CREATE INDEX IF NOT EXISTS idx_messages_chatId_createdAt ON messages(chatId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_messages_senderId ON messages(senderId);
CREATE INDEX IF NOT EXISTS idx_messages_replyToId ON messages(replyToId);

-- Участники чатов
CREATE INDEX IF NOT EXISTS idx_chat_members_userId ON chat_members(userId);
CREATE INDEX IF NOT EXISTS idx_chat_members_chatId_userId ON chat_members(chatId, userId);

-- Чаты
CREATE INDEX IF NOT EXISTS idx_chats_updatedAt ON chats(updatedAt DESC);

-- Прочтения
CREATE INDEX IF NOT EXISTS idx_message_reads_messageId ON message_reads(messageId);
CREATE INDEX IF NOT EXISTS idx_message_reads_userId ON message_reads(userId);

-- Реакции (уже есть, но проверим)
CREATE INDEX IF NOT EXISTS idx_message_reactions_messageId ON message_reactions(messageId);
CREATE INDEX IF NOT EXISTS idx_message_reactions_userId ON message_reactions(userId);

-- Пользователи
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
