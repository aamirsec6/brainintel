-- Recalculate all customer profile metrics based on order_placed events
-- Updates: total_orders, total_spent, avg_order_value, ltv, last_purchase_at

BEGIN;

-- Update all profiles with metrics from order_placed events
UPDATE customer_profile cp
SET 
  total_orders = COALESCE((
    SELECT COUNT(*)
    FROM customer_raw_event cre
    WHERE cre.event_type = 'order_placed'
      AND (
        (cre.identifiers->>'phone' = cp.primary_phone AND cp.primary_phone IS NOT NULL)
        OR (cre.identifiers->>'email' = cp.primary_email AND cp.primary_email IS NOT NULL)
      )
  ), 0),
  
  total_spent = COALESCE((
    SELECT SUM(
      CASE 
        WHEN payload->>'total' IS NOT NULL THEN (payload->>'total')::numeric
        WHEN payload->>'price' IS NOT NULL THEN (payload->>'price')::numeric
        WHEN payload->>'amount' IS NOT NULL THEN (payload->>'amount')::numeric
        ELSE 0
      END
    )
    FROM customer_raw_event cre
    WHERE cre.event_type = 'order_placed'
      AND (
        (cre.identifiers->>'phone' = cp.primary_phone AND cp.primary_phone IS NOT NULL)
        OR (cre.identifiers->>'email' = cp.primary_email AND cp.primary_email IS NOT NULL)
      )
  ), 0),
  
  avg_order_value = COALESCE((
    SELECT AVG(
      CASE 
        WHEN payload->>'total' IS NOT NULL THEN (payload->>'total')::numeric
        WHEN payload->>'price' IS NOT NULL THEN (payload->>'price')::numeric
        WHEN payload->>'amount' IS NOT NULL THEN (payload->>'amount')::numeric
        ELSE 0
      END
    )
    FROM customer_raw_event cre
    WHERE cre.event_type = 'order_placed'
      AND (
        (cre.identifiers->>'phone' = cp.primary_phone AND cp.primary_phone IS NOT NULL)
        OR (cre.identifiers->>'email' = cp.primary_email AND cp.primary_email IS NOT NULL)
      )
  ), 0),
  
  ltv = COALESCE((
    SELECT SUM(
      CASE 
        WHEN payload->>'total' IS NOT NULL THEN (payload->>'total')::numeric
        WHEN payload->>'price' IS NOT NULL THEN (payload->>'price')::numeric
        WHEN payload->>'amount' IS NOT NULL THEN (payload->>'amount')::numeric
        ELSE 0
      END
    )
    FROM customer_raw_event cre
    WHERE cre.event_type = 'order_placed'
      AND (
        (cre.identifiers->>'phone' = cp.primary_phone AND cp.primary_phone IS NOT NULL)
        OR (cre.identifiers->>'email' = cp.primary_email AND cp.primary_email IS NOT NULL)
      )
  ), 0),
  
  last_purchase_at = (
    SELECT MAX(event_ts)
    FROM customer_raw_event cre
    WHERE cre.event_type = 'order_placed'
      AND (
        (cre.identifiers->>'phone' = cp.primary_phone AND cp.primary_phone IS NOT NULL)
        OR (cre.identifiers->>'email' = cp.primary_email AND cp.primary_email IS NOT NULL)
      )
  ),
  
  updated_at = NOW()
WHERE cp.is_merged = false;

-- Show summary
DO $$
DECLARE
  total_profiles INTEGER;
  total_orders_sum INTEGER;
  total_spent_sum NUMERIC;
  avg_spent NUMERIC;
  max_spent NUMERIC;
BEGIN
  SELECT COUNT(*), SUM(total_orders), SUM(total_spent), AVG(total_spent), MAX(total_spent)
  INTO total_profiles, total_orders_sum, total_spent_sum, avg_spent, max_spent
  FROM customer_profile
  WHERE is_merged = false;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Metrics recalculation complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   Total Profiles: %', total_profiles;
  RAISE NOTICE '   Total Orders: %', total_orders_sum;
  RAISE NOTICE '   Total Spent: ₹%', total_spent_sum;
  RAISE NOTICE '   Average Spent: ₹%', ROUND(avg_spent, 2);
  RAISE NOTICE '   Max Spent: ₹%', max_spent;
END $$;

COMMIT;

