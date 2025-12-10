-- Migration: 004_create_events
-- Description: Normalized, processed events linked to customer profiles

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Link to profile (resolved by identity engine)
  profile_id UUID NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
  
  -- Link to raw event
  raw_event_id UUID REFERENCES customer_raw_event(id) ON DELETE SET NULL,
  
  -- Event details
  source VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_ts TIMESTAMPTZ NOT NULL,
  
  -- Normalized payload
  payload JSONB NOT NULL,
  
  -- E-commerce specific fields (denormalized for performance)
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

-- Performance indexes
CREATE INDEX idx_events_profile_id ON events(profile_id);
CREATE INDEX idx_events_profile_event_ts ON events(profile_id, event_ts DESC);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_source ON events(source);
CREATE INDEX idx_events_event_ts ON events(event_ts DESC);
CREATE INDEX idx_events_sku ON events(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_events_category ON events(category) WHERE category IS NOT NULL;
CREATE INDEX idx_events_session_id ON events(session_id) WHERE session_id IS NOT NULL;

-- GIN index for payload queries
CREATE INDEX idx_events_payload ON events USING GIN (payload);

-- Composite index for timeline queries
CREATE INDEX idx_events_profile_timeline ON events(profile_id, event_ts DESC, event_type);

COMMENT ON TABLE events IS 'Normalized, processed events linked to resolved customer profiles';
COMMENT ON COLUMN events.profile_id IS 'Resolved customer profile after identity matching';

