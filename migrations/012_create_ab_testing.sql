-- A/B Testing Tables
-- Manages experiments, assignments, and conversions

CREATE TABLE IF NOT EXISTS ab_experiment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  variants TEXT[] NOT NULL, -- e.g., ['A', 'B', 'C']
  traffic_split JSONB NOT NULL, -- e.g., {'A': 50, 'B': 50}
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'
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
  conversion_type VARCHAR(100) NOT NULL, -- e.g., 'purchase', 'signup', 'click'
  value NUMERIC, -- Optional conversion value (e.g., revenue)
  converted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_assignment_experiment ON ab_assignment(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignment_profile ON ab_assignment(profile_id);
CREATE INDEX IF NOT EXISTS idx_ab_conversion_experiment ON ab_conversion(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_conversion_profile ON ab_conversion(profile_id);
CREATE INDEX IF NOT EXISTS idx_ab_conversion_variant ON ab_conversion(variant);

