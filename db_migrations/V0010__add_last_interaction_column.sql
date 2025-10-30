-- Добавление колонки last_interaction в таблицу clients
ALTER TABLE t_p77168343_support_chat_project.clients 
ADD COLUMN IF NOT EXISTS last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP;