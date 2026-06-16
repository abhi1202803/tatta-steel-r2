-- Supabase PostgreSQL schema (run in Supabase SQL Editor)
-- TimescaleDB is not required; standard PostgreSQL indexes are used for time-series data.

CREATE TABLE IF NOT EXISTS equipment (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    install_date TIMESTAMPTZ,
    age_days INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    equipment_id VARCHAR(50) REFERENCES equipment(id) ON DELETE CASCADE,
    temperature DOUBLE PRECISION,
    vibration DOUBLE PRECISION,
    pressure DOUBLE PRECISION,
    current DOUBLE PRECISION,
    rpm DOUBLE PRECISION,
    flow_rate DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_time ON sensor_readings (time DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_equipment_time ON sensor_readings (equipment_id, time DESC);

CREATE TABLE IF NOT EXISTS maintenance_events (
    id SERIAL PRIMARY KEY,
    equipment_id VARCHAR(50) REFERENCES equipment(id) ON DELETE CASCADE,
    event_type VARCHAR(100),
    description TEXT,
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    cost DOUBLE PRECISION,
    downtime_hours DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS failure_predictions (
    id SERIAL PRIMARY KEY,
    equipment_id VARCHAR(50) REFERENCES equipment(id) ON DELETE CASCADE,
    failure_type VARCHAR(100),
    confidence DOUBLE PRECISION,
    anomaly_score DOUBLE PRECISION,
    risk_level VARCHAR(50),
    rul_hours DOUBLE PRECISION,
    root_cause TEXT,
    predicted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(50) PRIMARY KEY,
    equipment_id VARCHAR(50) REFERENCES equipment(id) ON DELETE CASCADE,
    severity VARCHAR(50),
    message TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spare_inventory (
    id SERIAL PRIMARY KEY,
    part_name VARCHAR(200),
    category VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 5,
    unit_cost DOUBLE PRECISION,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (optional – enable per table in Supabase dashboard)
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on equipment"
    ON equipment FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

INSERT INTO equipment (id, name, type, location, age_days) VALUES
    ('PUMP-05', 'Centrifugal Pump 05', 'Pump', 'Steel Plant - Rolling Mill', 1200),
    ('MOTOR-12', 'Conveyor Motor 12', 'Motor', 'Steel Plant - Conveyor Line', 800),
    ('GBOX-03', 'Gearbox 03', 'Gearbox', 'Steel Plant - Hot Strip Mill', 1500),
    ('COMP-07', 'Air Compressor 07', 'Compressor', 'Steel Plant - Utilities', 600),
    ('FAN-02', 'Cooling Fan 02', 'Fan', 'Steel Plant - Blast Furnace', 400)
ON CONFLICT (id) DO NOTHING;
