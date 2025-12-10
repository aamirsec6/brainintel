-- Migration: 005_create_identity_merge_log
-- Description: Comprehensive log of all profile merges with snapshots for rollback

CREATE TABLE IF NOT EXISTS identity_merge_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Profiles involved
  source_profile_id UUID NOT NULL, -- Profile being merged (will be marked as merged)
  target_profile_id UUID NOT NULL, -- Profile keeping (the survivor)
  
  -- Snapshots for rollback (full JSONB dumps)
  source_snapshot JSONB NOT NULL,
  target_snapshot JSONB NOT NULL,
  
  -- Merge decision details
  merge_type merge_status NOT NULL,
  confidence_score DECIMAL(3, 2) NOT NULL, -- 0.00 to 1.00
  
  -- Scoring breakdown
  scoring_details JSONB NOT NULL, -- Detailed match scores for audit
  
  -- Matching identifiers
  matched_identifiers JSONB, -- Which identifiers triggered the merge
  
  -- Reason and metadata
  reason TEXT NOT NULL,
  triggered_by VARCHAR(100), -- 'auto', 'manual_user_id', 'import_batch_id'
  
  -- Rollback support
  rolled_back BOOLEAN DEFAULT FALSE,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by VARCHAR(100),
  rollback_reason TEXT,
  
  -- Timestamps
  merged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_identity_merge_log_source ON identity_merge_log(source_profile_id);
CREATE INDEX idx_identity_merge_log_target ON identity_merge_log(target_profile_id);
CREATE INDEX idx_identity_merge_log_type ON identity_merge_log(merge_type);
CREATE INDEX idx_identity_merge_log_merged_at ON identity_merge_log(merged_at DESC);
CREATE INDEX idx_identity_merge_log_rolled_back ON identity_merge_log(rolled_back) WHERE rolled_back = TRUE;
CREATE INDEX idx_identity_merge_log_confidence ON identity_merge_log(confidence_score DESC);

-- GIN indexes for JSON queries
CREATE INDEX idx_identity_merge_log_scoring ON identity_merge_log USING GIN (scoring_details);
CREATE INDEX idx_identity_merge_log_matched_ids ON identity_merge_log USING GIN (matched_identifiers);

COMMENT ON TABLE identity_merge_log IS 'Immutable log of all identity merges with full snapshots for rollback capability';
COMMENT ON COLUMN identity_merge_log.source_snapshot IS 'Complete JSON dump of source profile before merge';
COMMENT ON COLUMN identity_merge_log.target_snapshot IS 'Complete JSON dump of target profile before merge';
COMMENT ON COLUMN identity_merge_log.scoring_details IS 'Breakdown of match scores (phone_match, email_match, name_similarity, etc.)';

