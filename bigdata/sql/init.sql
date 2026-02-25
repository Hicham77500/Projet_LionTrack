-- ============================================================================
-- INIT BD ANALYTIQUE - LionTrack Data Warehouse
-- ============================================================================

-- ========== CREATE SCHEMAS ==========
CREATE SCHEMA IF NOT EXISTS bronze;
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;
CREATE SCHEMA IF NOT EXISTS metadata;
CREATE SCHEMA IF NOT EXISTS analytics;

-- ========== BRONZE LAYER (Raw Data) ==========
CREATE TABLE IF NOT EXISTS bronze.lions_raw (
    id SERIAL PRIMARY KEY,
    lion_id VARCHAR(100),
    name VARCHAR(255),
    position_lat FLOAT,
    position_lng FLOAT,
    last_update TIMESTAMP,
    metadata JSONB,
    ingestion_timestamp TIMESTAMP DEFAULT NOW(),
    source_system VARCHAR(50),
    partition_date DATE
);

CREATE TABLE IF NOT EXISTS bronze.users_raw (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    username VARCHAR(255),
    email VARCHAR(255),
    metadata JSONB,
    ingestion_timestamp TIMESTAMP DEFAULT NOW(),
    source_system VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS bronze.challenges_raw (
    id SERIAL PRIMARY KEY,
    challenge_id VARCHAR(100),
    user_id VARCHAR(100),
    title VARCHAR(255),
    status VARCHAR(50),
    metadata JSONB,
    ingestion_timestamp TIMESTAMP DEFAULT NOW(),
    source_system VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS bronze.weights_raw (
    id SERIAL PRIMARY KEY,
    weight_id VARCHAR(100),
    lion_id VARCHAR(100),
    weight FLOAT,
    unit VARCHAR(10),
    measured_at TIMESTAMP,
    ingestion_timestamp TIMESTAMP DEFAULT NOW(),
    source_system VARCHAR(50)
);

-- ========== SILVER LAYER (Cleansed Data) ==========
CREATE TABLE IF NOT EXISTS silver.lions (
    lion_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position_lat FLOAT NOT NULL,
    position_lng FLOAT NOT NULL,
    last_update TIMESTAMP,
    status VARCHAR(50),
    data_quality_score FLOAT,
    updated_at TIMESTAMP DEFAULT NOW(),
    dw_insert_date TIMESTAMP DEFAULT NOW(),
    dw_update_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.users (
    user_id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    roles TEXT[],
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    dw_insert_date TIMESTAMP DEFAULT NOW(),
    dw_update_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.challenges (
    challenge_id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES silver.users(user_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    dw_insert_date TIMESTAMP DEFAULT NOW(),
    dw_update_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.weight_history (
    weight_id VARCHAR(100) PRIMARY KEY,
    lion_id VARCHAR(100) NOT NULL REFERENCES silver.lions(lion_id),
    weight FLOAT NOT NULL,
    unit VARCHAR(10),
    measured_at TIMESTAMP NOT NULL,
    dw_insert_date TIMESTAMP DEFAULT NOW(),
    dw_update_date TIMESTAMP DEFAULT NOW()
);

-- ========== GOLD LAYER (Business Metrics) ==========
CREATE TABLE IF NOT EXISTS gold.lions_metrics (
    lion_id VARCHAR(100),
    metric_date DATE,
    avg_weight FLOAT,
    weight_trend VARCHAR(20),
    tracking_frequency INT,
    health_score FLOAT,
    status VARCHAR(50),
    dw_insert_date TIMESTAMP DEFAULT NOW(),
    dw_update_date TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (lion_id, metric_date)
);

CREATE TABLE IF NOT EXISTS gold.users_activity (
    user_id VARCHAR(100),
    activity_date DATE,
    challenges_completed INT,
    challenges_in_progress INT,
    total_weight_entries INT,
    engagement_score FLOAT,
    dw_insert_date TIMESTAMP DEFAULT NOW(),
    dw_update_date TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, activity_date)
);

CREATE TABLE IF NOT EXISTS gold.lions_positions_history (
    lion_id VARCHAR(100),
    position_date TIMESTAMP,
    lat FLOAT,
    lng FLOAT,
    accuracy FLOAT,
    dw_insert_date TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (lion_id, position_date)
);

-- ========== DATA QUALITY & LINEAGE ==========
CREATE TABLE IF NOT EXISTS metadata.data_quality_checks (
    id SERIAL PRIMARY KEY,
    check_name VARCHAR(255),
    table_name VARCHAR(100),
    check_timestamp TIMESTAMP DEFAULT NOW(),
    total_records INT,
    valid_records INT,
    invalid_records INT,
    quality_percentage FLOAT,
    details JSONB
);

CREATE TABLE IF NOT EXISTS metadata.data_lineage (
    id SERIAL PRIMARY KEY,
    source_system VARCHAR(100),
    source_table VARCHAR(100),
    target_table VARCHAR(100),
    transformation_type VARCHAR(50),
    last_run_timestamp TIMESTAMP,
    record_count INT,
    execution_time_ms INT,
    status VARCHAR(50),
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS metadata.pipeline_logs (
    id SERIAL PRIMARY KEY,
    pipeline_name VARCHAR(255),
    pipeline_run_id VARCHAR(100),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50),
    processed_records INT,
    error_count INT,
    logs JSONB
);

-- ========== INDEXES ==========
CREATE INDEX IF NOT EXISTS idx_lions_raw_partition_date ON bronze.lions_raw(partition_date);
CREATE INDEX IF NOT EXISTS idx_lions_raw_lion_id ON bronze.lions_raw(lion_id);
CREATE INDEX IF NOT EXISTS idx_weights_raw_lion_id ON bronze.weights_raw(lion_id);
CREATE INDEX IF NOT EXISTS idx_challenges_raw_user_id ON bronze.challenges_raw(user_id);

CREATE INDEX IF NOT EXISTS idx_lions_silver_name ON silver.lions(name);
CREATE INDEX IF NOT EXISTS idx_users_silver_email ON silver.users(email);
CREATE INDEX IF NOT EXISTS idx_weight_history_lion_id ON silver.weight_history(lion_id, measured_at);

CREATE INDEX IF NOT EXISTS idx_lions_metrics_date ON gold.lions_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_users_activity_date ON gold.users_activity(activity_date);

-- ========== MATERIALIZED VIEWS (for fast analytics) ==========
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.lions_current_status AS
SELECT 
    l.lion_id,
    l.name,
    l.position_lat,
    l.position_lng,
    COALESCE(w.weight, 0) as current_weight,
    w.measured_at as last_weight_update,
    l.status,
    l.data_quality_score
FROM silver.lions l
LEFT JOIN (
    SELECT lion_id, weight, measured_at,
    ROW_NUMBER() OVER (PARTITION BY lion_id ORDER BY measured_at DESC) as rn
    FROM silver.weight_history
) w ON l.lion_id = w.lion_id AND w.rn = 1;

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.user_engagement_summary AS
SELECT 
    u.user_id,
    u.username,
    COUNT(DISTINCT c.challenge_id) as total_challenges,
    COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as completed_challenges,
    COUNT(CASE WHEN c.status = 'in_progress' THEN 1 END) as active_challenges,
    COUNT(DISTINCT ch.weight_id) as weight_entries,
    MAX(ch.measured_at) as last_activity
FROM silver.users u
LEFT JOIN silver.challenges c ON u.user_id = c.user_id
LEFT JOIN silver.weight_history ch ON u.user_id = ch.lion_id
GROUP BY u.user_id, u.username;

-- ========== GRANT PERMISSIONS ==========
GRANT USAGE ON SCHEMA bronze TO PUBLIC;
GRANT USAGE ON SCHEMA silver TO PUBLIC;
GRANT USAGE ON SCHEMA gold TO PUBLIC;
GRANT USAGE ON SCHEMA metadata TO PUBLIC;
GRANT USAGE ON SCHEMA analytics TO PUBLIC;

GRANT SELECT ON ALL TABLES IN SCHEMA bronze TO PUBLIC;
GRANT SELECT ON ALL TABLES IN SCHEMA silver TO PUBLIC;
GRANT SELECT ON ALL TABLES IN SCHEMA gold TO PUBLIC;
GRANT SELECT ON ALL TABLES IN SCHEMA metadata TO PUBLIC;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO PUBLIC;
