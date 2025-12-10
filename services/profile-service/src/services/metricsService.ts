/**
 * Metrics Service
 * Calculates customer metrics (LTV, AOV, etc.)
 */
import { getDb } from '@retail-brain/db';
import { createLogger } from '@retail-brain/logger';

const logger = createLogger({
  service: 'metrics-service',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Calculate all metrics for a profile
 */
export async function calculateProfileMetrics(profileId: string): Promise<void> {
  const db = getDb();

  try {
    // Get profile's identifiers
    const identifiersQuery = `
      SELECT value
      FROM profile_identifier
      WHERE profile_id = $1
    `;

    const identifiersResult = await db.query(identifiersQuery, [profileId]);
    const identifierValues = identifiersResult.rows.map(r => r.value);

    if (identifierValues.length === 0) {
      logger.warn('No identifiers found for profile', { profile_id: profileId });
      return;
    }

    // Calculate metrics from raw events
    // Support both 'purchase' and 'order_placed' event types
    const metricsQuery = `
      WITH profile_events AS (
        SELECT *
        FROM customer_raw_event
        WHERE identifiers ?| $1
      ),
      order_events AS (
        SELECT *
        FROM profile_events
        WHERE event_type IN ('purchase', 'order_placed')
      )
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(
          CASE 
            WHEN payload->>'total' IS NOT NULL THEN (payload->>'total')::numeric
            WHEN payload->>'price' IS NOT NULL THEN (payload->>'price')::numeric
            WHEN payload->>'amount' IS NOT NULL THEN (payload->>'amount')::numeric
            ELSE 0
          END
        ), 0) as total_spent,
        COALESCE(AVG(
          CASE 
            WHEN payload->>'total' IS NOT NULL THEN (payload->>'total')::numeric
            WHEN payload->>'price' IS NOT NULL THEN (payload->>'price')::numeric
            WHEN payload->>'amount' IS NOT NULL THEN (payload->>'amount')::numeric
            ELSE 0
          END
        ), 0) as avg_order_value,
        MIN(event_ts) as first_seen,
        MAX(event_ts) as last_seen,
        MAX(event_ts) as last_purchase
      FROM order_events
    `;

    const metricsResult = await db.query(metricsQuery, [identifierValues]);
    const metrics = metricsResult.rows[0];

    // Update profile
    const updateQuery = `
      UPDATE customer_profile
      SET 
        total_orders = $2,
        total_spent = $3,
        avg_order_value = $4,
        ltv = $5,
        first_seen_at = $6,
        last_seen_at = $7,
        last_purchase_at = $8,
        updated_at = NOW()
      WHERE id = $1
    `;

    await db.query(updateQuery, [
      profileId,
      metrics.total_orders || 0,
      metrics.total_spent || 0,
      metrics.avg_order_value || 0,
      metrics.total_spent || 0, // Simple LTV = total_spent for now
      metrics.first_seen || new Date(),
      metrics.last_seen || new Date(),
      metrics.last_purchase,
    ]);

    logger.info('Profile metrics calculated', {
      profile_id: profileId,
      total_orders: metrics.total_orders,
      total_spent: metrics.total_spent,
    });
  } catch (error) {
    logger.error('Failed to calculate metrics', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

