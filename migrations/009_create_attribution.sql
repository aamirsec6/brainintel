-- Migration: 008_create_attribution
-- Description: Creates attribution tracking table for multi-touch attribution models

CREATE TABLE IF NOT EXISTS attribution (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Customer and conversion
  profile_id UUID NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
  conversion_event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Touchpoint being attributed
  touchpoint_event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Attribution model
  attribution_model VARCHAR(50) NOT NULL, -- 'first_touch', 'last_touch', 'linear', 'time_decay', 'position_based'
  attribution_weight DECIMAL(5, 4) NOT NULL, -- 0.0 to 1.0 (sum of weights for a conversion = 1.0)
  
  -- Touchpoint context
  channel VARCHAR(100),
  campaign VARCHAR(255),
  touchpoint_number INTEGER, -- Position in journey (1, 2, 3...)
  
  -- Conversion details
  conversion_value DECIMAL(12, 2),
  attributed_value DECIMAL(12, 2), -- conversion_value * attribution_weight
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_attribution_profile_id ON attribution(profile_id);
CREATE INDEX idx_attribution_conversion_event_id ON attribution(conversion_event_id);
CREATE INDEX idx_attribution_model ON attribution(attribution_model);
CREATE INDEX idx_attribution_channel ON attribution(channel);
CREATE INDEX idx_attribution_campaign ON attribution(campaign);

-- Composite index for attribution reports
CREATE INDEX idx_attribution_model_channel ON attribution(attribution_model, channel);

COMMENT ON TABLE attribution IS 'Multi-touch attribution tracking for conversion analysis';

