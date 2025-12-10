-- Migration: 006_create_pricing
-- Description: Creates pricing rules table for channel-specific and segment-based pricing

CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Product identification
  sku VARCHAR(255) NOT NULL,
  
  -- Pricing context
  channel VARCHAR(100), -- 'web', 'pos', 'marketplace', 'app', NULL = all channels
  segment VARCHAR(100), -- Customer segment, NULL = all segments
  region VARCHAR(100), -- Geographic region, NULL = all regions
  
  -- Pricing
  base_price DECIMAL(12, 2) NOT NULL,
  promotional_price DECIMAL(12, 2),
  
  -- Validity period
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  
  -- Priority (higher = more specific, takes precedence)
  priority INTEGER DEFAULT 0,
  
  -- Metadata
  rule_name VARCHAR(255),
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pricing_rules_sku ON pricing_rules(sku);
CREATE INDEX idx_pricing_rules_channel ON pricing_rules(channel);
CREATE INDEX idx_pricing_rules_segment ON pricing_rules(segment);
CREATE INDEX idx_pricing_rules_valid ON pricing_rules(valid_from, valid_until) WHERE enabled = TRUE;
CREATE INDEX idx_pricing_rules_priority ON pricing_rules(priority DESC);

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pricing_rule_id UUID REFERENCES pricing_rules(id) ON DELETE CASCADE,
  sku VARCHAR(255) NOT NULL,
  
  -- Price details
  old_price DECIMAL(12, 2),
  new_price DECIMAL(12, 2),
  channel VARCHAR(100),
  
  -- Change context
  changed_by VARCHAR(255),
  reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_sku ON price_history(sku);
CREATE INDEX idx_price_history_created_at ON price_history(created_at DESC);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_pricing_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_rules_updated_at();

COMMENT ON TABLE pricing_rules IS 'Channel-specific and segment-based pricing rules';
COMMENT ON TABLE price_history IS 'Audit trail for price changes';

