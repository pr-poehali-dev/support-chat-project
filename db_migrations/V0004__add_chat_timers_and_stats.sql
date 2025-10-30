-- Обновляем таблицу чатов для таймеров и резолюций
ALTER TABLE chats ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT NOW();
ALTER TABLE chats ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS handling_time INTEGER;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS resolution_comment TEXT;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS timer_expires_at TIMESTAMP;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS timer_extended INTEGER DEFAULT 0;

-- Таблица статистики операторов по чатам
CREATE TABLE IF NOT EXISTS operator_chat_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id INTEGER NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_chats INTEGER DEFAULT 0,
    avg_handling_time INTEGER DEFAULT 0,
    resolved_chats INTEGER DEFAULT 0,
    postponed_chats INTEGER DEFAULT 0,
    transferred_chats INTEGER DEFAULT 0,
    total_handling_time INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(operator_id, date)
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_chats_client_id ON chats(client_id);
CREATE INDEX IF NOT EXISTS idx_chats_session_id ON chats(session_id);
CREATE INDEX IF NOT EXISTS idx_chats_timer_expires ON chats(timer_expires_at);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_operator_stats_date ON operator_chat_stats(operator_id, date);
CREATE INDEX IF NOT EXISTS idx_clients_session_id ON clients(session_id);