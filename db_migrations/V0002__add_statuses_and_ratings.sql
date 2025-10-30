ALTER TABLE staff ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'jira', 'break', 'offline'));
ALTER TABLE staff ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS chat_ratings (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    operator_id INTEGER REFERENCES staff(id),
    rated_by INTEGER REFERENCES staff(id),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_ratings_operator ON chat_ratings(operator_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_chats_operator ON chats(operator_id);
CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status);