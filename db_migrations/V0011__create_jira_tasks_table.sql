-- Создание таблицы для задач Jira
CREATE TABLE IF NOT EXISTS t_p77168343_support_chat_project.jira_tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('new', 'in_progress', 'done', 'cancelled')) DEFAULT 'new',
    created_by INTEGER REFERENCES t_p77168343_support_chat_project.staff(id),
    assigned_to INTEGER REFERENCES t_p77168343_support_chat_project.staff(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    resolution_comment TEXT
);