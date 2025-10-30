CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    login VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('operator', 'okk', 'superadmin')),
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    operator_id INTEGER REFERENCES staff(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('client', 'operator')),
    sender_name VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO staff (login, password, name, role, permissions) VALUES 
('123', '803254', 'Супер Админ', 'superadmin', '{"chats": {"active": true, "closed": true}, "staff": {"manage": true}, "settings": {"full": true}}'::jsonb),
('operator', 'op123', 'Оператор КЦ', 'operator', '{"chats": {"active": true, "closed": false}}'::jsonb),
('okk', 'okk123', 'ОКК', 'okk', '{"chats": {"active": true, "closed": true}}'::jsonb)
ON CONFLICT (login) DO NOTHING;