#!/usr/bin/env ts-node
/**
 * Recalculate all customer profile metrics (total_spent, LTV, total_orders, etc.)
 * Based on order_placed events in customer_raw_event table
 */

import { initDb, getDb } from '@retail-brain/db';
import { dbConfig } from '@retail-brain/config';
import { createLogger } from '@retail-brain/logger';

const logger = createLogger({
  service: 'recalculate-metrics',
  level: 'info',
});

async function recalculateAllMetrics() {
  try {
    logger.info('Connecting to database...');
    const db = initDb(dbConfig);
    await db.connect();
    logger.info('Database connected');

    logger.info('🔄 Starting recalculation of all profile metrics...');

    // Get all profiles
    const profilesResult = await db.query(`
      SELECT id, primary_phone, primary_email
      FROM customer_profile
      WHERE is_merged = false
    `);

    const profiles = profilesResult.rows;
    logger.info(`Found ${profiles.length} profiles to update`);

    let updated = 0;
    let errors = 0;

    for (const profile of profiles) {
      try {
        // Calculate metrics from order_placed events
        // Look for events with matching identifiers
        const metricsQuery = `
          WITH profile_events AS (
            SELECT *
            FROM customer_raw_event
            WHERE event_type = 'order_placed'
              AND (
                (identifiers->>'phone' = $1 AND $1 IS NOT NULL)
                OR (identifiers->>'email' = $2 AND $2 IS NOT NULL)
              )
          )
          SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM((payload->>'total')::numeric), 0) as total_spent,
            COALESCE(AVG((payload->>'total')::numeric), 0) as avg_order_value,
            MIN(event_ts) as first_seen,
            MAX(event_ts) as last_seen,
            MAX(event_ts) as last_purchase
          FROM profile_events
        `;

        const metricsResult = await db.query(metricsQuery, [
          profile.primary_phone,
          profile.primary_email,
        ]);

        const metrics = metricsResult.rows[0];

        // Update profile
        const updateQuery = `
          UPDATE customer_profile
          SET 
            total_orders = $2,
            total_spent = $3,
            avg_order_value = $4,
            ltv = $5,
            first_seen_at = COALESCE($6, first_seen_at),
            last_seen_at = COALESCE($7, last_seen_at),
            last_purchase_at = $8,
            updated_at = NOW()
          WHERE id = $1
        `;

        await db.query(updateQuery, [
          profile.id,
          parseInt(metrics.total_orders) || 0,
          parseFloat(metrics.total_spent) || 0,
          parseFloat(metrics.avg_order_value) || 0,
          parseFloat(metrics.total_spent) || 0, // LTV = total_spent for now
          metrics.first_seen || null,
          metrics.last_seen || null,
          metrics.last_purchase || null,
        ]);

        updated++;
        if (updated % 100 === 0) {
          logger.info(`Progress: ${updated}/${profiles.length} profiles updated...`);
        }
      } catch (error) {
        errors++;
        logger.warn(`Failed to update profile ${profile.id}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('✅ Metrics recalculation complete!');
    console.log('\n📊 Summary:');
    console.log(`   ✅ Updated: ${updated} profiles`);
    console.log(`   ❌ Errors: ${errors} profiles`);
    console.log(`   📈 Total profiles: ${profiles.length}`);

    // Show sample stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_profiles,
        SUM(total_orders) as total_orders_sum,
        SUM(total_spent) as total_spent_sum,
        AVG(total_spent) as avg_spent,
        MAX(total_spent) as max_spent
      FROM customer_profile
      WHERE is_merged = false
    `;

    const statsResult = await db.query(statsQuery);
    const stats = statsResult.rows[0];

    console.log('\n📈 Overall Statistics:');
    console.log(`   Total Profiles: ${stats.total_profiles}`);
    console.log(`   Total Orders: ${stats.total_orders_sum}`);
    console.log(`   Total Spent: ₹${parseFloat(stats.total_spent_sum || '0').toLocaleString()}`);
    console.log(`   Average Spent: ₹${parseFloat(stats.avg_spent || '0').toLocaleString()}`);
    console.log(`   Max Spent: ₹${parseFloat(stats.max_spent || '0').toLocaleString()}`);

  } catch (error) {
    logger.error('Failed to recalculate metrics', error instanceof Error ? error : new Error(String(error)));
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the recalculation
recalculateAllMetrics()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

