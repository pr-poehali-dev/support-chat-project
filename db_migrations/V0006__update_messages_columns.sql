-- Переименовываем message_text в content в таблице messages
ALTER TABLE messages RENAME COLUMN message_text TO content;

-- Добавляем sender_id в messages
ALTER TABLE messages ADD COLUMN sender_id INTEGER;