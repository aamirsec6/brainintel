-- Migration: 010_create_feature_store
-- Description: Creates feature store tables for ML feature management

-- Feature values table (stores computed features per profile)
CREATE TABLE IF NOT EXISTS feature_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Profile reference
  profile_id UUID NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
  
  -- Feature metadata
  feature_name VARCHAR(255) NOT NULL,
  feature_value JSONB NOT NULL, -- Flexible value type (number, string, array, object)
  feature_type VARCHAR(50) NOT NULL, -- 'numeric', 'categorical', 'vector', 'text'
  
  -- Versioning and tracking
  dataset_id VARCHAR(255), -- Snapshot/dataset identifier for training data versioning
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feature metadata table (describes features)
CREATE TABLE IF NOT EXISTS feature_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Feature identification
  feature_name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  feature_type VARCHAR(50) NOT NULL, -- 'numeric', 'categorical', 'vector', 'text'
  
  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Schema information (for validation)
  schema_definition JSONB, -- JSON schema for feature_value validation
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_values_profile_id ON feature_values(profile_id);
CREATE INDEX IF NOT EXISTS idx_feature_values_feature_name ON feature_values(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_values_computed_at ON feature_values(computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_values_dataset_id ON feature_values(dataset_id) WHERE dataset_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_values_profile_feature_latest ON feature_values(profile_id, feature_name, computed_at DESC);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_feature_values_value ON feature_values USING GIN (feature_value);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_feature_values_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_feature_values_updated_at
  BEFORE UPDATE ON feature_values
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_values_updated_at();

CREATE TRIGGER trigger_feature_metadata_updated_at
  BEFORE UPDATE ON feature_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_values_updated_at();

COMMENT ON TABLE feature_values IS 'Stores computed features for profiles - used for ML training and inference';
COMMENT ON TABLE feature_metadata IS 'Metadata about available features - descriptions, types, versions';

