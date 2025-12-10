-- ML Monitoring Tables
-- Tracks predictions, drift, and alerts

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
  type VARCHAR(50) NOT NULL, -- 'drift', 'performance', 'error'
  model_name VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
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

