-- Удаляем лишний индекс на phone (оставляем только session_id как уникальный)
DROP INDEX IF EXISTS t_p77168343_support_chat_project.idx_clients_phone_unique;