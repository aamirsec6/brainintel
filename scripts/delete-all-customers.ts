#!/usr/bin/env ts-node
/**
 * Delete all customer data from the database
 * This will remove:
 * - Customer profiles
 * - Identifiers
 * - Events (raw and processed)
 * - Merge logs
 * - Journey data
 * - All related customer data
 */

import { initDb, getDb } from '@retail-brain/db';
import { dbConfig } from '@retail-brain/config';
import { createLogger } from '@retail-brain/logger';

const logger = createLogger({
  service: 'delete-customers',
  level: 'info',
});

async function deleteAllCustomers() {
  try {
    logger.info('Connecting to database...');
    const db = initDb(dbConfig);
    await db.connect();
    logger.info('Database connected');

    logger.info('🗑️  Starting deletion of all customer data...');

    // Get counts before deletion
    const countsBefore = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM customer_profile) as profiles,
        (SELECT COUNT(*) FROM profile_identifier) as identifiers,
        (SELECT COUNT(*) FROM customer_raw_event) as raw_events,
        (SELECT COUNT(*) FROM events) as events,
        (SELECT COUNT(*) FROM identity_merge_log) as merge_logs,
        (SELECT COUNT(*) FROM customer_journey) as journeys
    `);

    const before = countsBefore.rows[0];
    logger.info('📊 Current data counts:', {
      profiles: before.profiles,
      identifiers: before.identifiers,
      raw_events: before.raw_events,
      events: before.events,
      merge_logs: before.merge_logs,
      journeys: before.journeys,
    });

    // Delete in order (respecting foreign keys)
    // Start with tables that reference customer_profile
    logger.info('Deleting journey data...');
    await db.query('TRUNCATE TABLE customer_journey CASCADE');

    logger.info('Deleting processed events...');
    await db.query('TRUNCATE TABLE events CASCADE');

    logger.info('Deleting profile identifiers...');
    await db.query('TRUNCATE TABLE profile_identifier CASCADE');

    logger.info('Deleting identity merge logs...');
    await db.query('TRUNCATE TABLE identity_merge_log CASCADE');

    logger.info('Deleting customer profiles...');
    await db.query('TRUNCATE TABLE customer_profile CASCADE');

    logger.info('Deleting raw events...');
    await db.query('TRUNCATE TABLE customer_raw_event CASCADE');

    // Reset sequences
    logger.info('Resetting sequences...');
    await db.query(`
      ALTER SEQUENCE IF EXISTS customer_profile_id_seq RESTART WITH 1;
    `);

    // Verify deletion
    const countsAfter = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM customer_profile) as profiles,
        (SELECT COUNT(*) FROM profile_identifier) as identifiers,
        (SELECT COUNT(*) FROM customer_raw_event) as raw_events,
        (SELECT COUNT(*) FROM events) as events,
        (SELECT COUNT(*) FROM identity_merge_log) as merge_logs,
        (SELECT COUNT(*) FROM customer_journey) as journeys
    `);

    const after = countsAfter.rows[0];
    logger.info('✅ Deletion complete!');
    logger.info('📊 Final counts:', {
      profiles: after.profiles,
      identifiers: after.identifiers,
      raw_events: after.raw_events,
      events: after.events,
      merge_logs: after.merge_logs,
      journeys: after.journeys,
    });

    console.log('\n✅ All customer data deleted successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Profiles deleted: ${before.profiles}`);
    console.log(`   Identifiers deleted: ${before.identifiers}`);
    console.log(`   Raw events deleted: ${before.raw_events}`);
    console.log(`   Processed events deleted: ${before.events}`);
    console.log(`   Merge logs deleted: ${before.merge_logs}`);
    console.log(`   Journeys deleted: ${before.journeys}`);
    console.log('\n💡 Dashboard will now show "No customers found"');

  } catch (error) {
    logger.error('Failed to delete customers', error instanceof Error ? error : new Error(String(error)));
    console.error('\n❌ Error deleting customers:', error);
    process.exit(1);
  }
}

// Run the deletion
deleteAllCustomers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

