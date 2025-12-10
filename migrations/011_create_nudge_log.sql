-- Nudge Log Table
-- Tracks all nudge executions for audit and analysis

CREATE TABLE IF NOT EXISTS nudge_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
  nudge_type VARCHAR(50) NOT NULL, -- e.g., 'churn_prevention', 'upsell', 'cross_sell'
  channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push', 'whatsapp'
  template VARCHAR(100) NOT NULL,
  personalization JSONB,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  message_id VARCHAR(255),
  response_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_nudge_log_profile_id ON nudge_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_nudge_log_executed_at ON nudge_log(executed_at);
CREATE INDEX IF NOT EXISTS idx_nudge_log_nudge_type ON nudge_log(nudge_type);

