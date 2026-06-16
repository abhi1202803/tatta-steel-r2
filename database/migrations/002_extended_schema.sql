-- Extended schema for logbook, feedback, ingest, knowledge, reports, admin, audit

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS criticality VARCHAR(50) DEFAULT 'medium';
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100);

-- Backfill defaults for existing rows
UPDATE equipment SET criticality = 'medium' WHERE criticality IS NULL;
UPDATE equipment SET status = 'active' WHERE status IS NULL;

CREATE TABLE IF NOT EXISTS logbook_entries (
    id VARCHAR(50) PRIMARY KEY,
    equipment_id VARCHAR(50) REFERENCES equipment(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    diagnosis TEXT,
    recommendation TEXT,
    root_cause TEXT,
    action_taken TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback_entries (
    id VARCHAR(50) PRIMARY KEY,
    equipment_id VARCHAR(50) REFERENCES equipment(id) ON DELETE CASCADE,
    recommendation_correct BOOLEAN NOT NULL,
    actual_root_cause TEXT,
    repair_outcome TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingest_history (
    id VARCHAR(50) PRIMARY KEY,
    input_type VARCHAR(100) NOT NULL,
    equipment_id VARCHAR(50),
    payload_summary TEXT,
    routing JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
    id VARCHAR(50) PRIMARY KEY,
    filename VARCHAR(500) NOT NULL,
    doc_type VARCHAR(100) DEFAULT 'manual',
    equipment_id VARCHAR(50),
    size_bytes INTEGER DEFAULT 0,
    indexed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(50) PRIMARY KEY,
    equipment_id VARCHAR(50) REFERENCES equipment(id) ON DELETE CASCADE,
    report_type VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(200) NOT NULL,
    name VARCHAR(200) NOT NULL,
    role_id VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    action VARCHAR(200) NOT NULL,
    "user" VARCHAR(200) NOT NULL,
    resource VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_history (
    id VARCHAR(50) PRIMARY KEY,
    alert_id VARCHAR(50) REFERENCES alerts(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    "user" VARCHAR(200) NOT NULL,
    assignee VARCHAR(200),
    notes TEXT,
    work_order_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_logbook_equipment ON logbook_entries (equipment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_equipment ON feedback_entries (equipment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingest_created ON ingest_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_equipment ON reports (equipment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);
