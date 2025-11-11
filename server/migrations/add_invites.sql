CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  chatId TEXT NOT NULL,
  createdBy TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  usedCount INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_invites_code ON invites(code);
CREATE INDEX idx_invites_chatId ON invites(chatId);
