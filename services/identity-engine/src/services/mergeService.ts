/**
 * Merge Service
 * Handles profile merging with snapshots and rollback
 */
import { getDb } from '@retail-brain/db';
import { createLogger } from '@retail-brain/logger';
import { MergeStatus } from '@retail-brain/types';
import { calculateScoringDetails } from './scoringEngine';

const logger = createLogger({
  service: 'merge-service',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Merge two profiles
 * Returns the target (surviving) profile ID
 */
export async function mergeProfiles(
  sourceProfileId: string,
  targetProfileId: string,
  confidenceScore: number,
  mergeType: 'auto' | 'manual',
  triggeredBy?: string
): Promise<string> {
  const db = getDb();

  return await db.transaction(async (client) => {
    try {
      logger.info('Starting profile merge', {
        source: sourceProfileId,
        target: targetProfileId,
        confidence: confidenceScore,
        type: mergeType,
      });

      // Step 1: Take snapshots of both profiles
      const snapshotQuery = `
        SELECT row_to_json(cp.*) as profile,
               array_agg(row_to_json(pi.*)) as identifiers
        FROM customer_profile cp
        LEFT JOIN profile_identifier pi ON pi.profile_id = cp.id
        WHERE cp.id = $1
        GROUP BY cp.id
      `;

      const sourceSnapshot = await client.query(snapshotQuery, [
        sourceProfileId,
      ]);
      const targetSnapshot = await client.query(snapshotQuery, [
        targetProfileId,
      ]);

      if (sourceSnapshot.rows.length === 0 || targetSnapshot.rows.length === 0) {
        throw new Error('One or both profiles not found');
      }

      // Step 2: Get scoring details
      const scoringDetails = await calculateScoringDetails(
        sourceProfileId,
        targetProfileId,
        {} as any // Already calculated
      );

      // Step 3: Log the merge with snapshots
      const mergeLogQuery = `
        INSERT INTO identity_merge_log (
          source_profile_id,
          target_profile_id,
          source_snapshot,
          target_snapshot,
          merge_type,
          confidence_score,
          scoring_details,
          reason,
          triggered_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;

      const mergeLog = await client.query(mergeLogQuery, [
        sourceProfileId,
        targetProfileId,
        JSON.stringify(sourceSnapshot.rows[0]),
        JSON.stringify(targetSnapshot.rows[0]),
        mergeType,
        confidenceScore,
        JSON.stringify(scoringDetails),
        `${mergeType === 'auto' ? 'Auto' : 'Manual'} merge with confidence ${confidenceScore}`,
        triggeredBy || 'system',
      ]);

      logger.info('Merge snapshot created', {
        merge_log_id: mergeLog.rows[0].id,
      });

      // Step 4: Move all identifiers from source to target
      const moveIdentifiersQuery = `
        UPDATE profile_identifier
        SET profile_id = $1, updated_at = NOW()
        WHERE profile_id = $2
      `;

      await client.query(moveIdentifiersQuery, [targetProfileId, sourceProfileId]);

      // Step 5: Move all events from source to target
      const moveEventsQuery = `
        UPDATE events
        SET profile_id = $1
        WHERE profile_id = $2
      `;

      await client.query(moveEventsQuery, [targetProfileId, sourceProfileId]);

      // Step 6: Update source profile metrics before merging
      const updateTargetQuery = `
        UPDATE customer_profile
        SET 
          total_orders = total_orders + (
            SELECT total_orders FROM customer_profile WHERE id = $2
          ),
          total_spent = total_spent + (
            SELECT total_spent FROM customer_profile WHERE id = $2
          ),
          first_seen_at = LEAST(first_seen_at, (
            SELECT first_seen_at FROM customer_profile WHERE id = $2
          )),
          last_seen_at = GREATEST(last_seen_at, (
            SELECT last_seen_at FROM customer_profile WHERE id = $2
          )),
          updated_at = NOW()
        WHERE id = $1
      `;

      await client.query(updateTargetQuery, [targetProfileId, sourceProfileId]);

      // Step 7: Mark source profile as merged
      const markMergedQuery = `
        UPDATE customer_profile
        SET is_merged = true,
            merged_into = $1,
            updated_at = NOW()
        WHERE id = $2
      `;

      await client.query(markMergedQuery, [targetProfileId, sourceProfileId]);

      // Step 8: Recalculate target profile metrics
      await recalculateProfileMetrics(client, targetProfileId);

      logger.info('Profile merge completed successfully', {
        source: sourceProfileId,
        target: targetProfileId,
        merge_log_id: mergeLog.rows[0].id,
      });

      return targetProfileId;
    } catch (error) {
      logger.error(
        'Profile merge failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          source: sourceProfileId,
          target: targetProfileId,
        }
      );
      throw error;
    }
  });
}

/**
 * Rollback a merge
 */
export async function rollbackMergeById(
  mergeLogId: string,
  reason: string,
  rolledBackBy?: string
): Promise<void> {
  const db = getDb();

  await db.transaction(async (client) => {
    try {
      logger.info('Starting merge rollback', { merge_log_id: mergeLogId });

      // Get merge log
      const logQuery = `
        SELECT 
          source_profile_id,
          target_profile_id,
          source_snapshot,
          target_snapshot,
          rolled_back
        FROM identity_merge_log
        WHERE id = $1
      `;

      const logResult = await client.query(logQuery, [mergeLogId]);

      if (logResult.rows.length === 0) {
        throw new Error('Merge log not found');
      }

      const log = logResult.rows[0];

      if (log.rolled_back) {
        throw new Error('Merge already rolled back');
      }

      // Restore source profile
      const sourceData = log.source_snapshot.profile;
      const restoreSourceQuery = `
        UPDATE customer_profile
        SET 
          first_name = $2,
          last_name = $3,
          full_name = $4,
          primary_phone = $5,
          primary_email = $6,
          ltv = $7,
          total_orders = $8,
          total_spent = $9,
          is_merged = false,
          merged_into = NULL,
          updated_at = NOW()
        WHERE id = $1
      `;

      await client.query(restoreSourceQuery, [
        log.source_profile_id,
        sourceData.first_name,
        sourceData.last_name,
        sourceData.full_name,
        sourceData.primary_phone,
        sourceData.primary_email,
        sourceData.ltv,
        sourceData.total_orders,
        sourceData.total_spent,
      ]);

      // Move identifiers back
      const originalIdentifiers = log.source_snapshot.identifiers;
      for (const identifier of originalIdentifiers) {
        if (identifier) {
          const moveBackQuery = `
            UPDATE profile_identifier
            SET profile_id = $1
            WHERE id = $2
          `;
          await client.query(moveBackQuery, [
            log.source_profile_id,
            identifier.id,
          ]);
        }
      }

      // Mark merge as rolled back
      const markRolledBackQuery = `
        UPDATE identity_merge_log
        SET 
          rolled_back = true,
          rolled_back_at = NOW(),
          rolled_back_by = $2,
          rollback_reason = $3
        WHERE id = $1
      `;

      await client.query(markRolledBackQuery, [
        mergeLogId,
        rolledBackBy || 'system',
        reason,
      ]);

      // Recalculate both profiles
      await recalculateProfileMetrics(client, log.source_profile_id);
      await recalculateProfileMetrics(client, log.target_profile_id);

      logger.info('Merge rollback completed', {
        merge_log_id: mergeLogId,
        source_profile_id: log.source_profile_id,
        target_profile_id: log.target_profile_id,
      });
    } catch (error) {
      logger.error(
        'Merge rollback failed',
        error instanceof Error ? error : new Error(String(error)),
        { merge_log_id: mergeLogId }
      );
      throw error;
    }
  });
}

/**
 * Recalculate profile metrics
 */
async function recalculateProfileMetrics(
  client: any,
  profileId: string
): Promise<void> {
  const query = `
    UPDATE customer_profile
    SET 
      total_orders = (
        SELECT COUNT(DISTINCT event_id)
        FROM events
        WHERE profile_id = $1 AND event_type = 'purchase'
      ),
      total_spent = (
        SELECT COALESCE(SUM(revenue), 0)
        FROM events
        WHERE profile_id = $1 AND event_type = 'purchase'
      ),
      avg_order_value = (
        SELECT COALESCE(AVG(revenue), 0)
        FROM events
        WHERE profile_id = $1 AND event_type = 'purchase' AND revenue > 0
      ),
      last_purchase_at = (
        SELECT MAX(event_ts)
        FROM events
        WHERE profile_id = $1 AND event_type = 'purchase'
      ),
      updated_at = NOW()
    WHERE id = $1
  `;

  await client.query(query, [profileId]);

  // Calculate LTV (simple: total_spent for now, can be enhanced)
  const ltvQuery = `
    UPDATE customer_profile
    SET ltv = total_spent
    WHERE id = $1
  `;

  await client.query(ltvQuery, [profileId]);
}

