-- Initialize Retail Brain Database
-- Enable required extensions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Set timezone
SET timezone = 'UTC';

-- Create custom types
CREATE TYPE identifier_type AS ENUM ('phone', 'email', 'device', 'cookie', 'loyalty_id', 'invoice_id');
CREATE TYPE event_status AS ENUM ('accepted', 'quarantined', 'processed');
CREATE TYPE merge_status AS ENUM ('auto', 'manual', 'pending_review', 'rolled_back');

-- Logging helper
DO $$ 
BEGIN
  RAISE NOTICE 'Retail Brain database initialized successfully';
END $$;

