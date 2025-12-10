-- Delete all customer data from the database
-- This will remove all customer profiles, identifiers, events, and related data

BEGIN;

-- Get counts before deletion
DO $$
DECLARE
  profiles_count INTEGER;
  identifiers_count INTEGER;
  raw_events_count INTEGER;
  events_count INTEGER;
  merge_logs_count INTEGER;
  journeys_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profiles_count FROM customer_profile;
  SELECT COUNT(*) INTO identifiers_count FROM profile_identifier;
  SELECT COUNT(*) INTO raw_events_count FROM customer_raw_event;
  SELECT COUNT(*) INTO events_count FROM events;
  SELECT COUNT(*) INTO merge_logs_count FROM identity_merge_log;
  SELECT COUNT(*) INTO journeys_count FROM customer_journey;
  
  RAISE NOTICE '📊 Current data counts:';
  RAISE NOTICE '   Profiles: %', profiles_count;
  RAISE NOTICE '   Identifiers: %', identifiers_count;
  RAISE NOTICE '   Raw events: %', raw_events_count;
  RAISE NOTICE '   Processed events: %', events_count;
  RAISE NOTICE '   Merge logs: %', merge_logs_count;
  RAISE NOTICE '   Journeys: %', journeys_count;
END $$;

-- Delete in order (respecting foreign keys)
-- Start with tables that reference customer_profile

-- Delete journey data
TRUNCATE TABLE customer_journey CASCADE;

-- Delete processed events
TRUNCATE TABLE events CASCADE;

-- Delete profile identifiers
TRUNCATE TABLE profile_identifier CASCADE;

-- Delete identity merge logs
TRUNCATE TABLE identity_merge_log CASCADE;

-- Delete customer profiles
TRUNCATE TABLE customer_profile CASCADE;

-- Delete raw events
TRUNCATE TABLE customer_raw_event CASCADE;

-- Verify deletion
DO $$
DECLARE
  profiles_count INTEGER;
  identifiers_count INTEGER;
  raw_events_count INTEGER;
  events_count INTEGER;
  merge_logs_count INTEGER;
  journeys_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profiles_count FROM customer_profile;
  SELECT COUNT(*) INTO identifiers_count FROM profile_identifier;
  SELECT COUNT(*) INTO raw_events_count FROM customer_raw_event;
  SELECT COUNT(*) INTO events_count FROM events;
  SELECT COUNT(*) INTO merge_logs_count FROM identity_merge_log;
  SELECT COUNT(*) INTO journeys_count FROM customer_journey;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Deletion complete!';
  RAISE NOTICE '📊 Final counts:';
  RAISE NOTICE '   Profiles: %', profiles_count;
  RAISE NOTICE '   Identifiers: %', identifiers_count;
  RAISE NOTICE '   Raw events: %', raw_events_count;
  RAISE NOTICE '   Processed events: %', events_count;
  RAISE NOTICE '   Merge logs: %', merge_logs_count;
  RAISE NOTICE '   Journeys: %', journeys_count;
END $$;

COMMIT;

