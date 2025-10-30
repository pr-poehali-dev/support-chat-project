-- Добавление колонки qc_status для отслеживания статуса обработки QC
ALTER TABLE t_p77168343_support_chat_project.chats 
ADD COLUMN IF NOT EXISTS qc_status TEXT CHECK (qc_status IN ('qc', 'processing_qc', 'closed')) DEFAULT 'qc';