CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    role TEXT DEFAULT 'STUDENT',
    status TEXT DEFAULT 'OFFLINE',
    lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT DEFAULT 'DIRECT',
    avatar TEXT,
    description TEXT,
    ownerId TEXT,
    isPrivate BOOLEAN DEFAULT 0,
    allowMedia BOOLEAN DEFAULT 1,
    allowFiles BOOLEAN DEFAULT 1,
    allowVoice BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_members (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    chatId TEXT NOT NULL,
    role TEXT DEFAULT 'MEMBER',
    lastReadMessageId TEXT,
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, chatId)
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'TEXT',
    fileUrl TEXT,
    fileName TEXT,
    fileSize INTEGER,
    senderId TEXT NOT NULL,
    chatId TEXT NOT NULL,
    replyToId TEXT,
    isEdited BOOLEAN DEFAULT 0,
    editedAt DATETIME,
    originalContent TEXT,
    isPinned BOOLEAN DEFAULT 0,
    pinnedAt DATETIME,
    pinnedBy TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_replyToId ON messages(replyToId);

CREATE TABLE IF NOT EXISTS image_messages (
    id TEXT PRIMARY KEY,
    chatId TEXT NOT NULL,
    senderId TEXT NOT NULL,
    senderName TEXT,
    imageData TEXT NOT NULL,
    fileName TEXT,
    replyToId TEXT,
    isPinned BOOLEAN DEFAULT 0,
    pinnedAt DATETIME,
    pinnedBy TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS message_reactions (
    id TEXT PRIMARY KEY,
    messageId TEXT NOT NULL,
    userId TEXT NOT NULL,
    emoji TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(messageId, userId, emoji)
);

CREATE TABLE IF NOT EXISTS chat_invites (
    id TEXT PRIMARY KEY,
    chatId TEXT NOT NULL,
    fromUserId TEXT NOT NULL,
    toUserId TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friends (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    friendId TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, friendId)
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chatId, createdAt);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON chat_members(userId);
CREATE INDEX IF NOT EXISTS idx_chat_members_chat ON chat_members(chatId);
CREATE INDEX IF NOT EXISTS idx_image_messages_chat ON image_messages(chatId, createdAt);
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_chatId ON invites(chatId);
CREATE INDEX IF NOT EXISTS idx_message_reactions_messageId ON message_reactions(messageId);
CREATE INDEX IF NOT EXISTS idx_chat_invites_toUserId ON chat_invites(toUserId);
CREATE INDEX IF NOT EXISTS idx_friends_userId ON friends(userId);
CREATE TABLE IF NOT EXISTS message_reads (
    id TEXT PRIMARY KEY,
    messageId TEXT NOT NULL,
    userId TEXT NOT NULL,
    readAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(messageId, userId)
);

CREATE INDEX IF NOT EXISTS idx_friends_friendId ON friends(friendId);
CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(messageId);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(userId);