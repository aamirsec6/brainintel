-- ============================================================================
-- Retail Brain - Complete Database Setup for Supabase
-- ============================================================================
-- Run this entire script in Supabase SQL Editor to create all tables
-- ============================================================================

-- Step 1: Enable Required Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Set timezone
SET timezone = 'UTC';

-- Step 2: Create Custom Types
-- ============================================================================
CREATE TYPE identifier_type AS ENUM ('phone', 'email', 'device', 'cookie', 'loyalty_id', 'invoice_id');
CREATE TYPE event_status AS ENUM ('accepted', 'quarantined', 'processed');
CREATE TYPE merge_status AS ENUM ('auto', 'manual', 'pending_review', 'rolled_back');

-- Step 3: Create Core Tables
-- ============================================================================

-- Customer Profile Table
CREATE TABLE IF NOT EXISTS customer_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Core identity fields
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  full_name VARCHAR(512),
  
  -- Contact
  primary_phone VARCHAR(50),
  primary_email VARCHAR(255),
  
  -- Demographics
  gender VARCHAR(50),
  date_of_birth DATE,
  
  -- Location
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- Behavioral metrics
  ltv DECIMAL(12, 2) DEFAULT 0.0,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0.0,
  avg_order_value DECIMAL(12, 2) DEFAULT 0.0,
  
  -- Engagement
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_purchase_at TIMESTAMPTZ,
  
  -- Classification
  segment VARCHAR(100),
  tags TEXT[],
  
  -- AI/ML fields
  embedding VECTOR(768), -- For semantic search
  
  -- Metadata
  is_merged BOOLEAN DEFAULT FALSE,
  merged_into UUID REFERENCES customer_profile(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for customer_profile
CREATE INDEX IF NOT EXISTS idx_customer_profile_primary_phone ON customer_profile(primary_phone);
CREATE INDEX IF NOT EXISTS idx_customer_profile_primary_email ON customer_profile(primary_email);
CREATE INDEX IF NOT EXISTS idx_customer_profile_full_name ON customer_profile(full_name);
CREATE INDEX IF NOT EXISTS idx_customer_profile_last_seen ON customer_profile(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_profile_ltv ON customer_profile(ltv DESC);
CREATE INDEX IF NOT EXISTS idx_customer_profile_segment ON customer_profile(segment);
CREATE INDEX IF NOT EXISTS idx_customer_profile_embedding ON customer_profile USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Profile Identifier Table
CREATE TABLE IF NOT EXISTS profile_identifier (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  profile_id UUID NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
  
  -- Identifier details
  type identifier_type NOT NULL,
  value TEXT NOT NULL,
  value_hash TEXT NOT NULL,
  
  -- Metadata
  source VARCHAR(100),
  confidence DECIMAL(3, 2) DEFAULT 1.0,
  
  -- Timestamps
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique identifier per profile
  CONSTRAINT unique_profile_identifier UNIQUE (profile_id, type, value_hash)
);

-- Indexes for profile_identifier
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_identifier_type_hash ON profile_identifier(type, value_hash);
CREATE INDEX IF NOT EXISTS idx_profile_identifier_profile_id ON profile_identifier(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_identifier_value_hash ON profile_identifier(value_hash);
CREATE INDEX IF NOT EXISTS idx_profile_identifier_type ON profile_identifier(type);

-- Customer Raw Event Table
CREATE TABLE IF NOT EXISTS customer_raw_event (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event source
  source VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  
  -- Timing
  event_ts TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Identifiers (raw JSON)
  identifiers JSONB NOT NULL,
  
  -- Payload (raw JSON)
  payload JSONB NOT NULL,
  
  -- Processing status
  status event_status NOT NULL DEFAULT 'accepted',
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  
  -- Request metadata
  request_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for customer_raw_event
CREATE INDEX IF NOT EXISTS idx_customer_raw_event_status ON customer_raw_event(status);
CREATE INDEX IF NOT EXISTS idx_customer_raw_event_source ON customer_raw_event(source);
CREATE INDEX IF NOT EXISTS idx_customer_raw_event_type ON customer_raw_event(event_type);
CREATE INDEX IF NOT EXISTS idx_customer_raw_event_received_at ON customer_raw_event(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_raw_event_event_ts ON customer_raw_event(event_ts DESC);
CREATE INDEX IF NOT EXISTS idx_customer_raw_event_request_id ON customer_raw_event(request_id);
CREATE INDEX IF NOT EXISTS idx_customer_raw_event_identifiers ON customer_raw_event USING GIN (identifiers);
CREATE INDEX IF NOT EXISTS idx_customer_raw_event_payload ON customer_raw_event USING GIN (payload);

-- Events Table (Normalized)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Link to profile
  profile_id UUID NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
  
  -- Link to raw event
  raw_event_id UUID REFERENCES customer_raw_event(id) ON DELETE SET NULL,
  
  -- Event details
  source VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_ts TIMESTAMPTZ NOT NULL,
  
  -- Normalized payload
  payload JSONB NOT NULL,
  
  -- E-commerce specific fields
  sku VARCHAR(255),
  product_name VARCHAR(500),
  category VARCHAR(255),
  price DECIMAL(12, 2),
  quantity INTEGER,
  revenue DECIMAL(12, 2),
  
  -- Session tracking
  session_id VARCHAR(255),
  
  -- Attribution
  channel VARCHAR(100),
  campaign VARCHAR(255),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_profile_id ON events(profile_id);
CREATE INDEX IF NOT EXISTS idx_events_profile_event_ts ON events(profile_id, event_ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
CREATE INDEX IF NOT EXISTS idx_events_event_ts ON events(event_ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_sku ON events(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_payload ON events USING GIN (payload);
CREATE INDEX IF NOT EXISTS idx_events_profile_timeline ON events(profile_id, event_ts DESC, event_type);

-- Identity Merge Log Table
CREATE TABLE IF NOT EXISTS identity_merge_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Profiles involved
  source_profile_id UUID NOT NULL,
  target_profile_id UUID NOT NULL,
  
  -- Snapshots for rollback
  source_snapshot JSONB NOT NULL,
  target_snapshot JSONB NOT NULL,
  
  -- Merge decision details
  merge_type merge_status NOT NULL,
  confidence_score DECIMAL(3, 2) NOT NULL,
  
  -- Scoring breakdown
  scoring_details JSONB NOT NULL,
  
  -- Matching identifiers
  matched_identifiers JSONB,
  
  -- Reason and metadata
  reason TEXT NOT NULL,
  triggered_by VARCHAR(100),
  
  -- Rollback support
  rolled_back BOOLEAN DEFAULT FALSE,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by VARCHAR(100),
  rollback_reason TEXT,
  
  -- Timestamps
  merged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for identity_merge_log
CREATE INDEX IF NOT EXISTS idx_identity_merge_log_source ON identity_merge_log(source_profile_id);
CREATE INDEX IF NOT EXISTS idx_identity_merge_log_target ON identity_merge_log(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_identity_merge_log_type ON identity_merge_log(merge_type);
CREATE INDEX IF NOT EXISTS idx_identity_merge_log_merged_at ON identity_merge_log(merged_at DESC);
CREATE INDEX IF NOT EXISTS idx_identity_merge_log_rolled_back ON identity_merge_log(rolled_back) WHERE rolled_back = TRUE;
CREATE INDEX IF NOT EXISTS idx_identity_merge_log_confidence ON identity_merge_log(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_identity_merge_log_scoring ON identity_merge_log USING GIN (scoring_details);
CREATE INDEX IF NOT EXISTS idx_identity_merge_log_matched_ids ON identity_merge_log USING GIN (matched_identifiers);

-- Intent Message Log Table
CREATE TABLE IF NOT EXISTS intent_message_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel TEXT NOT NULL,
  sender TEXT,
  text TEXT NOT NULL,
  intent TEXT,
  confidence NUMERIC,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intent_message_log_created_at ON intent_message_log(created_at DESC);

-- Nudge Log Table
CREATE TABLE IF NOT EXISTS nudge_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
  nudge_type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  template VARCHAR(100) NOT NULL,
  personalization JSONB,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  message_id VARCHAR(255),
  response_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_nudge_log_profile_id ON nudge_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_nudge_log_executed_at ON nudge_log(executed_at);
CREATE INDEX IF NOT EXISTS idx_nudge_log_nudge_type ON nudge_log(nudge_type);

-- A/B Testing Tables
CREATE TABLE IF NOT EXISTS ab_experiment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  variants TEXT[] NOT NULL,
  traffic_split JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ab_assignment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID NOT NULL REFERENCES ab_experiment(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
  variant VARCHAR(50) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(experiment_id, profile_id)
);

CREATE TABLE IF NOT EXISTS ab_conversion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID NOT NULL REFERENCES ab_experiment(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
  variant VARCHAR(50) NOT NULL,
  conversion_type VARCHAR(100) NOT NULL,
  value NUMERIC,
  converted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_assignment_experiment ON ab_assignment(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignment_profile ON ab_assignment(profile_id);
CREATE INDEX IF NOT EXISTS idx_ab_conversion_experiment ON ab_conversion(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_conversion_profile ON ab_conversion(profile_id);
CREATE INDEX IF NOT EXISTS idx_ab_conversion_variant ON ab_conversion(variant);

-- ML Monitoring Tables
CREATE TABLE IF NOT EXISTS ml_prediction_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(255) NOT NULL,
  profile_id UUID NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
  features JSONB,
  prediction NUMERIC NOT NULL,
  actual NUMERIC,
  predicted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ml_drift_check (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(255) NOT NULL,
  drift_detected BOOLEAN NOT NULL,
  metrics JSONB,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ml_alert (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_ml_prediction_log_model ON ml_prediction_log(model_name);
CREATE INDEX IF NOT EXISTS idx_ml_prediction_log_profile ON ml_prediction_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_ml_prediction_log_predicted_at ON ml_prediction_log(predicted_at);
CREATE INDEX IF NOT EXISTS idx_ml_drift_check_model ON ml_drift_check(model_name);
CREATE INDEX IF NOT EXISTS idx_ml_drift_check_checked_at ON ml_drift_check(checked_at);
CREATE INDEX IF NOT EXISTS idx_ml_alert_model ON ml_alert(model_name);
CREATE INDEX IF NOT EXISTS idx_ml_alert_created_at ON ml_alert(created_at);

-- Step 4: Create Helper Functions
-- ============================================================================

-- Auto-update updated_at for customer_profile
CREATE OR REPLACE FUNCTION update_customer_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_customer_profile_updated_at
  BEFORE UPDATE ON customer_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_profile_updated_at();

-- Auto-update updated_at for profile_identifier
CREATE OR REPLACE FUNCTION update_profile_identifier_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profile_identifier_updated_at
  BEFORE UPDATE ON profile_identifier
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_identifier_updated_at();

-- Helper function to generate value_hash
CREATE OR REPLACE FUNCTION generate_value_hash(val TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(LOWER(TRIM(val)), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 5: Add Comments
-- ============================================================================

COMMENT ON TABLE customer_profile IS 'Unified customer profile - the single source of truth for customer identity';
COMMENT ON TABLE profile_identifier IS 'All identifiers (phone, email, device, etc.) linked to customer profiles';
COMMENT ON TABLE customer_raw_event IS 'Raw, unprocessed events from all sources - never mutated';
COMMENT ON TABLE events IS 'Normalized, processed events linked to resolved customer profiles';
COMMENT ON TABLE identity_merge_log IS 'Immutable log of all identity merges with full snapshots for rollback capability';
COMMENT ON TABLE intent_message_log IS 'Log of intent detections from various channels';
COMMENT ON TABLE nudge_log IS 'Tracks all nudge executions for audit and analysis';
COMMENT ON TABLE ab_experiment IS 'A/B testing experiments';
COMMENT ON TABLE ab_assignment IS 'Customer assignments to experiment variants';
COMMENT ON TABLE ab_conversion IS 'Conversion events for A/B tests';
COMMENT ON TABLE ml_prediction_log IS 'ML model predictions log';
COMMENT ON TABLE ml_drift_check IS 'ML model drift detection results';
COMMENT ON TABLE ml_alert IS 'ML model alerts and notifications';

-- ============================================================================
-- Setup Complete!
-- ============================================================================
-- You can now view all tables in Supabase Dashboard → Table Editor
-- ============================================================================

