-- Таблица для сохраненных аудио файлов
CREATE TABLE IF NOT EXISTS saved_audio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  messageId TEXT NOT NULL,
  savedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE,
  UNIQUE(userId, messageId)
);

CREATE INDEX IF NOT EXISTS idx_saved_audio_user ON saved_audio(userId);
CREATE INDEX IF NOT EXISTS idx_saved_audio_message ON saved_audio(messageId);
