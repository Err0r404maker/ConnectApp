-- Добавляем поля для редактирования сообщений
ALTER TABLE messages ADD COLUMN isEdited BOOLEAN DEFAULT 0;
ALTER TABLE messages ADD COLUMN editedAt DATETIME;
ALTER TABLE messages ADD COLUMN originalContent TEXT;
