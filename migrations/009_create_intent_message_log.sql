-- Create table to log intent detections coming from channel/webhook ingress
CREATE TABLE IF NOT EXISTS intent_message_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel TEXT NOT NULL,
    sender TEXT,
    text TEXT NOT NULL,
    intent TEXT,
    confidence NUMERIC,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intent_message_log_created_at
    ON intent_message_log (created_at DESC);


