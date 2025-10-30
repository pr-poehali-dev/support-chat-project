-- Исправление таблицы clients: добавление ограничений
-- Сначала обновим существующие NULL значения  
UPDATE t_p77168343_support_chat_project.clients 
SET phone = 'unknown_' || id::text 
WHERE phone IS NULL;

UPDATE t_p77168343_support_chat_project.clients 
SET name = 'Клиент' 
WHERE name IS NULL;

UPDATE t_p77168343_support_chat_project.clients 
SET session_id = 'legacy_' || id::text 
WHERE session_id IS NULL;

-- Добавляем NOT NULL ограничения
ALTER TABLE t_p77168343_support_chat_project.clients 
ALTER COLUMN phone SET NOT NULL;

ALTER TABLE t_p77168343_support_chat_project.clients 
ALTER COLUMN name SET NOT NULL;

ALTER TABLE t_p77168343_support_chat_project.clients 
ALTER COLUMN session_id SET NOT NULL;

-- Добавляем уникальный индекс на phone
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_phone_unique 
ON t_p77168343_support_chat_project.clients(phone);