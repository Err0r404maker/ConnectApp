-- Таблица реакций на сообщения
CREATE TABLE IF NOT EXISTS message_reactions (
  id TEXT PRIMARY KEY,
  messageId TEXT NOT NULL,
  userId TEXT NOT NULL,
  emoji TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(messageId, userId, emoji)
);

-- Добавляем поле isPinned к сообщениям
ALTER TABLE messages ADD COLUMN isPinned BOOLEAN DEFAULT 0;
ALTER TABLE messages ADD COLUMN pinnedAt DATETIME;
ALTER TABLE messages ADD COLUMN pinnedBy TEXT;

CREATE INDEX IF NOT EXISTS idx_message_reactions_messageId ON message_reactions(messageId);
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON messages(chatId, isPinned) WHERE isPinned = 1;
