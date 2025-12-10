-- Migration: 002_create_profile_identifier
-- Description: Stores all identifiers linked to customer profiles

CREATE TABLE IF NOT EXISTS profile_identifier (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  profile_id UUID NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
  
  -- Identifier details
  type identifier_type NOT NULL,
  value TEXT NOT NULL, -- Raw value (e.g., +919876543210)
  value_hash TEXT NOT NULL, -- SHA256 hash of normalized value
  
  -- Metadata
  source VARCHAR(100), -- Which channel/system provided this identifier
  confidence DECIMAL(3, 2) DEFAULT 1.0, -- 0.0 to 1.0
  
  -- Timestamps
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique identifier per profile
  CONSTRAINT unique_profile_identifier UNIQUE (profile_id, type, value_hash)
);

-- Critical indexes for identity resolution
CREATE UNIQUE INDEX idx_profile_identifier_type_hash ON profile_identifier(type, value_hash);
CREATE INDEX idx_profile_identifier_profile_id ON profile_identifier(profile_id);
CREATE INDEX idx_profile_identifier_value_hash ON profile_identifier(value_hash);
CREATE INDEX idx_profile_identifier_type ON profile_identifier(type);

-- Auto-update trigger
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

COMMENT ON TABLE profile_identifier IS 'All identifiers (phone, email, device, etc.) linked to customer profiles';
COMMENT ON COLUMN profile_identifier.value_hash IS 'SHA256 hash of normalized identifier for privacy and matching';

