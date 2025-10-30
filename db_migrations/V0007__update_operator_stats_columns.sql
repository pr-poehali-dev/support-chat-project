-- Обновляем таблицу operator_chat_stats - добавляем недостающие колонки
ALTER TABLE operator_chat_stats ADD COLUMN IF NOT EXISTS resolved INTEGER DEFAULT 0;
ALTER TABLE operator_chat_stats ADD COLUMN IF NOT EXISTS postponed INTEGER DEFAULT 0;
ALTER TABLE operator_chat_stats ADD COLUMN IF NOT EXISTS escalated INTEGER DEFAULT 0;