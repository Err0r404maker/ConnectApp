-- Добавляем поле username для чатов
ALTER TABLE chats ADD COLUMN username TEXT UNIQUE;
ALTER TABLE chats ADD COLUMN isPrivate INTEGER DEFAULT 0;

-- Генерируем username для существующих групп
UPDATE chats SET username = LOWER(REPLACE(name, ' ', '_')) || '_' || SUBSTR(id, 1, 8) WHERE type = 'GROUP' AND username IS NULL;
