-- Migration: 007_create_customer_journey
-- Description: Creates customer journey tracking table for omnichannel touchpoint mapping

CREATE TABLE IF NOT EXISTS customer_journey (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Customer identification
  profile_id UUID NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
  
  -- Journey identification
  journey_id VARCHAR(255) NOT NULL, -- Unique journey identifier (e.g., session-based or goal-based)
  
  -- Touchpoint details
  touchpoint_number INTEGER NOT NULL, -- Order of touchpoint in journey (1, 2, 3...)
  channel VARCHAR(100) NOT NULL, -- 'web', 'app', 'pos', 'whatsapp', etc.
  event_type VARCHAR(100) NOT NULL, -- 'view', 'add_to_cart', 'purchase', etc.
  event_ts TIMESTAMPTZ NOT NULL,
  
  -- Session and device tracking
  session_id VARCHAR(255),
  device_id VARCHAR(255),
  device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
  
  -- Attribution data
  referrer VARCHAR(500),
  campaign VARCHAR(255),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  
  -- Conversion tracking
  converted BOOLEAN DEFAULT FALSE,
  conversion_value DECIMAL(12, 2),
  conversion_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  
  -- Journey metadata
  journey_stage VARCHAR(50), -- 'awareness', 'consideration', 'purchase', 'retention'
  time_to_conversion INTEGER, -- Minutes from first touchpoint to conversion
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_customer_journey_profile_id ON customer_journey(profile_id);
CREATE INDEX idx_customer_journey_journey_id ON customer_journey(journey_id);
CREATE INDEX idx_customer_journey_event_ts ON customer_journey(event_ts DESC);
CREATE INDEX idx_customer_journey_converted ON customer_journey(converted) WHERE converted = TRUE;
CREATE INDEX idx_customer_journey_channel ON customer_journey(channel);
CREATE INDEX idx_customer_journey_session_id ON customer_journey(session_id) WHERE session_id IS NOT NULL;

-- Composite index for journey queries
CREATE INDEX idx_customer_journey_profile_journey ON customer_journey(profile_id, journey_id, touchpoint_number);

COMMENT ON TABLE customer_journey IS 'Customer journey touchpoints across channels for conversion tracking and attribution';

