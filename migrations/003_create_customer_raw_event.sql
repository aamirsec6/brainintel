-- Migration: 003_create_customer_raw_event
-- Description: Stores all incoming raw events before processing

CREATE TABLE IF NOT EXISTS customer_raw_event (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event source
  source VARCHAR(100) NOT NULL, -- 'app', 'web', 'pos', 'whatsapp', etc.
  event_type VARCHAR(100) NOT NULL, -- 'view', 'purchase', 'add_to_cart', etc.
  
  -- Timing
  event_ts TIMESTAMPTZ NOT NULL, -- When event occurred
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When we received it
  
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

-- Indexes for querying and processing
CREATE INDEX idx_customer_raw_event_status ON customer_raw_event(status);
CREATE INDEX idx_customer_raw_event_source ON customer_raw_event(source);
CREATE INDEX idx_customer_raw_event_type ON customer_raw_event(event_type);
CREATE INDEX idx_customer_raw_event_received_at ON customer_raw_event(received_at DESC);
CREATE INDEX idx_customer_raw_event_event_ts ON customer_raw_event(event_ts DESC);
CREATE INDEX idx_customer_raw_event_request_id ON customer_raw_event(request_id);

-- GIN index for fast JSONB queries
CREATE INDEX idx_customer_raw_event_identifiers ON customer_raw_event USING GIN (identifiers);
CREATE INDEX idx_customer_raw_event_payload ON customer_raw_event USING GIN (payload);

COMMENT ON TABLE customer_raw_event IS 'Raw, unprocessed events from all sources - never mutated';
COMMENT ON COLUMN customer_raw_event.status IS 'accepted = valid schema, quarantined = failed validation, processed = linked to profile';

