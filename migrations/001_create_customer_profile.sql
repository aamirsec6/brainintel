-- Migration: 001_create_customer_profile
-- Description: Creates the unified customer profile table

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

-- Indexes for performance
CREATE INDEX idx_customer_profile_primary_phone ON customer_profile(primary_phone);
CREATE INDEX idx_customer_profile_primary_email ON customer_profile(primary_email);
CREATE INDEX idx_customer_profile_full_name ON customer_profile(full_name);
CREATE INDEX idx_customer_profile_last_seen ON customer_profile(last_seen_at DESC);
CREATE INDEX idx_customer_profile_ltv ON customer_profile(ltv DESC);
CREATE INDEX idx_customer_profile_segment ON customer_profile(segment);
CREATE INDEX idx_customer_profile_embedding ON customer_profile USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Trigger to auto-update updated_at
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

COMMENT ON TABLE customer_profile IS 'Unified customer profile - the single source of truth for customer identity';

