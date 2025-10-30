CREATE TABLE IF NOT EXISTS time_tracking (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_minutes INTEGER,
    CONSTRAINT valid_status CHECK (status IN ('online', 'jira', 'break', 'offline'))
);

CREATE INDEX IF NOT EXISTS idx_time_tracking_staff ON time_tracking(staff_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_date ON time_tracking(date);
CREATE INDEX IF NOT EXISTS idx_time_tracking_status ON time_tracking(status);